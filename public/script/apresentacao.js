
const tenantInput = document.getElementById('tenant');
const sugestoesB = document.getElementById('sugestoesB');
let razaoInput = tenantInput;
let sugestoesDiv = sugestoesB;
let itemSelecionadoRazao = false;

tenantInput.addEventListener('input', () => {
  razaoSocialSugestoes(tenantInput.value);
});



function razaoSocialSugestoes(razao) {
  sugestoesDiv.innerHTML = '';
  sugestoesDiv.style.display = 'none';
  itemSelecionadoRazao = false;

  if (!razao.trim()) return;

  fetch(`/sugestoes-razao-social?q=${encodeURIComponent(razao)}`)
    .then(res => res.json())
    .then(lista => {
      if (!lista || lista.length === 0) return;

      lista.forEach(empresa => {
        const div = document.createElement('div');
        div.textContent = empresa.razao_social;

        div.addEventListener('mousedown', () => {
          itemSelecionadoRazao = true;
          razaoInput.value = empresa.razao_social;

          // ✅ Nova rota que retorna nome_fantasia e cnpj
          fetch(`/dados-razao-apresentacao?nome=${encodeURIComponent(empresa.razao_social)}`)
            .then(res => res.json())
            .then(dados => {
              document.getElementById('nome_fantasia').value = dados.nome_fantasia || '';
              document.getElementById('cnpjB').value = dados.cnpj || '';
            })
            .catch(err => console.error("Erro ao buscar dados:", err));

          sugestoesDiv.innerHTML = '';
          sugestoesDiv.style.display = 'none';
        });

        sugestoesDiv.appendChild(div);
      });

      sugestoesDiv.style.display = 'block';
    })
    .catch(erro => {
      console.error("Erro ao buscar sugestões:", erro);
    });
}


// Exibir 3 meses de data

flatpickr.localize(flatpickr.l10ns.pt); // Ativa o idioma pt

flatpickr("#dataCliente", {
  locale: {
    ...flatpickr.l10ns.pt,
    months: {
      shorthand: flatpickr.l10ns.pt.months.shorthand,
      longhand: flatpickr.l10ns.pt.months.longhand.map((nome, i) => `${nome} (${i + 1})`)
    }
  },
  dateFormat: "d/m/Y",
  showMonths: 3,
  maxDate: "today",
  onOpen: function (selectedDates, dateStr, instance) {
    const dataAtual = new Date();
    const mesAnterior = new Date(dataAtual.getFullYear(), dataAtual.getMonth() - 2, 1);
    instance.jumpToDate(mesAnterior);
  }
});


