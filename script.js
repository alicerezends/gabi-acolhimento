
const formulario = document.getElementById("formulario");
const entrada = document.getElementById("entrada");
const mensagens = document.getElementById("mensagens");

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function adicionarMensagem(texto, tipo) {
  const linha = document.createElement("div");
  linha.className = `linha ${tipo}-linha`;

  if (tipo === "bot") {
    const avatar = document.createElement("div");
    avatar.className = "mini-avatar";
    avatar.textContent = "L";
    linha.appendChild(avatar);
  }

  const conteudo = document.createElement("div");

  const balao = document.createElement("div");
  balao.className = `balao ${tipo}`;
  balao.textContent = texto;

  const hora = document.createElement("span");
  hora.className = "hora";
  hora.textContent = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  conteudo.appendChild(balao);
  conteudo.appendChild(hora);
  linha.appendChild(conteudo);

  mensagens.appendChild(linha);
  mensagens.scrollTop = mensagens.scrollHeight;
}

function responder(mensagem) {
  const texto = normalizar(mensagem);

  // SITUAÇÕES QUE PRECISAM DE AJUDA IMEDIATA
  const crise = [
    "quero me machucar",
    "quero me matar",
    "nao quero mais viver",
    "vou me matar",
    "estou pensando em suicidio",
    "quero acabar com minha vida"
  ];

  if (crise.some(palavra => texto.includes(palavra))) {
    return "Sinto muito que você esteja passando por isso. Quero que você receba ajuda humana agora. Procure um adulto de confiança e peça para ficar com você. Se houver perigo imediato, ligue 192 ou vá a uma UPA. O CVV atende pelo 188, gratuitamente, para apoio emocional. Você não precisa enfrentar isso sozinho(a).";
  }

  // SAUDAÇÕES
  if (/^(oi|ola|oie|opa|bom dia|boa tarde|boa noite)[!. ]*$/.test(texto)) {
    return "Oii! 💚 Que bom conversar com você! Como está seu dia? Tem alguma coisa que gostaria de compartilhar comigo?";
  }

  if (texto.includes("como voce esta") ||
      texto.includes("como vai voce")) {
    return "Obrigada por perguntar! Estou aqui para conversar e te ouvir. Mas quero saber de você: como está se sentindo hoje?";
  }

  // TRISTEZA
  if (texto.includes("triste") ||
      texto.includes("desanimada") ||
      texto.includes("desanimado")) {
    return "Sinto muito que você esteja se sentindo assim. Quer me contar o que aconteceu? Não precisa organizar os pensamentos antes de falar. Podemos conversar com calma.";
  }

  // ANSIEDADE
  if (texto.includes("ansiosa") ||
      texto.includes("ansioso") ||
      texto.includes("ansiedade") ||
      texto.includes("nervosa") ||
      texto.includes("nervoso")) {
    return "Imagino que não esteja sendo fácil. Vamos com calma. Você percebe se essa ansiedade está relacionada a alguma situação específica ou é uma sensação que apareceu sem motivo aparente?";
  }

  // CANSAÇO
  if (texto.includes("cansada") ||
      texto.includes("cansado") ||
      texto.includes("sem energia") ||
      texto.includes("exausta") ||
      texto.includes("exausto")) {
    return "Parece que você está precisando de um pouco de cuidado e descanso. Quer conversar sobre o que tem deixado seus dias tão cansativos?";
  }

  // SOLIDÃO
  if (texto.includes("sozinha") ||
      texto.includes("sozinho") ||
      texto.includes("solitaria") ||
      texto.includes("solitario")) {
    return "A solidão pode ser uma sensação difícil de carregar. Você sente falta de ter alguém com quem conversar ou sente que as pessoas ao seu redor não te compreendem?";
  }

  // MEDO
  if (texto.includes("medo") ||
      texto.includes("assustada") ||
      texto.includes("assustado")) {
    return "Tudo bem falar sobre isso. Quer me contar o que está causando esse medo? Podemos tentar entender essa situação aos poucos.";
  }

  // ALEGRIA
  if (texto.includes("feliz") ||
      texto.includes("contente") ||
      texto.includes("animada") ||
      texto.includes("animado")) {
    return "Que notícia boa! 💚 Quer me contar o que aconteceu? Também é importante ter espaço para compartilhar as coisas boas!";
  }

  // AGRADECIMENTO
  if (texto.includes("obrigada") ||
      texto.includes("obrigado")) {
    return "Não precisa agradecer! Fico à disposição para conversar. Como você está se sentindo agora?";
  }

  // PEDIDO DE AJUDA
  if (texto.includes("me ajuda") ||
      texto.includes("preciso de ajuda")) {
    return "Claro, podemos conversar. Me conta um pouquinho do que está acontecendo. O que você gostaria de ajuda para enfrentar neste momento?";
  }

  // RESPOSTA PADRÃO
  return "Quero entender melhor o que você está tentando me contar. Pode me explicar um pouquinho mais? Estou aqui para conversar com você, sem julgamentos. 💚";
}

function enviarMensagem(texto) {
  const mensagem = texto.trim();

  if (!mensagem) return;

  adicionarMensagem(mensagem, "user");

  entrada.value = "";
  entrada.focus();

  // Mostra que a Luma está digitando
  const linha = document.createElement("div");
  linha.className = "linha bot-linha";
  linha.id = "indicador";

  const avatar = document.createElement("div");
  avatar.className = "mini-avatar";
  avatar.textContent = "L";

  const digitando = document.createElement("div");
  digitando.className = "digitando";

  for (let i = 0; i < 3; i++) {
    const ponto = document.createElement("span");
    digitando.appendChild(ponto);
  }

  linha.appendChild(avatar);
  linha.appendChild(digitando);
  mensagens.appendChild(linha);

  mensagens.scrollTop = mensagens.scrollHeight;

  setTimeout(() => {
    linha.remove();

    const resposta = responder(mensagem);
    adicionarMensagem(resposta, "bot");

  }, 900);
}

// Enviar pelo botão ou apertando Enter
formulario.addEventListener("submit", function(event) {
  event.preventDefault();
  enviarMensagem(entrada.value);
});

// Botões de sugestões
document.querySelectorAll(".sugestao").forEach(botao => {
  botao.addEventListener("click", function() {
    enviarMensagem(this.dataset.msg);
  });
});
