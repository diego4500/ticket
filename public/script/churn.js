const tenantInput = document.getElementById('tenant');
const sugestoesB = document.getElementById('sugestoesB');
let razaoInput = tenantInput;
let sugestoesDiv = sugestoesB;
let itemSelecionadoRazao = false;
let cnpjModalAtual = null;


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
          <button id="fecharBotao" type="button">FecharA</button>
          
          
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
      location.reload(); 
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
  const container  = document.getElementById("clientes_relatorio");
  const loadingEl  = document.getElementById("mensagem-carregando");
  const statusEl   = document.getElementById("mensagem-relatorio");

  if (loadingEl) loadingEl.style.display = "block";
  if (statusEl)  statusEl.textContent = "";

  container.innerHTML = "";

  fetch("/listar-churns")
    .then(r => r.json())
    .then(dados => {
      if (loadingEl) loadingEl.style.display = "none";

      if (!dados || !dados.length) {
        if (statusEl) statusEl.textContent = "Nenhum churn cadastrado ainda.";
        return;
      }
      if (statusEl) statusEl.textContent = "";         // limpa mensagens
      /* ------------- monta a tabela ------------- */
      const tabela = document.createElement("table");
      tabela.classList.add("tabela-relatorio");

      const colunas = [
        { key:"id",            header:"Id", oculto:true },
        { key:"razao_social",  header:"Razão Social" },
        { key:"nome_fantasia", header:"Nome Fantasia" },
        { key:"cnpj",          header:"CNPJ" },
        { key:"data_cliente",  header:"Data Cliente" },
        { key:"data_churn",    header:"Data Churn" }
      ];

      const cab = tabela.insertRow();
      colunas.forEach(c => {
        const th = document.createElement("th");
        th.textContent = c.header;
        if (c.oculto) th.style.display = "none";
        cab.appendChild(th);
      });

      dados.forEach(item => {
        const tr = tabela.insertRow();
        tr.style.cursor = "pointer";
        tr.addEventListener("click", () => abrirModalChurn(item));

        colunas.forEach(c => {
          const td = tr.insertCell();
          if (c.oculto) td.style.display = "none";

          let val = item[c.key] || "";
          if (c.key === "cnpj" && val)  val = formatarCNPJ(val);
          if (c.key.includes("data") && val){
            const [y,m,d] = val.split("T")[0].split("-");
            val = `${d}/${m}/${y}`;
          }
          td.textContent = val;
        });
      });

      container.appendChild(tabela);
    })
    .catch(err => {
      console.error("listar-churns falhou:", err);
      loadingEl.style.display = "none";
      statusEl.textContent = "Erro ao carregar churns.";
    });
}


// lista os churns da página
carregarChurns();

linha.addEventListener("click", () => {
  abrirModalChurn(item); // <-- já passa os dados completos
});

function abrirModalChurn(dados) {
  const modal     = document.getElementById("modal");
  const conteudo  = document.getElementById("conteudoModal");
  cnpjModalAtual = dados.cnpj;

  /* ---------- monta o HTML ---------- */
  const dataChurnBR = dados.data_churn
        ? new Date(dados.data_churn).toISOString().split("T")[0]
        : "";

        const dataClienteBR = formatarDataIsoParaBR(dados.data_cliente)


  conteudo.innerHTML = `
    <div style="background:#2C34C9;color:#fff;padding:12px;font-weight:bold;font-size:20px;border-radius:6px 6px 0 0;">
      Detalhes do Churn
    </div>
    <div style="padding:20px;">
    <div>
      <div style="margin-bottom:12px;"><strong style="color:#2C34C9;">Razão Social:</strong> ${dados.razao_social}</div>
      <div style="margin-bottom:12px;"><strong style="color:#2C34C9;">CNPJ:</strong> ${formatarCNPJ(dados.cnpj)}</div>
    </div>
      <div >
          <strong style="color:#2C34C9;">Data Cliente:</strong>
        ${dataClienteBR}
      </div>
      <div style="margin-bottom:12px; margin-top:12px;">
       
        <strong style="color:#2C34C9;">Data Churn:</strong>
        <input type="date" id="dataChurn" value="${dataChurnBR}" style="padding:5px;font-size:14px;width:150px;margin-left:5px;">
        <span id="atualizar" style="cursor:pointer;color:purple;font-weight:bold;">&#x21BB;</span>
      </div>

      <div style="margin-bottom:10px;"><strong>Histórico de Churns:</strong></div>
      <table class="tabela-relatorio" style="width:100%;border-collapse:collapse;">
        <thead style="background:#2C34C9;color:#fff;">
          <tr>
            <th style="padding:10px;"><input type="checkbox" id="selecionarTodos" checked></th>
            <th style="padding:10px;">Descrição</th>
          </tr>
        </thead>
        <tbody id="tabelaChurnBody"></tbody>
      </table>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button id="fecharBotao">Fechar</button>
        <button id="salvarCopiar" type="button">Salvar e Copiar</button>
      </div>
    </div>
  `;

  /* ---------- exibe modal ---------- */
  modal.style.display = "flex";

 /* ---------- carrega a tabela imediatamente ---------- */

const dataInicial = document.getElementById("dataChurn").value;
preencherTabela(cnpjModalAtual, dataInicial);

  /* ---------- listeners ---------- */
  document.getElementById("fecharBotao").addEventListener("click", () => modal.style.display = "none");

  document.getElementById("atualizar").addEventListener("click",()=>{
     const data = document.getElementById("dataChurn").value;
     preencherTabela(cnpjModalAtual, data);
  });

 
 // 1️⃣ – pega o botão que acabou de ser injetado
const btnCopiar = document.getElementById("salvarCopiar");

/* 2️⃣ – ANTES de acrescentar um novo listener,
        remova todos os anteriores que possam ter ficado */
btnCopiar.replaceWith(btnCopiar.cloneNode(true));   // “zera” listeners
const btnCopiarLimpo = document.getElementById("salvarCopiar"); // novo nó

/* 3️⃣ – agora sim adicione UM ÚNICO listener */
btnCopiarLimpo.addEventListener("click", async () => {

  /* (opcional) salve a data editada – só uma vez */
  await salvarDataChurn(dados.id);

  /* ---------- monta os dados ---------- */
  const razao       = dados.razao_social;
  const fantasia    = dados.nome_fantasia || "-";
  const cnpj        = formatarCNPJ(dados.cnpj);
  const dataCliente = formatarDataIsoParaBR(dados.data_cliente);

  const dataChurnISO = document.getElementById("dataChurn").value; // yyyy‑mm‑dd
  const dataChurnBR  = dataChurnISO.split("-").reverse().join("/");

  /* checkboxes marcados */
  const marcados = [...document.querySelectorAll(
                      "#tabelaChurnBody input[type='checkbox']:checked")]
                   .map(chk => chk.closest("tr")
                                 .querySelector("td:nth-child(2)")
                                 .textContent.trim());

  const textoFinal = `❌ Pedido de Cancelamento

Razão Social: ${razao}
Nome Fantasia: ${fantasia}
CNPJ: ${cnpj}
Data Cliente: ${dataCliente}
Data do Churn: ${dataChurnBR}

Motivos marcados:
${marcados.length ? "🔴 " + marcados.join("\n🔴 ") : "- Nenhum selecionado -"}`;


  try {
    await navigator.clipboard.writeText(textoFinal);
    feedbackBotao(btnCopiarLimpo, "Salvo e Copiado!", 2000);
  } catch (e) {
    console.error(e);
    alert("Não foi possível copiar o texto.");
  }
});
  


}

