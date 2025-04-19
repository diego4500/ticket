const seletor = document.getElementById("relatorio_ticket");
const mensagem = document.getElementById("mensagem-relatorio");
const tabelaContainer = document.getElementById("tabela-relatorio");

seletor.addEventListener("change", async (event) => {
  const valorSelecionado = event.target.value;

  mensagem.style.display = "none";
  const tabelaAntiga = tabelaContainer.querySelector("table");
  if (tabelaAntiga) tabelaAntiga.remove();

  let url = "";

  switch (valorSelecionado) {
    case "todos":
      url = "/tickets";
      break;
    case "abertos":
      url = "/tickets/abertos";
      break;
    case "fechados":
      url = "/tickets/fechados";
      break;
    default:
      console.warn("Valor não reconhecido.");
      return;
  }

  try {
    const resposta = await fetch(url);
    const dados = await resposta.json();

    if (!dados || dados.length === 0) {
      tabelaContainer.innerHTML = "<p style='margin-top: 20px;'>Nenhum dado encontrado.</p>";
      return;
    }

    const tabela = document.createElement("table");
    tabela.classList.add("tabela-relatorio");

    const cabecalho = tabela.insertRow();
    const colunas = ["ticket", "atendente", "razao_social", "tipo", "titulo", "status", "data", "chamado"];


    colunas.forEach(col => {
      const th = document.createElement("th");
      const textoFormatado = col
        .replace(/_/g, ' ')
        .replace(/\b\w/g, letra => letra.toUpperCase());
      th.textContent = textoFormatado;
      cabecalho.appendChild(th);
    });

    dados.forEach(item => {
      const linha = tabela.insertRow();
      colunas.forEach(col => {
        const celula = linha.insertCell();
    
        if (col === "chamado") {
          const botao = document.createElement("button");
          const url = item[col];
          const valido = url && url.includes("chat.azpost.com.br/app/accounts/18/conversations");
    
          botao.textContent = "Abrir";
          botao.className = valido ? "botao-link" : "botao-desativado";
          botao.disabled = !valido;
    
          if (valido) {
            botao.onclick = () => window.open(url, "_blank");
          }
    
          celula.appendChild(botao);
        } else {
          celula.textContent = item[col];
        }
      });
    });

    tabelaContainer.appendChild(tabela);

  } catch (err) {
    console.error("Erro ao carregar relatório:", err);
    tabelaContainer.innerHTML = "<p style='margin-top: 20px;'>Erro ao carregar relatório.</p>";
  }
});

const exportarExcel = document.getElementById("exportar_excelB");

exportarExcel.addEventListener("change", async (event) => {
  const valorSelecionado = event.target.value;
  let url = "";

  switch (valorSelecionado) {
    case "todos":
      url = "exportar-excel";
      break;
    case "duvidas":
      url = "exportar-excel-duvidas";
      break;
    case "funcionalidades":
      url = "exportar-excel-funcionalidade";
      break;
    case "churn":
      url = "exportar-excel-churn";
      break;
    case "sistema": // Certifique-se que o HTML bate com isso aqui
      url = "exportar-excel-sistema";
      break;
    default:
      console.warn("Valor não reconhecido.");
      return;
  }

  window.open(`http://localhost:3000/${url}`, "_blank");
  event.target.value = "";
});
