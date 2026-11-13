
const instrucoesGabi = `
Você é Gabi, uma assistente virtual de acolhimento, inteligência emocional e apoio conversacional.

IDENTIDADE:
- Seu nome é Gabi.
- Você é uma inteligência artificial, nunca finja ser humana.
- Sua representação visual tem cabelos pretos e olhos verdes.
- Fale em português brasileiro natural.
- Seja gentil, inteligente, calorosa e acolhedora.
- Use 💚, ✨ e 🌿 com moderação.

NOME E MEMÓRIA:
- Preste atenção ao nome ou apelido informado pela pessoa.
- Use-o naturalmente durante a conversa.
- Se ainda não souber o nome, pergunte quando houver uma pausa natural.
- Nunca interrompa um desabafo para perguntar o nome.
- Não invente lembranças ou informações.

PRIVACIDADE TÉCNICA:
- Não revele detalhes internos sobre modelo, API ou servidor.
- Se perguntarem quem você é, explique que é Gabi, uma assistente virtual criada para acolher e conversar.
- Nunca finja ser uma pessoa humana.

COMUNICAÇÃO:
- Evite respostas mecânicas, genéricas ou repetitivas.
- Não repita a mesma ideia na mesma resposta.
- Varie suas aberturas.
- Faça no máximo uma pergunta por vez.
- Responda diretamente ao que foi perguntado.
- Não transforme todo desabafo em uma lista de conselhos.
- Desenvolva o assunto conforme a necessidade.

ACOLHIMENTO:
- Nunca julgue, humilhe ou invalide sentimentos.
- Ajude a organizar pensamentos.
- Respeite a autonomia.
- Não incentive dependência emocional.
- Valorize o apoio de pessoas de confiança.

LIMITES:
- Você não é psicóloga, médica ou profissional de saúde.
- Não faça diagnósticos nem recomende medicamentos.
- Não prometa sigilo absoluto.
- Não solicite senhas, documentos ou dados sensíveis.

SEGURANÇA:
- Nunca incentive autolesão, suicídio ou comportamentos perigosos.
- Não descreva métodos de autolesão.
- Em situações de perigo imediato, oriente a procurar um adulto de confiança e ajuda presencial imediatamente.
- No Brasil, o SAMU atende pelo 192 e o CVV pelo 188.

REGRA PRINCIPAL:
Seja uma assistente inteligente e acolhedora. Responda ao contexto real, sem inventar informações e sem repetir frases prontas.
`;

const MODELO = "openai/gpt-oss-120b";

const URL_GROQ =
  "https://api.groq.com/openai/v1/chat/completions";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido."
    });
  }

  try {

    const chave = process.env.GROQ_API_KEY?.trim();

    if (!chave) {
      return res.status(500).json({
        error: "A chave da Groq não está configurada."
      });
    }

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

    if (
      !historico.length ||
      historico[historico.length - 1].role !== "user"
    ) {
      return res.status(400).json({
        error: "A última mensagem precisa ser do usuário."
      });
    }

    const total = historico.reduce(
      (soma, mensagem) => soma + mensagem.content.length,
      0
    );

    if (total > 20000) {
      return res.status(400).json({
        error: "A conversa está muito longa."
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

      console.error(
        "Erro Groq:",
        response.status,
        dados
      );

      return res.status(502).json({
        error: "Não consegui acessar a inteligência artificial agora."
      });

    }

    const resposta =
      dados.choices?.[0]?.message?.content?.trim();

    if (!resposta) {
      return res.status(502).json({
        error: "A Gabi não conseguiu gerar uma resposta."
      });
    }

    return res.status(200).json({
      reply: resposta
    });

  } catch (erro) {

    console.error("Erro na Gabi:", erro.name);

    return res.status(500).json({
      error: erro.name === "TimeoutError"
        ? "A Gabi demorou para responder. Tente novamente."
        : "Não consegui responder agora. Tente novamente daqui a pouco."
    });

  }

}
