

  // cria a tabela dos clientes na pagina usuarios.html

  function carregarClientes() {
    const container = document.getElementById("clientes_relatorio");
    const mensagem = document.getElementById("mensagem-relatorio");
  
    fetch('/clientes')
      .then(res => res.json())
      .then(dados => {
        mensagem.style.display = "none";
        const tabelaAntiga = container.querySelector("table");
        if (tabelaAntiga) tabelaAntiga.remove();
  
        if (!dados || dados.length === 0) {
          container.innerHTML = "<p style='margin-top: 20px;'>Nenhum cliente encontrado.</p>";
          return;
        }
  
        const tabela = document.createElement("table");
        tabela.classList.add("tabela-relatorio");
  
        const cabecalho = tabela.insertRow();
        const colunas = ["razao_social", "nome_fantasia", "cnpj", "data_cliente"];
  
        colunas.forEach(col => {
          const th = document.createElement("th");
          th.textContent = col.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
          cabecalho.appendChild(th);
        });
  
        dados.forEach(item => {
          const linha = tabela.insertRow();
          linha.style.cursor = "pointer"; // 👈 muda o cursor
          linha.addEventListener("click", () => {
            abrirModalChurn(item); // 👈 chama o modal passando os dados da empresa
          });
  
          colunas.forEach(col => {
            const celula = linha.insertCell();
            celula.textContent = item[col];
          });
        });
  
        container.appendChild(tabela);
      })
      .catch(err => {
        console.error("Erro ao carregar clientes:", err);
        container.innerHTML = "<p style='margin-top: 20px;'>Erro ao carregar clientes.</p>";
      });
  }
  
  
  
  // Chamar ao carregar a página
  carregarClientes();
  
  



