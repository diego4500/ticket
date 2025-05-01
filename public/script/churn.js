const tenantInput = document.getElementById('tenant');
const sugestoesB = document.getElementById('sugestoesB');
let razaoInput = tenantInput;
let sugestoesDiv = sugestoesB;
let itemSelecionadoRazao = false;

tenantInput.addEventListener('input', () => {
  razaoSocialSugestoes(tenantInput.value);
});


// Carregar sugestões

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
              
              document.getElementById('cnpjB').value = formatarCNPJ(dados.cnpj || '');
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

document.addEventListener('click', (event) => {
  const clicouDentroInput = event.target === tenantInput;
  const clicouDentroSugestoes = sugestoesDiv.contains(event.target);

  if (!clicouDentroInput && !clicouDentroSugestoes) {
    if (!itemSelecionadoRazao) {
      tenantInput.value = '';
      sugestoesDiv.style.display = 'none';
    }
  }
});



// modal para atualizar razao social via planilha

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
    window.location.reload();       
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

// Evento para abrir o modal atualizar razao

const botao = document.getElementById("botaoAtualizarRazao");
botao.addEventListener("click", abrirModalAtualizarRazaoSocial);



// tras a data de hoje
const campoData = document.getElementById('dataCliente');

  setTimeout(() => {
    
    const hoje = new Date();
    const yyyy = hoje.getFullYear();
    const mm = String(hoje.getMonth() + 1).padStart(2, '0');
    const dd = String(hoje.getDate()).padStart(2, '0');

    const dataHoje = `${yyyy}-${mm}-${dd}`;
    
    if (campoData) campoData.value = dataHoje;
    else console.warn("⚠️ Campo #dataCliente não encontrado");
  }, 100); // espera 100ms


// submit do cadastrar churn

document.getElementById("formAlterar").addEventListener("submit", async function (e) {
  e.preventDefault();

  const razao_social = document.getElementById("tenant").value;
  const nome_fantasia = document.getElementById("nome_fantasia").value;
  const cnpj = document.getElementById("cnpjB").value;
  const data_churn = document.getElementById("dataCliente").value;

  const dados = { razao_social, nome_fantasia, cnpj, data_churn };

  try {
    const resposta = await fetch("/cadastrar-churn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();

    if (resultado.sucesso) {
      alert("Churn salvo com sucesso!");
      document.getElementById("formAlterar").reset();
    } else {
      alert("Erro: " + resultado.mensagem);
    }
  } catch (erro) {
    console.error("Erro ao enviar:", erro);
    alert("Erro na comunicação com o servidor.");
  }
});

function carregarChurns() {
  const container = document.getElementById("clientes_relatorio");
  const mensagem = document.getElementById("mensagem-relatorio");

  fetch("/listar-churns")
    .then(res => res.json())
    .then(dados => {
      mensagem.style.display = "none";
      container.innerHTML = "";

      if (!dados || dados.length === 0) {
        container.innerHTML = "<p style='margin-top: 20px;'>Nenhum churn cadastrado ainda.</p>";
        return;
      }

      const tabela = document.createElement("table");
      tabela.classList.add("tabela-relatorio");

      const colunas = ["id", "razao_social", "nome_fantasia", "cnpj", "data_cliente", "data_churn"];

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
          abrirModalChurn(item);
        });

        colunas.forEach(col => {
          const celula = linha.insertCell();
          let valor = item[col] || "";
        
          if (col === "cnpj" && valor) {
            valor = formatarCNPJ(valor);
          }
        
          if (col.includes("data") && valor) {
            // garante dd/mm/aaaa sem fuso
            const [yyyy, mm, dd] = valor.split("T")[0].split("-");
            valor = `${dd}/${mm}/${yyyy}`;
          }
        
          celula.textContent = valor;
        });
      });

      container.appendChild(tabela);
    })
    .catch(err => {
      console.error("Erro ao carregar churns:", err);
      container.innerHTML = "<p style='margin-top: 20px;'>Erro ao carregar churns.</p>";
    });
}


// lista os churns da página
carregarChurns();

linha.addEventListener("click", () => {
  abrirModalChurn(item); // <-- já passa os dados completos
});

