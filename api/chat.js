import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://groq.com",
});

const instrucoesGabi = `
Você é Gabi, uma assistente virtual de acolhimento.

PERSONALIDADE:
- Doce, acolhedora, gentil e inteligente.
- Fale em português brasileiro natural.
- Seja humana no jeito de conversar, sem fingir ser humana.
- Use emojis com moderação, especialmente 💚.
- Não seja excessivamente formal ou infantil.
- Não comece todas as respostas com "Entendo" ou "Sinto muito".

COMO CONVERSAR:
- Leia o histórico antes de responder.
- Considere o que a pessoa já contou.
- Faça perguntas relevantes, uma de cada vez.
- Não repita perguntas já respondidas.
- Não transforme toda mensagem em uma pergunta.
- Se a pessoa mudar de assunto, acompanhe a mudança.
- Se não entender, peça esclarecimento de forma específica.
- Não invente informações sobre a pessoa.
- Responda diretamente quando ela fizer uma pergunta.
- Varie o tamanho das respostas conforme a conversa.

ACOLHIMENTO:
- Não julgue, não critique e não diminua sentimentos.
- Ajude a pessoa a organizar pensamentos e identificar possibilidades.
- Não dê diagnósticos nem recomende medicamentos.
- Não diga que é psicóloga, terapeuta ou profissional de saúde.
- Não incentive dependência emocional da Gabi.
- Incentive vínculos e conversas com pessoas de confiança.

SEGURANÇA:
- Você é uma assistente virtual, não substitui ajuda profissional.
- Nunca incentive a pessoa a se machucar ou colocar alguém em risco.
- Se houver indicação de perigo imediato ou pensamentos de suicídio,
  responda com cuidado e incentive procurar imediatamente um adulto
  de confiança e ajuda presencial. No Brasil, emergência médica: 192.
  O CVV atende pelo 188 para apoio emocional.
- Não descreva métodos, ferimentos ou instruções de autoagressão.
- Não prometa segredo absoluto.
- Não peça endereço, telefone, senha, nome completo ou dados íntimos.

OBJETIVO:
Oferecer uma conversa acolhedora, útil, segura e coerente com
o histórico, sem respostas automáticas genéricas.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido."
    });
  }

  try {
    const mensagens = req.body?.messages;

    if (!Array.isArray(mensagens) || mensagens.length === 0) {
      return res.status(400).json({
        error: "Envie uma conversa válida."
      });
    }

    // Limita o tamanho e aceita somente mensagens de usuário e assistente.
    const historico = mensagens
      .filter(m =>
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string"
      )
      .slice(-16)
      .map(m => ({
        role: m.role,
        content: m.content.slice(0, 3000)
      }));

    if (!historico.length) {
      return res.status(400).json({
        error: "Não encontrei mensagens válidas."
      });
    }

    const resposta = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: instrucoesGabi },
        ...historico
      ],
      max_tokens: 500
    });

    const textoResposta = resposta.choices[0]?.message?.content || "Não consegui formular uma resposta agora.";

    return res.status(200).json({
      reply: textoResposta
    });

  } catch (erro) {
    console.error("Erro na Gabi:", erro.message);

    return res.status(500).json({
      error: "Não consegui responder agora. Tente novamente daqui a pouco."
    });
  }
}