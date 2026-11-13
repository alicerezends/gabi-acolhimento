
const formulario = document.getElementById("formulario");
const entrada = document.getElementById("entrada");
const mensagens = document.getElementById("mensagens");

const historico = [];

function adicionarMensagem(texto, tipo) {
  const linha = document.createElement("div");
  linha.className = `linha ${tipo}-linha`;

  if (tipo === "bot") {
    const avatar = document.createElement("div");
    avatar.className = "mini-avatar";
    avatar.textContent = "G";
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

function mostrarDigitando() {
  const linha = document.createElement("div");
  linha.className = "linha bot-linha";
  linha.id = "indicador";

  const avatar = document.createElement("div");
  avatar.className = "mini-avatar";
  avatar.textContent = "G";

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
}

async function enviarMensagem(texto) {
  const mensagem = texto.trim();

  if (!mensagem) return;

  entrada.disabled = true;

  adicionarMensagem(mensagem, "user");

  historico.push({
    role: "user",
    content: mensagem
  });

  entrada.value = "";
  mostrarDigitando();

  try {
    const resposta = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: historico.slice(-16)
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.error || "Erro ao conversar com a Gabi.");
    }

    const textoGabi = dados.reply;

    historico.push({
      role: "assistant",
      content: textoGabi
    });

    document.getElementById("indicador")?.remove();
    adicionarMensagem(textoGabi, "bot");

  } catch (erro) {
    document.getElementById("indicador")?.remove();

    adicionarMensagem(
      "Tive um probleminha para responder agora. Verifique sua conexão e tente novamente. 💚",
      "bot"
    );

    console.error(erro);

    // Retira a mensagem que falhou do histórico.
    historico.pop();

  } finally {
    entrada.disabled = false;
    entrada.focus();
  }
}

formulario.addEventListener("submit", function(event) {
  event.preventDefault();
  enviarMensagem(entrada.value);
});

// Botões de sugestões, caso existam no HTML.
document.querySelectorAll(".sugestao").forEach(botao => {
  botao.addEventListener("click", function() {
    enviarMensagem(this.dataset.msg);
  });
});
