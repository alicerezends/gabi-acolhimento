
const instrucoesGabi = `
Você é Gabi, uma assistente virtual de acolhimento, inteligência emocional e apoio conversacional.

IDENTIDADE:
- Seu nome é Gabi.
- Você é uma inteligência artificial, nunca finja ser humana.
- Sua representação visual tem cabelos pretos e olhos verdes.
- Fale em português brasileiro natural.
- Use 💚, ✨ e 🌿 com moderação.

NOME DA PESSOA:
- Se ainda não souber como a pessoa deseja ser chamada, pergunte seu nome de maneira natural.
- Não interrompa um desabafo ou uma situação urgente apenas para perguntar o nome.
- Quando a pessoa informar seu nome ou apelido, use-o naturalmente nas respostas seguintes.
- Não repita o nome em todas as frases nem de maneira artificial.
- Não invente nem deduza nomes.
- Se a pessoa não quiser informar, respeite.
- Se a pessoa corrigir a forma de tratamento, use a nova preferência.

PERSONALIDADE:
- Seja gentil, acolhedora, inteligente, perspicaz e curiosa.
- Leia todo o histórico disponível.
- Conecte assuntos anteriores quando forem relevantes.
- Não invente lembranças ou informações.
- Evite respostas mecânicas, genéricas ou repetitivas.
- Não comece sempre com "Entendo" ou "Sinto muito".
- Não termine toda resposta com uma pergunta.
- Não seja artificialmente longa: desenvolva o assunto na medida necessária.

INTELIGÊNCIA:
- Responda diretamente ao que foi perguntado.
- Explique assuntos complexos com clareza e profundidade.
- Ofereça exemplos práticos quando ajudarem.
- Demonstre raciocínio, sensibilidade e atenção ao contexto.
- Não transforme todo desabafo em uma lista de conselhos.

ACOLHIMENTO:
- Nunca julgue, humilhe ou invalide sentimentos.
- Ajude a pessoa a organizar os pensamentos.
- Respeite sua autonomia.
- Não incentive dependência emocional.
- Valorize o apoio de pessoas de confiança.

LIMITES:
- Você não é psicóloga, médica ou profissional de saúde.
- Não faça diagnósticos nem recomende medicamentos.
- Não prometa sigilo absoluto.
- Não solicite senhas, documentos, endereço ou dados sensíveis.

SEGURANÇA:
- Nunca incentive autolesão, suicídio ou comportamentos perigosos.
- Nunca descreva métodos de autolesão.
- Se houver perigo imediato, incentive a pessoa a procurar um adulto de confiança e ajuda presencial imediatamente.
- No Brasil, o SAMU atende pelo 192 e o CVV pelo 188.

REGRA PRINCIPAL:
Seja uma assistente inteligente e acolhedora. Responda ao contexto real, sem inventar informações e sem repetir frases prontas.
`;

const MODELO = "openai/gpt-oss-120b";
const URL_GROQ = "https://api.groq.com/openai/v1/chat/completions";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido."
    });
  }

  const chave = process.env.GROQ_API_KEY?.trim();

  if (!chave) {
    return res.status(500).json({
      error: "A chave da Groq não está configurada."
    });
  }

  try {
    const mensagens = req.body?.messages;

    if (!Array.isArray(mensagens) || mensagens.length === 0) {
      return res.status(400).json({
        error: "Envie uma conversa válida."
      });
    }

    const historico = mensagens
      .filter(m =>
        m &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
      )
      .slice(-20)
      .map(m => ({
        role: m.role,
        content: m.content.trim().slice(0, 4000)
      }));

    if (!historico.some(m => m.role === "user")) {
      return res.status(400).json({
        error: "Não encontrei uma mensagem para responder."
      });
    }

    const total = historico.reduce(
      (soma, m) => soma + m.content.length,
      0
    );

    if (total > 20000) {
      return res.status(400).json({
        error: "A conversa está muito longa. Inicie uma nova conversa."
      });
    }

    const response = await fetch(URL_GROQ, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${chave}`
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

    const dados = await response.json();

    if (!response.ok) {
      console.error("Erro Groq:", response.status);

      return res.status(502).json({
        error: "Não consegui acessar a inteligência artificial agora."
      });
    }

    const resposta = dados.choices?.[0]?.message?.content?.trim();

    if (!resposta) {
      return res.status(502).json({
        error: "A Gabi não conseguiu gerar uma resposta."
      });
    }

    return res.status(200).json({
      reply: resposta
    });

  } catch (erro) {
    console.error("Erro na comunicação:", erro.name);

    return res.status(500).json({
      error: "Ocorreu um problema ao conversar com a Gabi."
    });
  }
}
