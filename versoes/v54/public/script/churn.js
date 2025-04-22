function carregarChurns() {
    const container = document.getElementById("clientes_relatorio");
    const mensagem = document.getElementById("mensagem-relatorio");
  
    fetch('/churns')
      .then(res => res.json())
      .then(dados => {
        mensagem.style.display = "none";
        const tabelaAntiga = container.querySelector("table");
        if (tabelaAntiga) tabelaAntiga.remove();
  
        if (!dados || dados.length === 0) {
          container.innerHTML = "<p style='margin-top: 20px;'>Nenhum churn encontrado.</p>";
          return;
        }
  
        const tabela = document.createElement("table");
        tabela.classList.add("tabela-relatorio");
  
        const cabecalho = tabela.insertRow();
        const colunas = ["razao_social", "nome_fantasia", "cnpj", "data_cliente", "data_churn"];
  
        colunas.forEach(col => {
          const th = document.createElement("th");
          th.textContent = col.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
          cabecalho.appendChild(th);
        });
  
        dados.forEach(item => {
          const linha = tabela.insertRow();
          linha.style.cursor = "pointer"; // 👈 Deixa o cursor como ponteiro
  
          // 👇 Evento de clique funcionando
          linha.addEventListener("click", () => {
            abrirModalChurn({
              razao_social: item.razao_social
            });
          });
  
          colunas.forEach(col => {
            const celula = linha.insertCell();
            const texto = item[col] || "-";
            celula.textContent = texto;
          });
        });
  
        container.appendChild(tabela);
      })
      .catch(err => {
        console.error("Erro ao carregar churns:", err);
        container.innerHTML = "<p style='margin-top: 20px;'>Erro ao carregar churns.</p>";
      });
  }
  

// Carrega ao abrir a página
carregarChurns();

function abrirModalChurn(dadosEmpresa) {
    const modal = document.getElementById("modal");
    const conteudo = document.getElementById("conteudoModal");
  
    fetch(`/churns-por-razao?razao=${encodeURIComponent(dadosEmpresa.razao_social)}`)
      .then(res => res.json())
      .then(lista => {
        if (!lista || lista.length === 0) {
          conteudo.innerHTML = "<p>Nenhum churn encontrado para esta empresa.</p>";
          modal.style.display = "flex";
          return;
        }
  
        const info = lista[0];
        const ultimoChurn = lista[lista.length - 1].data_churn;
  
        const dataClienteBR = info.data_cliente ? new Date(info.data_cliente).toLocaleDateString("pt-BR") : "-";
        const dataUltimoChurnBR = ultimoChurn ? new Date(ultimoChurn).toLocaleDateString("pt-BR") : "-";
  
        let html = `
          <div style="background-color: #2C34C9; color: white; padding: 12px; font-weight: bold; font-size: 20px; border-radius: 6px 6px 0 0;">
            Detalhes do Churn
          </div>
          <div style="padding: 20px;">
            <div style="margin-bottom: 12px;"><strong style="color: #2C34C9;">Razão Social:</strong> <span id="infoRazao">${info.razao_social}</span></div>
            <div style="margin-bottom: 12px;"><strong style="color: #2C34C9;">Nome Fantasia:</strong> <span id="infoFantasia">${info.nome_fantasia || "-"}</span></div>
            <div style="margin-bottom: 12px;"><strong style="color: #2C34C9;">CNPJ:</strong> <span id="infoCNPJ">${info.cnpj}</span></div>
            <div style="margin-bottom: 12px;"><strong style="color: #2C34C9;">Data Cliente:</strong> <span id="infoCliente">${dataClienteBR}</span></div>
            <div style="margin-bottom: 20px;"><strong style="color: #2C34C9;">Data Último Churn:</strong> <span id="infoChurn">${dataUltimoChurnBR}</span></div>
  
            <div style="margin-bottom: 10px;"><strong>Histórico de Churns:</strong></div>
  
            <table class="tabela-relatorio" style="width: 100%; border-collapse: collapse;">
              <thead style="background-color: #2C34C9; color: white;">
                <tr>
                  <th style="padding: 10px;">
                    <input type="checkbox" id="selecionarTodos" title="Selecionar todos" checked>
                  </th>
                  <th style="padding: 10px;">Marcar / Desmarcar - Todos</th>
                </tr>
              </thead>
              <tbody>
        `;
  
        lista.forEach(item => {
          html += `
            <tr>
              <td style="text-align: center; padding: 8px;">
                <input type="checkbox" class="checkbox-churn" value="${item.churn}" checked>
              </td>
              <td style="padding: 8px;">${item.churn || "-"}</td>
            </tr>
          `;
        });
  
        html += `
              </tbody>
            </table>
  
            <div style="text-align: right; margin-top: 20px;">
              <button id="fecharBotao">Fechar</button>
              <button id="copiarDados">Copiar</button>
            </div>
          </div>
        `;
  
        conteudo.innerHTML = html;
        modal.style.display = "flex";
  
        document.getElementById("fecharBotao").addEventListener("click", () => {
          modal.style.display = "none";
        });
  
        // Aguarda o DOM ser renderizado para associar os eventos
        setTimeout(() => {
          const selecionarTodos = document.getElementById("selecionarTodos");
          const checkboxes = document.querySelectorAll('.checkbox-churn');
  
          if (selecionarTodos) {
            selecionarTodos.addEventListener("change", () => {
              checkboxes.forEach(cb => cb.checked = selecionarTodos.checked);
            });
  
            checkboxes.forEach(cb => {
              cb.addEventListener("change", () => {
                const todosMarcados = [...checkboxes].every(cb => cb.checked);
                selecionarTodos.checked = todosMarcados;
              });
            });
          }
  
          // Botão copiar
          document.getElementById("copiarDados").addEventListener("click", () => {
            const razao = document.getElementById("infoRazao").textContent.trim();
            const fantasia = document.getElementById("infoFantasia").textContent.trim();
            const cnpj = document.getElementById("infoCNPJ").textContent.trim();
            const dataCliente = document.getElementById("infoCliente").textContent.trim();
            const dataChurn = document.getElementById("infoChurn").textContent.trim();
  
            const marcados = Array.from(document.querySelectorAll(".checkbox-churn:checked"))
              .map(cb => `- ${cb.value}`)
              .join("\n");
  
            const textoFinal = `❌ Pedido de Cancelamento 
  
  Razão Social: ${razao}
  Nome Fantasia: ${fantasia}
  CNPJ: ${cnpj}
  Data Cliente: ${dataCliente}
  Data do Churn: ${dataChurn}
  
  Motivos marcados:
  ${marcados || "- Nenhum selecionado -"}`;
  
            navigator.clipboard.writeText(textoFinal)
            const botaoCopiar = document.getElementById("copiarDados");

            navigator.clipboard.writeText(textoFinal)
              .then(() => {
                botaoCopiar.textContent = "Copiado!";
                botaoCopiar.style.backgroundColor = "#28a745"; // verde
                botaoCopiar.style.color = "#fff";
            
                setTimeout(() => {
                  botaoCopiar.textContent = "Copiar";
                  botaoCopiar.style.backgroundColor = "";
                  botaoCopiar.style.color = "";
                }, 2000); // 2 segundos
              })
              .catch(err => alert("❌ Erro ao copiar os dados."));
          });
        }, 0);
      });
  }
  
  
  
  