// modal para atualizar a razão social
function abrirModalAtualizarRazaoSocial() {
  const modal = document.getElementById("modal");
  const conteudo = document.getElementById("conteudoModal");

  const html = `
    <div style="background-color: #2C34C9; color: white; padding: 12px; font-weight: bold; font-size: 20px; border-radius: 6px 6px 0 0;">
      Atualizar Razão Social
    </div>
    <div style="padding: 20px;" id="modal-atualizar-razao">
      <form id="formUpload" enctype="multipart/form-data" class="formFlexB">
        <label for="arquivo">Atualizar Tenants, selecione um arquivo:</label>
        <a href="https://grafana.locsis.com/d/a81e743d-1aef-4426-9e7d-5022e93997d5/locsis-dados-por-tenant?orgId=1&inspect=1" target="_blank"><p class="grafana">Grafana</p></a>
        <div class="flexC">
            <input type="file" id="arquivo" name="arquivo" required />
        </div>
        <div style="text-align: right; padding: 10px;">
          <button id="fecharBotao" type="button">Fechar</button>
          <button type="submit">Enviar</button>
        </div>
      </form>
    </div>
  `;

  conteudo.innerHTML = html;
  modal.style.display = "flex";

  // Fechar modal
  document.getElementById("fecharBotao").addEventListener("click", () => {
    modal.style.display = "none";
    
  });

  // ⬇️ Adiciona o submit ao formulário dinamicamente
  document.getElementById('formUpload').addEventListener('submit', function (event) {
    const modal = document.getElementById("modal");
    event.preventDefault();

    const inputArquivo = document.getElementById('arquivo');
    const nomeCompleto = inputArquivo.value;
    const nomeArquivo = nomeCompleto.split('\\').pop();
    const confere = nomeArquivo.includes("Locsis");

    if (confere) {
      console.log('✅ Possui o nome Locsis');
      const form = document.getElementById('formUpload');
      const formData = new FormData(form);

      fetch('/verificar-excel', {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(resultado => {
          if (resultado.sucesso) {
            console.log("✅ Tem duas colunas preenchidas");

            fetch('/importar-razao-social', {
              method: 'POST',
              body: formData
            })
              .then(res => res.json())
              .then(resposta => {
                if (resposta.sucesso) {
                  if (resposta.total === 0) {
                    alert("Nenhuma nova razão social foi inserida, seu cadastro está completo.");
                    modal.style.display = "none";
                  } else {
                    alert(`Foram inseridas ${resposta.total} novas razões sociais:\n\n- ${resposta.inseridos.join("\n- ")}`);
                    modal.style.display = "none";
                  }
                } else {
                  alert("Erro ao importar os dados para o banco.");
                }
              })
              .catch(err => {
                console.error("Erro ao importar razão social:", err);
                alert("Erro na comunicação com o servidor.");
              });
          } else {
            console.log("❌ Tem coluna além da A preenchida");
            alert("O arquivo não tem a estrutura correta para importação.");
          }
        })
        .catch(error => {
          console.error("Erro na verificação do Excel:", error);
        });

      inputArquivo.value = "";

    } else {
      console.log("Não possui o nome Locsis");
      alert('❌ Esse não é o arquivo com os usuários. Escolha o arquivo correto');
      inputArquivo.value = "";
    }
  });
}


const botao = document.getElementById("botaoAtualizarRazao");
if (botao) {
  botao.addEventListener("click", abrirModalAtualizarRazaoSocial);
} else {
  console.warn("❌ Botão 'botaoAtualizarRazao' não encontrado no DOM.");
}

// salva a apresentacao no banco de dados

document.getElementById("formAlterar").addEventListener("submit", async function (e) {
  e.preventDefault();

  const razao_social = document.getElementById("tenant").value;
  const nome_fantasia = document.getElementById("nome_fantasia").value;
  const cnpj = document.getElementById("cnpjB").value;
  const data_cliente = document.getElementById("dataCliente").value;

  const dados = { razao_social, nome_fantasia, cnpj, data_cliente };

  try {
    const resposta = await fetch("/cadastrar-apresentacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();

    if (resultado.sucesso) {
      alert(resultado.mensagem);
      document.getElementById("formAlterar").reset();
    } else {
      alert("❌ " + resultado.mensagem);
    }
  } catch (erro) {
    console.error("Erro ao enviar dados:", erro);
    alert("❌ Erro ao conectar com o servidor.");
  }
});


// listar as apresentacoe

function carregarApresentacoes() {
  const container = document.getElementById("clientes_relatorio");
  const mensagem = document.getElementById("mensagem-relatorio");

  fetch('/apresentacoes')
    .then(res => res.json())
    .then(dados => {
      mensagem.style.display = "none";
      const tabelaAntiga = container.querySelector("table");
      if (tabelaAntiga) tabelaAntiga.remove();

      if (!dados || dados.length === 0) {
        container.innerHTML = "<p style='margin-top: 20px;'>Nenhuma apresentação cadastrada.</p>";
        return;
      }

      const tabela = document.createElement("table");
      tabela.classList.add("tabela-relatorio");

      const colunas = ["razao_social", "nome_fantasia", "cnpj", "data_cadastro", "data_apresentacao"];

      const cabecalho = tabela.insertRow();
      colunas.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        cabecalho.appendChild(th);
      });

      dados.forEach(item => {
        const linha = tabela.insertRow();
        linha.style.cursor = "pointer";

        linha.addEventListener("click", () => {
          abrirModalFuncionalidadeComCheckbox(item.razao_social, item);
        });

        colunas.forEach(col => {
          const celula = linha.insertCell();
          let valor = item[col] || "-";

          if (col.includes("data") && valor !== "-") {
            const dataFormatada = valor.split("T")[0].split("-").reverse().join("/");

            celula.textContent = dataFormatada;
          } else {
            celula.textContent = valor;
          }
        });
      });

      container.appendChild(tabela);
    })
    .catch(err => {
      console.error("Erro ao carregar apresentações:", err);
      container.innerHTML = "<p style='margin-top: 20px;'>Erro ao carregar apresentações.</p>";
    });
}


// modal

function abrirModalFuncionalidadeComCheckbox(razaoSocial) {
  Promise.all([
    fetch(`/apresentacao-detalhes?razao=${encodeURIComponent(razaoSocial)}`).then(res => res.json())
  ])
  .then(async ([dadosEmpresa]) => {
    const modal = document.getElementById("modal");
    const conteudo = document.getElementById("conteudoModal");

    const dataCadastroBR = dadosEmpresa.data_cadastro
    ? dadosEmpresa.data_cadastro.split("T")[0]
    : "-";
  

    const dataApresentacaoInput = dadosEmpresa.data_apresentacao 
      ? dadosEmpresa.data_apresentacao.split("T")[0]
      : "";

    const textoObservacao = dadosEmpresa.observacao || "";

    // 🔵 Buscar funcionalidades já filtradas pela nova rota
    const lista = await fetch(`/funcionalidades-por-cnpj-data-apresentacao?cnpj=${encodeURIComponent(dadosEmpresa.cnpj)}`)
      .then(res => res.json());

    let html = `
      <div style="background-color: #2C34C9; color: white; padding: 12px; font-weight: bold; font-size: 20px; border-radius: 6px 6px 0 0;">
        Apresentação
      </div>
      <div style="padding: 20px;">
        <div style="margin-bottom: 12px;"><strong style="color: #2C34C9;">Razão Social:</strong> <span>${dadosEmpresa.razao_social}</span></div>
        <div style="margin-bottom: 12px;"><strong style="color: #2C34C9;">Nome Fantasia:</strong> <span>${dadosEmpresa.nome_fantasia || "-"}</span></div>
        <div style="margin-bottom: 12px;"><strong style="color: #2C34C9;">CNPJ:</strong> <span>${dadosEmpresa.cnpj}</span></div>
        <div style="margin-bottom: 12px;"><strong style="color: #2C34C9;">Data Cadastro:</strong> 
        <input type="date" id="dataCadastro" value="${dataCadastroBR}" style="padding: 5px; font-size: 14px; margin-top: 4px; width: 150px; margin-left: 5px;">
        </div>

        <div class="flex-esquerda" style="margin-bottom: 20px;">
          <label for="dataApresentacao" style="color: #2C34C9; font-weight: bold; margin: 0px !important; font-size: 15px;">Data Apresentação:</label>
          <input type="date" id="dataApresentacao" value="${dataApresentacaoInput}" style="padding: 5px; font-size: 14px; margin-top: 4px; width: 150px; margin-left: 5px;">
        </div>

        <div style="margin-bottom: 10px;"><strong>Histórico de Funcionalidades:</strong></div>

        <table class="tabela-relatorio" style="width: 100%; border-collapse: collapse;">
          <thead style="background-color: #2C34C9; color: white;">
            <tr>
              <th style="padding: 10px;"><input type="checkbox" id="selecionarTodosFunc" checked></th>
              <th style="padding: 10px;">Marcar / Desmarcar - Todos</th>
            </tr>
          </thead>
          <tbody>
    `;

    lista.forEach(item => {
      html += `
        <tr>
          <td style="text-align: center; padding: 8px;">
            <input type="checkbox" class="checkbox-func" value="${item.funcionalidade}" data-tipo="${item.tipo}" checked>
          </td>
          <td style="padding: 8px;">${item.funcionalidade || "-"}</td>
        </tr>
      `;
    });

      html += `
          </tbody>
        </table>

        <div style="margin-top: 20px;">
          <label for="observacoes" style="font-weight: bold; display: block; margin-bottom: 5px;">Observações:</label>
          <textarea id="observacoes" style="width: 541px; height: 200px; resize: vertical; font-size: 14px; padding: 10px;">${textoObservacao}</textarea>
        </div>

        <div style="text-align: right; margin-top: 20px;">
          <button id="fecharBotao">Fechar</button>
          <button id="copiarFuncionalidades">Copiar e Salvar</button>
        </div>
      </div>
    `;

      conteudo.innerHTML = html;
      modal.style.display = "flex";

      document.getElementById("fecharBotao").addEventListener("click", () => {
        modal.style.display = "none";
        location.reload();
      });

      setTimeout(() => {
        const checkAll = document.getElementById("selecionarTodosFunc");
        const checkboxes = document.querySelectorAll(".checkbox-func");

        checkAll.addEventListener("change", () => {
          checkboxes.forEach(cb => cb.checked = checkAll.checked);
        });

        checkboxes.forEach(cb => {
          cb.addEventListener("change", () => {
            const todosMarcados = [...checkboxes].every(cb => cb.checked);
            checkAll.checked = todosMarcados;
          });
        });

        document.getElementById("copiarFuncionalidades").addEventListener("click", () => {
          const marcados = Array.from(document.querySelectorAll(".checkbox-func:checked"))
            .map(cb => {
              const tipo = cb.dataset.tipo || "funcionalidade";
              return `✅ ${cb.value} (${tipo})`;
            })
            .join("\n");


          const observacoes = document.getElementById("observacoes").value.trim();

          const valorData = document.getElementById("dataApresentacao").value;
          let dataApresentacaoBR = "-";
          
          if (valorData) {
            const [ano, mes, dia] = valorData.split("-");
            dataApresentacaoBR = `${dia}/${mes}/${ano}`;
          }
          
          const texto = `📋 Resumo da Apresentação
          
Razão Social: ${dadosEmpresa.razao_social}
Nome Fantasia: ${dadosEmpresa.nome_fantasia || "-"}
CNPJ: ${dadosEmpresa.cnpj}
Data Cadastro no Locsis: ${dataCadastroBR}
Data Apresentação: ${dataApresentacaoBR}
         
Funcionalidades:
${marcados || "- Não exigiu funcionalidades -"}
          
Observações:
${observacoes || "-"}`;

          // Copiar para clipboard
          navigator.clipboard.writeText(texto)
            .then(() => {
              // Salvar observação no banco
              const novaData = document.getElementById("dataApresentacao").value;

              fetch("/salvar-observacao", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razao_social: dadosEmpresa.razao_social,
                  observacao: observacoes,
                  data_apresentacao: novaData,
                  data_cadastro: document.getElementById("dataCadastro").value
                })
                
              })
              
                .then(res => res.json())
                .then(res => {
                  if (res.sucesso) {
                    const botaoCopiar = document.getElementById("copiarFuncionalidades");
                    botaoCopiar.textContent = "Copiado e salvo!";
                    botaoCopiar.style.backgroundColor = "#28a745"; // verde sucesso
                    botaoCopiar.style.color = "#fff";

                    setTimeout(() => {
                      botaoCopiar.textContent = "Copiar e Salvar";
                      botaoCopiar.style.backgroundColor = "";
                      botaoCopiar.style.color = "";
                    }, 2000);
                  } else {
                    alert("⚠️ Copiado, mas houve erro ao salvar a observação.");
                  }
                })
                .catch(() => {
                  alert("⚠️ Copiado, mas erro ao salvar observação no banco.");
                });
            })
            .catch(() => alert("❌ Erro ao copiar o conteúdo."));
        });

      }, 0);
    });
}



