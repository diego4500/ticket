const seletor = document.getElementById("relatorio_ticket");
const mensagem = document.getElementById("mensagem-relatorio");
const tabelaContainer = document.getElementById("tabela-relatorio");
const botaoCarregar = document.getElementById("botaoCarregarMais");
const containerCarregar = document.getElementById("container-carregar");
const tabela = document.createElement("table");
tabela.classList.add("tabela-relatorio");

let offset = 0;
const limite = 20;
let statusFiltro = null;
let ticketAtual = null;

const colunas = ["ticket", "atendente", "razao_social", "tipo", "titulo", "status", "data_abertura", "cliente", "chamado"];


const criarCabecalho = () => {
  tabela.innerHTML = "";
  const cabecalho = tabela.insertRow();
  colunas.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    cabecalho.appendChild(th);
  });
  tabelaContainer.innerHTML = "";
  tabelaContainer.appendChild(tabela);
};

const carregarTicketsFiltrado = async () => {
  try {
    let url = `/tickets-filtrado?offset=${offset}&limite=${limite}`;
    if (statusFiltro) {
      url += `&status=${statusFiltro}`;
    }

    const resposta = await fetch(url);
    const dados = await resposta.json();

    if (!dados || dados.length === 0) {
      botaoCarregar.style.display = "none";
      return;
    }

    adicionarNaTabela(dados);
    offset += limite;

    if (dados.length < limite) {
      botaoCarregar.style.display = "none";
    } else {
      botaoCarregar.style.display = "block";
    }

  } catch (err) {
    console.error("Erro ao carregar tickets filtrados:", err);
  }
};

const adicionarNaTabela = (dados) => {
  dados.forEach(item => {
    const linha = tabela.insertRow();
    linha.style.cursor = "pointer";

    // Armazena os dados no dataset da linha
    linha.dataset.ticket = item.ticket;
    linha.dataset.descricao = item.descricao || "";

    linha.dataset.cliente = item.cliente; // <= adiciona o status "Sim" ou "Não"


    linha.addEventListener("click", () => {
      ticketAtual = linha.dataset.ticket;
      const descricaoSalva = linha.dataset.descricao || "";

      const conteudo = `
      <div>
        <p><strong>Ticket:</strong> ${item.ticket}</p>
        <p><strong>Atendente:</strong> ${primeiraMaiuscula(item.atendente)}</p>
      </div>
      <div>
        <p><strong>Status:</strong>
          <select id="statusEditavel">
            <option value="Aberto" ${item.status === "Aberto" ? "selected" : ""}>Aberto</option>
            <option value="Fechado" ${item.status === "Fechado" ? "selected" : ""}>Fechado</option>
          </select>
        </p>
        <p><strong>Data Abertura:</strong> ${item.data_abertura}</p>
      </div>
      <div>
        <p><strong>Tipo:</strong> ${primeiraMaiuscula(item.tipo)}</p>
        <p><strong>Título:</strong> ${primeiraMaiuscula(item.titulo)}</p>
      </div>
      <div style="grid-column: span 2; display: flex; gap: 20px; align-items: center;">
        <p><strong>Razão Social:</strong> ${primeiraMaiuscula(item.razao_social)}</p>
        <p><strong>Cliente:</strong> ${primeiraMaiuscula(linha.dataset.cliente)}</p>
      </div>
      ${item.chamado && item.chamado.includes("chat.azpost.com.br") ?
        `<div style="grid-column: span 2;"><p><strong>Chamado:</strong> <a href="${item.chamado}" target="_blank">Abrir chamado</a></p></div>`
        : ""
      }
      <div style="grid-column: span 2; margin-top: 10px;">
        <p><strong>Descrição:</strong></p>
        <textarea id="descricaoEditavel" rows="5" style="width: 100%; resize: vertical;">${linha.dataset.descricao}</textarea>
      </div>
    `;
    
      document.getElementById("conteudoModal").innerHTML = conteudo;
      document.getElementById("modal").style.display = "flex";
    });

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
          botao.onclick = (e) => {
            e.stopPropagation();
            window.open(url, "_blank");
          };
        }
        celula.appendChild(botao);
      } else {
        celula.textContent = item[col];
      }
    });
  });
};

seletor.addEventListener("change", async (event) => {
  offset = 0;
  statusFiltro = event.target.value === "todos" ? null : event.target.value;

  mensagem.style.display = "none";
  tabelaContainer.innerHTML = "";
  criarCabecalho();

  await carregarTicketsFiltrado();
  containerCarregar.style.display = "block";
});

botaoCarregar.addEventListener("click", carregarTicketsFiltrado);

document.getElementById("formEditarDescricao").addEventListener("submit", async (e) => {
  e.preventDefault();
  const novaDescricao = document.getElementById("descricaoEditavel").value;
  const novoStatus = document.getElementById("statusEditavel").value;


  const resposta = await fetch("/atualizar-descricao", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ticket: ticketAtual,
      descricao: novaDescricao,
      status: novoStatus
    })
  });

  if (resposta.ok) {
    alert("Descrição atualizada com sucesso!");
    document.getElementById("modal").style.display = "none";

    // Atualiza a descrição no dataset da linha correspondente
    const linhas = tabela.rows;
    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i];
      if (linha.dataset.ticket === ticketAtual) {
        linha.dataset.descricao = novaDescricao; // atualiza a descrição

        // Atualiza a célula do status na tabela (coluna 5 = status)
        const novaCelulaStatus = linha.cells[5];
        if (novaCelulaStatus) novaCelulaStatus.textContent = novoStatus;

        break;
      }
    }
  } else {
    alert("Erro ao atualizar a descrição.");
  }
});

document.getElementById("fecharBotao").addEventListener("click", () => {
  document.getElementById("modal").style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target.id === "modal") {
    document.getElementById("modal").style.display = "none";
  }
});

const exportarExcel = document.getElementById("exportar_excelB");
exportarExcel.addEventListener("change", async (event) => {
  const valorSelecionado = event.target.value;
  let url = "";

  switch (valorSelecionado) {
    case "todos": url = "exportar-excel"; break;
    case "duvidas": url = "exportar-excel-duvidas"; break;
    case "funcionalidades": url = "exportar-excel-funcionalidade"; break;
    case "churn": url = "exportar-excel-churn"; break;
    case "sistema": url = "exportar-excel-sistema"; break;
    default:
      console.warn("Valor não reconhecido.");
      return;
  }

  window.open(`http://localhost:3000/${url}`, "_blank");
  event.target.value = "";
});

function primeiraMaiuscula(texto) {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .split(' ')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}
