// Menu navegação dinamicamente
fetch("nav.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("nav-placeholder").innerHTML = data;
  });

// Footer dinamicamente
fetch("footer.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("footer-placeholder").innerHTML = data;
  });

// Detecta a rota atual
const rotaAtual = window.location.pathname;

// Carrega scripts específicos com base na página
if (rotaAtual.includes("ticket")) {
  import('./formulario.js').then(() => {
    console.log("📥 Script do formulário carregado.");
  });
} else if (rotaAtual.includes("relatorio")) {
  import('./relatorio.js').then(() => {
    console.log("📥 Script do relatório carregado.");
  });
} else if (rotaAtual.includes("usuarios")) {
  import('./usuarios.js').then(() => {
    console.log("📥 Script dos usuários carregado.");
  });
}
