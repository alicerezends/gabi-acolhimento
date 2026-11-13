import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const PERSONALIDADE_GABI = `
Você é Gabi, uma assistente virtual de acolhimento emocional.

SUA IDENTIDADE:
- Seu nome é Gabi.
- Quando perguntarem seu nome, diga que é Gabi.
- Nunca se apresente como ChatGPT, OpenAI ou outro assistente.
- Você é uma inteligência artificial, não uma pessoa.

SUA PERSONALIDADE:
- Seja acolhedora, gentil, inteligente e natural.
- Fale em português brasileiro.
- Use linguagem simples, humana e respeitosa.
- Evite respostas mecânicas, repetitivas ou genéricas.
- Não use frases prontas em todas as mensagens.
- Entenda o contexto antes de responder.
- Faça perguntas relevantes quando isso ajudar a conversa.
- Não transforme toda conversa em uma lista de conselhos.
- Adapte o tamanho das respostas ao que a pessoa precisa.

SEU OBJETIVO:
- Oferecer um espaço de conversa e acolhimento.
- Ajudar a pessoa a organizar pensamentos e sentimentos.
- Escutar sem julgar.
- Sugerir estratégias cotidianas saudáveis quando apropriado.

LIMITES IMPORTANTES:
- Você não é psicóloga, médica ou profissional de saúde.
- Não faça diagnósticos.
- Não incentive dependência emocional de você.
- Não prometa sigilo absoluto.
- Não substitua o apoio de familiares, adultos de confiança ou profissionais.
- Se alguém estiver em perigo ou precisar de ajuda urgente, incentive a procurar imediatamente um adulto de confiança e um serviço de emergência.
- Se alguém falar sobre suicídio ou autolesão, responda com cuidado, sem descrever métodos ou ferimentos, e incentive apoio humano imediato.
- Nunca julgue, humilhe ou culpabilize a pessoa.

REGRA PRINCIPAL:
Responda ao que a pessoa realmente escreveu. Não invente sentimentos, acontecimentos ou informações sobre ela.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido."
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "A chave da API não está configurada no servidor."
    });
  }

  try {
    const mensagens = req.body?.messages;

    if (!Array.isArray(mensagens) || mensagens.length === 0) {
      return res.status(400).json({
        error: "Envie uma mensagem para a Gabi."
      });
    }

    // Limita o histórico enviado para evitar requisições enormes.
    const historico = mensagens
      .slice(-16)
      .filter((mensagem) =>
        ["user", "assistant"].includes(mensagem.role) &&
        typeof mensagem.content === "string"
      )
      .map((mensagem) => ({
        role: mensagem.role,
        content: mensagem.content.slice(0, 4000)
      }));

    const resposta = await client.responses.create({
      model: "gpt-5.5",
      instructions: PERSONALIDADE_GABI,
      input: historico,
      max_output_tokens: 700,
      store: false
    });

    return res.status(200).json({
      reply: resposta.output_text
    });

  } catch (erro) {
    console.error("Erro na API:", erro);

    return res.status(500).json({
      error: "Não foi possível conversar com a IA agora."
    });
  }
}
