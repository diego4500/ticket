const form = document.getElementById("formUpload");

if (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const inputArquivo = document.getElementById("arquivo");
    const botao = form.querySelector("button[type='submit']");
    
    if (!inputArquivo.files.length) {
      alert("Selecione um arquivo.");
      return;
    }

    const formData = new FormData();
    formData.append("arquivo", inputArquivo.files[0]);

    try {
      const resposta = await fetch("/upload", {
        method: "POST",
        body: formData
      });

      const texto = await resposta.text();
      //alert(texto);

      // Remove classes antigas
      inputArquivo.classList.remove("sucesso-upload", "erro-upload");

      if (texto.includes("0") || texto.includes("Nenhum")) {
        inputArquivo.classList.add("erro-upload");
        botao.textContent = "Nada foi adicionado ❌";
      } else {
        inputArquivo.classList.add("sucesso-upload");
        botao.textContent = "Enviado ✅";
      }

      botao.disabled = true;

      setTimeout(() => {
        inputArquivo.classList.remove("sucesso-upload", "erro-upload");
        inputArquivo.value = "";
        botao.textContent = "Enviar";
        botao.disabled = false;
      }, 4000);

    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao enviar o arquivo.");
    }
  });
}
