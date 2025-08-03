

let paginaAtual       = 1;
const limitePorPagina = 50;
let ultimoLote        = 0;
let ticketEmEdicao    = null;

// Utilitário para aguardar elemento no DOM com Promise
function esperarElemento(seletor) {
  return new Promise(resolve => {
    const el = document.querySelector(seletor);
    if (el) return resolve(el);
    const obs = new MutationObserver(() => {
      const el = document.querySelector(seletor);
      if (el) {
        obs.disconnect();
        resolve(el);
      }
    });
    obs.observe(document.body, {childList: true, subtree: true});
  });
}


document.addEventListener("DOMContentLoaded", async () => {
/* ======================  RELATORIO_BUSCAR.JS  ====================== */

const lupa            = document.getElementById("lupa");
const container       = document.getElementById("tabela-relatorio");
const msg             = document.getElementById("mensagem-relatorio");
const btnCarregar     = document.getElementById("botaoCarregarMais");
const modal           = document.getElementById("modal");
const conteudoModal   = document.getElementById("conteudoModal");
const btnFecharModal  = document.getElementById("fecharBotao");
const btnSalvarModal  = document.getElementById("salvarEdicao");

  const inputBusca = await esperarElemento("#inputBuscaTicket");

  const params = new URLSearchParams(window.location.search);
  const status = params.get('status');
  const atendente = params.get('atendente');
  const termo = params.get('termo');

  let busca = "";
  if (status) busca += status + " ";
  if (atendente) busca += atendente + " ";
  if (termo) busca += termo + " ";
  busca = busca.trim();

  if (busca) {
    inputBusca.value = busca;
    paginaAtual = 1;
    buscarTickets();
  } else {
    buscarTickets();
  }

  const firstUpper = t => (!t ? "" : t
  .toLowerCase()
  .split(" ")
  .map(p => p.charAt(0).toUpperCase() + p.slice(1))
  .join(" "));

  // ------------------------- NOVO HELPER -------------------------
// Recebe "2025-05-10T03:00:00.000Z"  e devolve "10/05/2025"
const dataBr = iso => {
  if (!iso) return "-";                 // trata nulo ou string vazia
  const [ano, mes, dia] = iso.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
};
// ---------------------------------------------------------------


function showOrHideLoadBtn() {
  btnCarregar.style.display =
    ultimoLote === limitePorPagina ? "block" : "none";
}
function travarSalvar()   { btnSalvarModal.classList.add("desativado"); btnSalvarModal.disabled = true; }
function destravarSalvar(){ btnSalvarModal.classList.remove("desativado"); btnSalvarModal.disabled = false; }

/* ------------------------------------------------------------------ */
/* Busca paginada                                                     */
/* ------------------------------------------------------------------ */
async function buscarTickets(pagina = 1) {
  const termo  = inputBusca.value.trim();
  const offset = (pagina - 1) * limitePorPagina;

  try {
    const resp   = await fetch(`/buscar-ticket?termo=${encodeURIComponent(termo)}&offset=${offset}&limite=${limitePorPagina}`);
    
    const dados  = await resp.json();
    
    ultimoLote   = dados.length;

    if (pagina === 1) {
      container.innerHTML = "";
      criarEstruturaTabela();
    }
    if (!dados.length && pagina === 1) {
      container.innerHTML = "<p style='text-align:center;color:#888;'>Nenhum resultado encontrado.</p>";
      showOrHideLoadBtn();
      return;
    }

    preencherTabela(dados);
    showOrHideLoadBtn();
    msg.style.display = "none";

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p style='text-align:center;color:#e00;'>Erro ao buscar dados.</p>";
    showOrHideLoadBtn();
  }
}

function criarEstruturaTabela() {
  if (container.querySelector("table")) return;
  container.innerHTML = `
    <table class="tabela-relatorio">
      <thead>
        <tr>
          <th>Ticket</th>
          <th>Atendente</th>
          <th>Razão Social</th><th>Tipo</th>
          <th>Título</th>
          <th>Cliente</th>
          <th>Status</th>
          <th>Criticidade</th>
          <th>Data Abertura</th>
          <th>Data Fechamento</th>
          <th>Chamado</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>`;
}

function preencherTabela(linhas) {
  const tbody = container.querySelector("tbody");
  linhas.forEach(item => {
    const tr = document.createElement("tr");

    /* --- título dinâmico -------------------------------------------------- */
    let tituloCol;
    switch ((item.tipo || "").toLowerCase()) {
      case "duvida":           // sem acento
      case "dúvida":           // com acento
        tituloCol = item.menu_duvida ?? "-";
        break;

      case "funcionalidade":
        tituloCol = item.funcionalidade ?? "-";
        break;

      case "sistema":
        tituloCol = item.sistema ?? "-";
        break;

      case "churn":
        tituloCol = item.churn ?? "-";
        break;

      default:                 // qualquer outro tipo
        tituloCol = item.titulo ?? "-";
    }
    let tipo = item.tipo;
    

    if(item.bug == 1 && item.tipo === "duvida" || item.tipo ==="dúvida"){
      tituloCol = item.titulo
      tipo = "Bug"
    }

    if(item.melhoria == 1 && item.tipo === "duvida" || item.tipo ==="dúvida"){
      tituloCol = item.titulo
      tipo = "Melhoria"
    }

    if(item.melhoria == 1 && item.tipo === "funcionalidade"){    
      tituloCol = item.titulo
      tipo = "Melhoria"
    }

    /* --- link do chamado -------------------------------------------------- */
    const chamado = item.chamado?.includes("chat.azpost.com.br")
      ? `<a href="${item.chamado}" target="_blank"
            style="color:#2C34C9;text-decoration:underline;"
            onclick="event.stopPropagation()">Chatwoot</a>`
      : "-";

    /* --- linha completa --------------------------------------------------- */
    tr.innerHTML = `
      <td>${item.ticket}</td>
      <td>${firstUpper(item.atendente)}</td>
      <td class="razao-social">${item.razao_social}</td>
      <td>${firstUpper(tipo)}</td>
      <td class="tabela-titulo">${tituloCol}</td>
      <td>${item.cliente == 1 ? "✅" : "❌"}</td>
      <td>${firstUpper(item.status)}</td>
      <td>${firstUpper(item.criticidade)}</td>
      <td>${dataBr(item.data_abertura)}</td>
      <td>${dataBr(item.data_fechamento)}</td>
      <td>${chamado}</td>`;

    tr.addEventListener("click", () => abrirModal(item));
    tbody.appendChild(tr);
  });
}


/* ------------------------------------------------------------------ */
/* Navegação e carregamento                                           */
/* ------------------------------------------------------------------ */
btnCarregar.addEventListener("click", () => { paginaAtual++; buscarTickets(paginaAtual); });
lupa.addEventListener("click",          () => { paginaAtual = 1; buscarTickets();       });
inputBusca.addEventListener("keypress", e => { if (e.key === "Enter"){ e.preventDefault(); paginaAtual = 1; buscarTickets(); }});

/* ------------------------------------------------------------------ */
/* MODAL                                                              */
/* ------------------------------------------------------------------ */
function abrirModal(item){
  ticketEmEdicao = item.ticket;
  travarSalvar();
  const ehFuncionalidade = (item.tipo || "").trim().toLowerCase() === "funcionalidade";
  const cnpj = formataCNPJ(item.cnpj)
  const statusAtual = (item.status || "").trim().toLowerCase();
  const statusDesabilitado = statusAtual === "fechado" ? "disabled" : "";

  
  conteudoModal.innerHTML = `
 <div class="grid-demo">

  <!-- bloco superior esquerdo ------------------------------------------------>
  <div class="top-left">
    <div class="item"><strong>Nº Ticket:</strong><p>${item.ticket}</p></div>
    <div class="item"><strong>Razão Social:</strong><p>${item.razao_social}</p></div>
    <div class="item"><strong>CNPJ:</strong><p>${cnpj}</p></div>
    <div class="item"><strong>Nome Fantasia:</strong><p>${item.nome_fantasia}</p></div>
    <div class="item"><strong>Cliente:</strong><p>${item.cliente === 1 ?"Sim" : "Não"}</p></div>
    <div class="item"><strong>Atendente:</strong><p>${item.atendente}</p></div>
 
    <div class="item"><strong>Tipo:</strong><p>${item.tipo}</p></div>
    
 
    
  </div>

  <!-- bloco superior direito ------------------------------------------------->
  <div class="top-right">
    <div class="top-right-grid">
        <div class="item"><strong>Data Abertura:</strong><p>${dataBr(item.data_abertura)}</p></div>
        <div class="item"><strong>Horário de Abertura:</strong><p>${item.hora || '-'}</p></p></div>
    
        <div class="item"><strong>Data Fechamento:</strong><p>${dataBr(item.data_fechamento)}</p></div>
        <div class="item"><strong>Horário de Fechamento:</strong><p>${item.hora_fechamento || '-'}</p></p></div>
           <div class="item">
        <strong>Status:</strong>
        <select id="statusEditavel" ${statusDesabilitado}>
            <option value="aberto" ${item.status === "aberto" ? "selected" : ""}>Aberto</option>
            <option value="fechado" ${item.status === "fechado" ? "selected" : ""}>Fechado</option>
          </select>  
    </div>
      <div class="item">
        <strong>Nº card DevOps:</strong>
        <input id="numero_card" type="text" style="width:130px" value="${item.card || ""}">
      </div>

      <div class="item">
        <strong>Tipo do card:</strong>
        <select id="tipoCard">
          <option value="">Selecione</option>
          <option value="bug"      ${Number(item.bug) === 1 ? "selected" : ""}>Bug</option>
          <option value="melhoria" ${Number(item.melhoria) === 1 ? "selected" : ""}>Melhoria</option>
        </select>
      </div>

       <div class="item">
        <strong>Criticidade:</strong>
     <select id="criticidade" name="criticidade">
  <option value="">Selecione</option>
  <option value="baixa" ${item.criticidade === "baixa" ? "selected" : ""}>Baixa</option>
  <option value="media" ${item.criticidade === "media" ? "selected" : ""}>Média</option>
  <option value="alta" ${item.criticidade === "alta" ? "selected" : ""}>Alta</option>
  <option value="urgente" ${item.criticidade === "urgente" ? "selected" : ""}>Urgente</option>
</select>

      </div>


      <div class="item">
        <div class="impeditivo_div">
            <strong>Impeditivo:</strong>
            <select id="impeditivo">
              <option value="1"      ${Number(item.impeditivo) === 1 ? "selected" : ""}>Sim</option>
                  <option value="0" ${Number(item.impeditivo) === 0 ? "selected" : ""}>Não</option>
            </select>
        </div>
      </div>
    </div>
  </div>

  <!-- bloco inferior (75 % + 25 %) ------------------------------------------>
  <div class="bottom">
    <div class="conteudo-bottom">
        <p><strong>Descrição:</strong></p>
        <textarea id="descricaoEditavel" rows="7">${item.descricao}</textarea>
    </div>
   
  </div>

</div>`;
// depois de   conteudoModal.innerHTML = ` ... `
const impDiv = conteudoModal.querySelector(".impeditivo_div");

if ((item.tipo || "").trim().toLowerCase() === "funcionalidade") {
  impDiv.style.display = "block";     // mostra
} else {
  impDiv.style.display = "none";      // garante que continue escondida
}

  modal.style.display = "flex";

  document.getElementById("descricaoEditavel")
          .addEventListener("focus", carimbarDataHora);

  /* qualquer alteração destrava botão Salvar */
  conteudoModal.querySelectorAll("input,select,textarea")
               .forEach(el => el.addEventListener("input", destravarSalvar));
}

function carimbarDataHora(e){
  if (e.target.dataset.carimbado) return;
  const now   = new Date();
  const stamp = now.toLocaleDateString("pt-BR")+" "+now.toLocaleTimeString("pt-BR")+"\n----------------------------------\n";
  e.target.value = stamp + e.target.value;
  e.target.dataset.carimbado = "1";
  destravarSalvar();
}

/* -------- controles modal ---------- */
btnFecharModal.addEventListener("click", fecharModal);
window.addEventListener("click", e => { if (e.target === modal) fecharModal(); });
function fecharModal(){ modal.style.display = "none"; }

/* -------- salvar --------- */
btnSalvarModal.addEventListener("click", async e=>{
  e.preventDefault();

 const payload = {
  ticket    : ticketEmEdicao,
  descricao : document.getElementById("descricaoEditavel").value,
  status    : document.getElementById("statusEditavel").value,
  card      : document.getElementById("numero_card").value || null,
  bug       : 0, melhoria: 0, impeditivo: null
};

const tCard = document.getElementById("tipoCard");
const imp   = document.getElementById("impeditivo");
const criticidadeEl = document.getElementById("criticidade");

if (tCard) {
  if (tCard.value === "bug") {
    payload.bug = 1;
  }
  if (tCard.value === "melhoria") {
    payload.melhoria = 1;
  }
}

if (imp) payload.impeditivo = Number(imp.value);
if (criticidadeEl) payload.criticidade = criticidadeEl.value;

try {
  const r = await fetch("/atualizar-descricao", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error("Falha no servidor");
  alert("Ticket atualizado!");
  fecharModal();
  paginaAtual = 1;
  buscarTickets();
} catch (err) {
  console.error(err);
  alert("Não foi possível salvar.");
}
travarSalvar();

});

/* ------------------------------------------------------------------ */


/* ====================== EXPORTAR EXCEL ============================ */
document.getElementById("exportar_excelB").addEventListener("change", e=>{
  const map={
    todos:"exportar-excel", razao_social:"exportar-excel-razao-social", duvidas:"exportar-excel-duvidas",
    funcionalidades:"exportar-excel-funcionalidade", churn:"exportar-excel-churn",
    cliente_churn:"exportar-excel-cliente-churn", sistema:"exportar-excel-sistema",
    apresentacao:"exportar-excel-apresentacao"
  };
  const rota = map[e.target.value];
  if (rota) window.open("/"+rota,"_blank");
  e.target.value="";
});
/* ================================================================== */

/**
 * formataCNPJ("12345678000195") → "12.345.678/0001-95"
 * Aceita números mistos com pontuação ou espaços e devolve
 *   somente no padrão XX.XXX.XXX/XXXX-XX
 * Se tiver menos de 14 dígitos, devolve o valor original.
 */
function formataCNPJ(valor) {
  if (!valor) return "";

  // remove tudo que não for número
  const digitos = valor.toString().replace(/\D/g, "");

  // exige 14 dígitos para aplicar a máscara
  if (digitos.length !== 14) return valor;

  return digitos.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}



/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

// ► NOVO: converte “2025-05-10T03:00:00.000Z” → “10/05/2025”



});



/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