// ⬇️ Carrega ao abrir a página
carregarApresentacoes();

function carregarFuncionalidadesRecentes() {
  const container = document.getElementById("clientes_relatorio");
  const mensagem = document.getElementById("mensagem-relatorio");

  fetch("/apresentacoes-funcionalidades")
    .then(res => res.json())
    .then(dados => {
      mensagem.style.display = "none";
      const tabelaAntiga = container.querySelector("table");
      if (tabelaAntiga) tabelaAntiga.remove();

      if (!dados || dados.length === 0) {
        container.innerHTML = "<p style='margin-top: 20px;'>Nenhuma funcionalidade recente encontrada.</p>";
        return;
      }

      const tabela = document.createElement("table");
      tabela.classList.add("tabela-relatorio");

      const colunas = ["razao_social", "nome_fantasia", "cnpj", "data_abertura", "titulo"];

      const cabecalho = tabela.insertRow();
      colunas.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        cabecalho.appendChild(th);
      });

      dados.forEach(item => {
        const linha = tabela.insertRow();
        linha.style.cursor = "pointer";

        linha.addEventListener("click", () => {
          abrirModalFuncionalidade(item);
        });

        colunas.forEach(col => {
          const celula = linha.insertCell();
          let valor = item[col] || "-";

          if (col === "data_abertura" && valor !== "-") {
            valor = valor.split("T")[0].split("-").reverse().join("/");
          }

          celula.textContent = valor;
        });
      });

      container.appendChild(tabela);
    })
    .catch(err => {
      console.error("Erro ao carregar funcionalidades recentes:", err);
      container.innerHTML = "<p style='margin-top: 20px;'>Erro ao carregar dados.</p>";
    });
}


