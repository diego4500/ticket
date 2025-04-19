
  const seletor = document.getElementById("relatorio_ticket");
  const mensagem = document.getElementById("mensagem-relatorio");
  const tabelaContainer = document.getElementById("tabela-relatorio");

  seletor.addEventListener("change", async (event) => {
    const valorSelecionado = event.target.value;

    mensagem.style.display = "none";  // Oculta a mensagem
    // Remove qualquer tabela antiga
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

      // Cabeçalhos
      const cabecalho = tabela.insertRow();
      const colunas = Object.keys(dados[0]);

      colunas.forEach(col => {
        const th = document.createElement("th");
      
        // Transforma: razao_social → Razao Social
        const textoFormatado = col
          .replace(/_/g, ' ')                      // troca _ por espaço
          .replace(/\b\w/g, letra => letra.toUpperCase()); // capitaliza cada palavra
      
        th.textContent = textoFormatado;
        cabecalho.appendChild(th);
      });

      // Dados
      dados.forEach(item => {
        const linha = tabela.insertRow();
        colunas.forEach(col => {
          const celula = linha.insertCell();
          celula.textContent = item[col];
        });
      });

      tabelaContainer.appendChild(tabela);

    } catch (err) {
      console.error("Erro ao carregar relatório:", err);
      tabelaContainer.innerHTML = "<p style='margin-top: 20px;'>Erro ao carregar relatório.</p>";
    }
  });

