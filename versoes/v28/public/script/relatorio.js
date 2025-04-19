fetch("/tickets")
  .then(res => res.json())
  .then(dados => {
    const tabela = document.createElement("table");
    tabela.classList.add("tabela-relatorio");

    // Cabeçalho
    const cabecalho = tabela.insertRow();
    const colunas = Object.keys(dados[0]);
    colunas.forEach(col => {
      const th = document.createElement("th");
      th.textContent = col;
      cabecalho.appendChild(th);
    });

    // Linhas de dados
    dados.forEach(item => {
      const linha = tabela.insertRow();
      colunas.forEach(col => {
        const celula = linha.insertCell();
        celula.textContent = item[col];
      });
    });

    document.getElementById("tabela-relatorio").appendChild(tabela);
  })
  .catch(err => {
    console.error("Erro ao carregar relatório:", err);
    document.getElementById("tabela-relatorio").textContent = "Erro ao carregar relatório.";
  });

  document.getElementById("exportar_excel").addEventListener("click", () => {
    // Abre a rota que gera o arquivo Excel
    window.location.href = "/exportar-excel";
  });

  