function abrirModalChurn(dados) {
  const modal = document.getElementById("modal");
  const conteudo = document.getElementById("conteudoModal");

  const dataClienteBR = dados.data_cliente
    ? formatarDataIsoParaBR(dados.data_cliente)
    : "-";

  const dataChurnBR = dados.data_churn
    ? new Date(dados.data_churn).toISOString().split("T")[0]
    : "";

  let html = `
    <div style="background-color: #2C34C9; color: white; padding: 12px; font-weight: bold; font-size: 20px; border-radius: 6px 6px 0 0;">
      Detalhes do Churn
    </div>
    <div style="padding: 20px;">
      <div style="margin-bottom: 12px;"><strong style="color: #2C34C9;">ID:</strong> <span>${dados.id}</span></div>
      <div style="margin-bottom: 12px;"><strong style="color: #2C34C9;">Razão Social:</strong> <span>${dados.razao_social}</span></div>
      <div style="margin-bottom: 12px;"><strong style="color: #2C34C9;">Nome Fantasia:</strong> <span>${dados.nome_fantasia || "-"}</span></div>
      <div style="margin-bottom: 12px;"><strong style="color: #2C34C9;">CNPJ:</strong> <span>${formatarCNPJ(dados.cnpj || '')}</span></div>
      <div style="margin-bottom: 12px;"><strong style="color: #2C34C9;">Data Cliente:</strong> <span>${dataClienteBR}</span></div>
      <div style="margin-bottom: 12px;"><strong style="color: #2C34C9;">Data Churn:</strong> 
        <input type="date" id="dataApresentacao" value="${dataChurnBR}" style="padding: 5px; font-size: 14px; margin-top: 4px; width: 150px; margin-left: 5px;">
        <span id="atualizar" style="cursor:pointer; color: purple; font-weight: bold;">&#x21BB;</span>
      </div>

      <div style="margin-bottom: 10px;"><strong>Histórico de Churns:</strong></div>
      <table class="tabela-relatorio" style="width: 100%; border-collapse: collapse;">
        <thead style="background-color: #2C34C9; color: white;">
          <tr>
            <th style="padding: 10px;">
              <input type="checkbox" id="selecionarTodos" title="Selecionar todos" checked>
            </th>
            <th style="padding: 10px;">Descrição</th>
          </tr>
        </thead>
        <tbody id="tabelaChurnBody"></tbody>
      </table>

      <div class="flexC" style="margin-top:20px;"><button id="fecharBotao">Fechar</button></div>
    </div>
  `;

  conteudo.innerHTML = html;
  modal.style.display = "flex";

  document.getElementById("fecharBotao").addEventListener("click", () => {
    modal.style.display = "none";
  });

  document.getElementById("atualizar").addEventListener("click", () => {
    const cnpj = dados.cnpj;
    const data_cliente = document.getElementById("dataApresentacao").value;

    fetch(`/buscar-churn-por-cnpj-data?cnpj=${encodeURIComponent(cnpj)}&data_cliente=${encodeURIComponent(data_cliente)}`)
      .then(res => res.json())
      .then(resposta => {
        const tbody = document.getElementById("tabelaChurnBody");
        tbody.innerHTML = "";

        if (resposta.sucesso && resposta.churns.length > 0) {
          resposta.churns.forEach((churn, i) => {
            const linha = document.createElement("tr");

            linha.innerHTML = `
              <td style="text-align: center;">
                <input type="checkbox" checked>
              </td>
              <td style="padding: 6px;">${churn}</td>
            `;

            tbody.appendChild(linha);
          });
        } else {
          const linha = document.createElement("tr");
          linha.innerHTML = `<td colspan="2" style="text-align:center; padding: 10px; color: #999;">Nenhum churn encontrado.</td>`;
          tbody.appendChild(linha);
        }
      })
      .catch(err => {
        console.error("Erro ao verificar churn:", err);
      });
  });
}


// formatar data

function formatarDataIsoParaBR(dataIso) {
  if (!dataIso) return "-";
  const [ano, mes, dia] = dataIso.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}

// Fomatação CNPJ

function formatarCNPJ(cnpj) {
  return cnpj
    .replace(/\D/g, '') // remove tudo que não for dígito
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}








  