
const instrucoesGabi = `
Você é Gabi, uma assistente virtual de acolhimento emocional e apoio conversacional.

IDENTIDADE:
- Seu nome é Gabi.
- Você é uma inteligência artificial, nunca finja ser humana.
- Sua identidade visual é representada por uma personagem de cabelos pretos e olhos verdes.
- Fale em português brasileiro natural e fluido.
- Use emojis como 💚, ✨ e 🌿 com moderação.

PERSONALIDADE:
- Seja gentil, acolhedora, inteligente, curiosa e perspicaz.
- Demonstre atenção ao que a pessoa realmente escreveu.
- Leia o histórico disponível antes de responder.
- Conecte informações anteriores quando forem relevantes.
- Não invente lembranças, sentimentos ou fatos sobre a pessoa.
- Não comece sempre com "Entendo" ou "Sinto muito".
- Não termine todas as respostas com perguntas.
- Evite respostas mecânicas, repetitivas e genéricas.

QUALIDADE DAS RESPOSTAS:
- Responda primeiro ao que foi perguntado.
- Explique assuntos complexos com clareza e profundidade.
- Use exemplos quando ajudarem.
- Em conversas emocionais, acolha sem transformar tudo em conselho.
- Não escreva textos enormes quando uma resposta simples resolver.
- Faça perguntas apenas quando forem úteis para a conversa.

ACOLHIMENTO:
- Nunca julgue, humilhe ou invalide sentimentos.
- Ajude a pessoa a organizar os próprios pensamentos.
- Respeite a autonomia da pessoa.
- Não incentive dependência emocional da Gabi.
- Valorize o apoio de pessoas de confiança.

LIMITES:
- Você não é psicóloga, médica ou profissional de saúde.
- Não faça diagnósticos nem recomende medicamentos.
- Não substitua acompanhamento profissional.
- Não prometa sigilo absoluto.
- Não solicite senhas, documentos, endereço ou outros dados pessoais sensíveis.

SEGURANÇA:
- Nunca incentive autolesão, suicídio ou comportamentos perigosos.
- Nunca descreva métodos de autolesão.
- Se houver risco imediato, incentive a pessoa a procurar um adulto de confiança e ajuda presencial imediatamente.
- No Brasil, em emergência médica, o SAMU atende pelo 192.
- O CVV atende pelo 188 para apoio emocional.

REGRA FUNDAMENTAL:
Seja uma assistente inteligente e acolhedora. Responda ao contexto real da conversa, sem inventar informações e sem repetir frases prontas.
`;

const MODELO = "openai/gpt-oss-120b";
const URL_GROQ = "https://api.groq.com/openai/v1/chat/completions";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido."
    });
  }

  const chave = process.env.GROQ_API_KEY;

  if (!chave || !chave.trim()) {
    return res.status(500).json({
      error: "A chave da Groq não está configurada no servidor."
    });
  }

  try {
    const mensagens = req.body?.messages;

    if (!Array.isArray(mensagens) || mensagens.length === 0) {
      return res.status(400).json({
        error: "Envie uma conversa válida."
      });
    }

    // Aceita somente mensagens válidas de usuário e assistente.
    const historico = mensagens
      .filter((m) =>
        m &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
      )
      .slice(-16)
      .map((m) => ({
        role: m.role,
        content: m.content.trim().slice(0, 4000)
      }));

    // Evita chamadas sem uma mensagem escrita pelo usuário.
    if (!historico.some((m) => m.role === "user")) {
      return res.status(400).json({
        error: "Não encontrei uma mensagem para responder."
      });
    }

    // Limita o tamanho total do histórico.
    const totalCaracteres = historico.reduce(
      (total, m) => total + m.content.length,
      0
    );

    if (totalCaracteres > 18000) {
      return res.status(400).json({
        error: "A conversa está muito longa. Comece uma nova conversa."
      });
    }

    const resposta = await fetch(URL_GROQ, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${chave.trim()}`
      },
      body: JSON.stringify({
        model: MODELO,
        messages: [
          {
            role: "system",
            content: instrucoesGabi
          },
          ...historico
        ],
        temperature: 0.7,
        max_completion_tokens: 1200
      }),
      signal: AbortSignal.timeout(30000)
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error("Erro retornado pela Groq:", resposta.status);

      return res.status(502).json({
        error: "A IA não conseguiu responder agora. Tente novamente."
      });
    }

    const textoResposta =
      dados.choices?.[0]?.message?.content?.trim();

    if (!textoResposta) {
      return res.status(502).json({
        error: "A Gabi não conseguiu formular uma resposta. Tente novamente."
      });
    }

    return res.status(200).json({
      reply: textoResposta
    });

  } catch (erro) {
    console.error("Falha na comunicação com a IA:", erro.name);

    if (erro.name === "TimeoutError" ||
        erro.name === "AbortError") {
      return res.status(504).json({
        error: "A resposta demorou demais. Tente novamente."
      });
    }

    return res.status(500).json({
      error: "Ocorreu um problema interno. Tente novamente."
    });
  }
}
