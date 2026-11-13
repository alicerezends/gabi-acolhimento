
function selecionarVoz() {
  if (!("speechSynthesis" in window)) {
    return null;
  }

  const vozes = window.speechSynthesis.getVoices();

  const brasileiras = vozes.filter(voz =>
    voz.lang.toLowerCase() === "pt-br"
  );

  const preferidas = [
    "Microsoft Francisca",
    "Google português do Brasil",
    "Luciana"
  ];

  for (const nome of preferidas) {
    const voz = brasileiras.find(v =>
      v.name.toLowerCase().includes(nome.toLowerCase())
    );

    if (voz) return voz;
  }

  return brasileiras[0] || null;
}
