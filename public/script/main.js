


// Menu navegação dinamicamente
// Menu navegação dinamicamente
fetch("nav.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("nav-placeholder").innerHTML = data;

    // ⬇️ Após carregar o nav, agora sim executa o código da sessão
    fetch("/sessao")
      .then(res => res.json())
      .then(dados => {
        const span = document.getElementById("mensagemUsuario");
        if (!span) return;

        if (dados.logado) {
          span.innerHTML = `Olá ${dados.nome}. - <a href="#" id="sairLink"><img src="imagens/sair.png" alt="Sair" class="imagem_sair" ></a>`;

          document.getElementById("sairLink").addEventListener("click", async (e) => {
            e.preventDefault();
            await fetch("/logout", { method: "POST" });
            window.location.href = "/login";
          });
        }
      });
  });


fetch("ferramentas.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("ferramentas").innerHTML = data;
    import('./ferramentas.js'); // ← carregar script após inserir o HTML
  });



// footer dinamicamente
fetch("footer.html")
.then(res => res.text())
.then(data => {
  document.getElementById("footer-placeholder").innerHTML = data;
});

// Detecta a rota atual
const rotaAtual = window.location.pathname;

// Carrega scripts específicos com base na página
if (rotaAtual.includes("ticket")) {
  import('./ticket.js').then(() => {
    console.log("📥 Script do formulário carregado.");
  });
} else if (rotaAtual.includes("relatorio")) {
  import('./relatorio.js').then(() => {
    console.log("📥 Script do relatório carregado.");
  });
} else if (rotaAtual.includes("tenants_clientes")) {
  import('./tenants_clientes.js').then(() => {
    console.log("📥 Script dos tenants carregado.");
  });
}
else if (rotaAtual.includes("ferramentas")) {
  import('./ferramentas.js').then(() => {
    console.log("📥 Script dos ferramentas carregado.");
  });
}

else if (rotaAtual.includes("usuarios")) {
  import('./usuarios.js').then(() => {
    console.log("📥 Script dos usuarios carregado.");
  });
}

else if (rotaAtual.includes("churn")) {
  import('./churn.js').then(() => {
    console.log("📥 Script dos churns carregados.");
  });
}
else if (rotaAtual.includes("apresentacao")) {
  import('./apresentacao.js').then(() => {
    console.log("📥 Script dos apresentacao carregados.");
  });
}
else if (rotaAtual.includes("razao_social")) {
  import('./razao_social.js').then(() => {
    console.log("📥 Script dos apresentacao carregados.");
  });
}