function listaTicket(cnpj, data_cliente){
  

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
}

// salvar churn (data)

function salvarDataChurn(id) {
  const novaData = document.getElementById("dataChurn").value;   // yyyy-mm-dd

  fetch('/atualizar-data-churn', {
    method : 'PUT',
    headers: { 'Content-Type':'application/json' },
    body   : JSON.stringify({ id, novaData })
  })
  .then(r => r.json())
  .then(resp => {
    if (resp.sucesso) {
    
      // recarrega a lista principal para refletir a alteração
      
      carregarChurns();
      
      preencherTabela(cnpjModalAtual, novaData);   // passe os parâmetro          // caso queira atualizar o histórico na hora
      
    } else {
      alert('Erro: ' + resp.mensagem);
    }
  })
  .catch(err => {
    console.error('Erro ao salvar data_churn:', err);
    alert('Falha na comunicação com o servidor.');
  });
}

  /* ---------- função que faz o fetch e popula a tbody ---------- */
  function preencherTabela(cnpj, data_cliente){
    fetch(`/buscar-churn-por-cnpj-data?cnpj=${encodeURIComponent(cnpj)}&data_cliente=${encodeURIComponent(data_cliente)}`)
      .then(r => r.json())
      .then(({ sucesso, churns })=>{
          const tbody = document.getElementById("tabelaChurnBody");
          tbody.innerHTML = "";
          if (sucesso && churns.length){
              churns.forEach(txt=>{
                 tbody.insertAdjacentHTML("beforeend",
                   `<tr>
                      <td style="text-align:center;"><input type="checkbox" checked></td>
                      <td style="padding:6px;">${txt}</td>
                    </tr>`);
              });
          }else{
              tbody.innerHTML =
                `<tr><td colspan="2" style="text-align:center;padding:10px;color:#999;">
                   Nenhum churn encontrado
                 </td></tr>`;
          }
      })
      .catch(e=>console.error("Erro ao buscar churns:", e));
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


/**
 * Muda temporariamente a aparência do botão.
 * @param {HTMLElement} btn         – botão que disparou a ação
 * @param {String} labelOk          – texto mostrado enquanto sucesso (ex.: "Copiado!")
 * @param {Number} tempoMs = 1000   – quanto tempo (ms) manter o destaque
 */

function feedbackBotao(btn, labelOk, tempoMs = 900) {
  // guarda o estado original
  const txtOriginal   = btn.textContent;
  const corBgOriginal = btn.style.backgroundColor;
  const corTxtOriginal= btn.style.color;

  // aplica destaque
  btn.textContent      = labelOk;
  btn.style.backgroundColor = "#28a745"; // verde
  btn.style.color      = "#fff";

  // reverte depois do tempo definido
  setTimeout(() => {
    btn.textContent      = txtOriginal;
    btn.style.backgroundColor = corBgOriginal;
    btn.style.color      = corTxtOriginal;
  }, tempoMs);
}





  