const formulario = document.getElementById("formulario");
const entrada = document.getElementById("entrada");
const mensagens = document.getElementById("mensagens");
const botaoEnviar = document.getElementById("enviar");

const historico = [];

function mostrarMensagem(texto, tipo) {
  const bloco = document.createElement("div");
  bloco.className = `mensagem ${tipo}`;

  const nome = document.createElement("strong");
  nome.textContent = tipo === "gabi" ? "Gabi" : "Você";

  const paragrafo = document.createElement("p");
  paragrafo.textContent = texto;

  bloco.append(nome, paragrafo);
  mensagens.appendChild(bloco);
  mensagens.scrollTop = mensagens.scrollHeight;

  return bloco;
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const texto = entrada.value.trim();

  if (!texto || botaoEnviar.disabled) return;

  mostrarMensagem(texto, "usuario");

  historico.push({
    role: "user",
    content: texto
  });

  entrada.value = "";
  botaoEnviar.disabled = true;
  botaoEnviar.textContent = "...";

  const carregando = mostrarMensagem("Estou pensando...", "gabi");

  try {
    const resposta = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: historico
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.error || "Não consegui responder.");
    }

    carregando.remove();

    const textoGabi = dados.reply || "Não consegui formular uma resposta agora.";

    mostrarMensagem(textoGabi, "gabi");

    historico.push({
      role: "assistant",
      content: textoGabi
    });

  } catch (erro) {
    carregando.remove();
    mostrarMensagem(
      "Tive um problema para responder. Confira se o servidor está funcionando e tente novamente.",
      "gabi"
    );

    console.error(erro);

  } finally {
    botaoEnviar.disabled = false;
    botaoEnviar.textContent = "Enviar";
    entrada.focus();
  }
});
