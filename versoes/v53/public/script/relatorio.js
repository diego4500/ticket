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

const colunas = [
  "ticket", "atendente", "razao_social", "tipo", "titulo", "cliente", "status", "data_abertura", "data_fechamento", "chamado"
];




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
    console.log("Cliente do ticket", item.ticket, "->", item.cliente);
    const linha = tabela.insertRow();
    linha.style.cursor = "pointer";

    // Armazena os dados no dataset da linha
    linha.dataset.ticket = item.ticket;
    linha.dataset.descricao = item.descricao || "";

    linha.dataset.cliente = item.cliente;


    linha.addEventListener("click", () => {
      travarBotaoSalvarEdicao();
      ticketAtual = linha.dataset.ticket;
      const descricaoSalva = linha.dataset.descricao || "";

      const conteudo = `
      <div>
        <p><strong>Ticket:</strong> ${item.ticket}</p>
        <p><strong>Atendente:</strong> ${primeiraMaiuscula(item.atendente)}</p>
      </div>
      <div>
        <p><strong>Status:</strong>
          <select id="statusEditavel" ${item.status === "fechado" ? "disabled" : ""}>
  <option value="aberto" ${item.status === "aberto" ? "selected" : ""}>Aberto</option>
  <option value="fechado" ${item.status === "fechado" ? "selected" : ""}>Fechado</option>
</select>
        </p>
        <div style=" grid-column: span 2; display: flex; flex-wrap: wrap; gap: 20px; align-items: center;">
  <p><strong>Data Abertura:</strong> ${item.data_abertura}</p>
  <p><strong>Hora Abertura:</strong> ${item.hora || '-'}</p>
  <p><strong>Data Fechamento:</strong> ${item.data_fechamento || '-'}</p>
  <p><strong>Hora Fechamento:</strong> ${item.hora_fechamento || '-'}</p>
</div>
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
      <div style="grid-column: span 2; margin-right: 25px;">
        <p><strong>Descrição:</strong></p>
        <textarea id="descricaoEditavel" rows="5" style="width: 100%; padding-right: 10px; resize: vertical; height: 270px;">${linha.dataset.descricao}</textarea>
      </div>
    `;

      document.getElementById("conteudoModal").innerHTML = conteudo;
      document.getElementById("modal").style.display = "flex";
    });

    colunas.forEach(col => {
      const celula = linha.insertCell();

      if (col === "chamado") {
        const url = item[col];
        const valido = url && url.includes("chat.azpost.com.br/app/accounts/18/conversations");

        celula.innerHTML = "";

        if (valido) {
          const link = document.createElement("a");
          link.href = url;
          link.target = "_blank";
          link.textContent = "Chatwoot";
          link.style.color = "#2C34C9";
          link.style.textDecoration = "underline";
          link.style.cursor = "pointer";

          // Impede que o clique no link abra o modal
          link.addEventListener("click", (e) => {
            e.stopPropagation();
          });

          celula.appendChild(link);
        } else {
          celula.textContent = "-";
        }

      } else if (col === "cliente") {
        celula.textContent = item.cliente;
      } else if (col === "status" || col === "tipo" || col === "atendente") {
        celula.textContent = primeiraMaiuscula(item[col]);
      } else {
        celula.textContent = (item[col] === null || item[col] === undefined || item[col] === '') ? '-' : item[col];
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
  travarBotaoSalvarEdicao();

  const novaDescricao = document.getElementById("descricaoEditavel").value;
  const statusSelect = document.getElementById("statusEditavel");
  const novoStatus = statusSelect.disabled ? "fechado" : statusSelect.value;

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
    const dados = await fetch(`/ticket/${ticketAtual}`).then(res => res.json());

    const linhas = tabela.rows;
    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i];
      if (linha.dataset.ticket === ticketAtual) {
        linha.dataset.descricao = dados.descricao || "";
        linha.dataset.cliente = dados.cliente;
        

        colunas.forEach((col, idx) => {
          const celula = linha.cells[idx];

          if (col === "chamado") {
            const url = dados[col];
            const valido = url && url.includes("chat.azpost.com.br/app/accounts/18/conversations");
            celula.innerHTML = "";

            if (valido) {
              const link = document.createElement("a");
              link.href = url;
              link.target = "_blank";
              link.textContent = "Chatwoot";
              link.style.color = "#2C34C9";
              link.style.textDecoration = "underline";
              link.style.cursor = "pointer";
              link.addEventListener("click", (e) => e.stopPropagation());
              celula.appendChild(link);
            } else {
              celula.textContent = "-";
            }

          } else if (col === "cliente") {
            celula.textContent = dados.cliente;
          } else if (col === "status") {
            celula.textContent = dados.status === "fechado" ? "fechado" : "aberto";
          } else {
            celula.textContent = (dados[col] === null || dados[col] === undefined || dados[col] === '') ? '-' : dados[col];
          }
        });

        const conteudoAtualizado = `
          <div>
            <p><strong>Ticket:</strong> ${dados.ticket}</p>
            <p><strong>Atendente:</strong> ${primeiraMaiuscula(dados.atendente)}</p>
          </div>
          <div>
            <p><strong>Status:</strong>
              <select id="statusEditavel" ${dados.status === "fechado" ? "disabled" : ""}>
                <option value="aberto" ${dados.status === "aberto" ? "selected" : ""}>Aberto</option>
                <option value="fechado" ${dados.status === "fechado" ? "selected" : ""}>Fechado</option>
              </select>
            </p>
            <div style="grid-column: span 2; display: flex; flex-wrap: wrap; gap: 20px; align-items: center;">
              <p><strong>Data Abertura:</strong> ${dados.data_abertura}</p>
              <p><strong>Hora Abertura:</strong> ${dados.hora || '-'}</p>
              <p><strong>Data Fechamento:</strong> ${dados.data_fechamento || '-'}</p>
              <p><strong>Hora Fechamento:</strong> ${dados.hora_fechamento || '-'}</p>
            </div>
          </div>
          <div>
            <p><strong>Tipo:</strong> ${primeiraMaiuscula(dados.tipo)}</p>
            <p><strong>Título:</strong> ${primeiraMaiuscula(dados.titulo)}</p>
          </div>
          <div style="grid-column: span 2; display: flex; gap: 20px; align-items: center;">
            <p><strong>Razão Social:</strong> ${primeiraMaiuscula(dados.razao_social)}</p>
            <p><strong>Cliente:</strong> ${primeiraMaiuscula(dados.cliente)}</p>
          </div>
          ${dados.chamado && dados.chamado.includes("chat.azpost.com.br") ?
            `<div style="grid-column: span 2;"><p><strong>Chamado:</strong> <a href="${dados.chamado}" target="_blank">Abrir chamado</a></p></div>` : ""
          }
          <div style="grid-column: span 2; margin-right: 25px;">
            <p><strong>Descrição:</strong></p>
            <textarea id="descricaoEditavel" rows="5" style="width: 100%; padding-right: 10px; resize: vertical; height: 270px;">${dados.descricao}</textarea>
          </div>
        `;

        document.getElementById("conteudoModal").innerHTML = conteudoAtualizado;

        const statusAtualizado = document.getElementById("statusEditavel");
        if (statusAtualizado && dados.status === "fechado") {
          statusAtualizado.disabled = true;
        }

        document.getElementById("modal").style.display = "flex";
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

  window.open(`/${url}`, "_blank");

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

// travar botão salvar

function travarBotaoSalvarEdicao() {
  const botao = document.getElementById("salvarEdicao");
  if (botao) {
    botao.disabled = true;
    botao.style.pointerEvents = "none";
    botao.style.backgroundColor = "#aaa"; // tom de cinza da imagem
    botao.style.color = "white"; // cor do texto
    botao.style.border = "none";
    botao.style.borderRadius = "5px";
    botao.style.padding = "10px";
    botao.style.cursor = "default";
    botao.style.width = "150px";
    botao.style.fontSize = "16px";
    botao.style.marginTop = "10px";
    botao.style.marginLeft = "5px";
  }
}

function ativarBotaoSalvarEdicao() {
  const botao = document.getElementById("salvarEdicao");
  if (botao) {
    botao.disabled = false;
    botao.style.pointerEvents = "auto";  
    botao.style.color = "white";
    botao.style.border = "none";
    botao.style.borderRadius = "5px";
    botao.style.cursor = "pointer";
    botao.style.backgroundColor = "#640fd3";
    botao.style.width = "150px";
    botao.style.padding = "10px";
    botao.style.fontSize = "16px";
    botao.style.marginTop = "10px";
    botao.style.marginLeft = "5px";
  }
}


document.addEventListener("input", function (event) {
  if (event.target && event.target.id === "descricaoEditavel") {
    ativarBotaoSalvarEdicao();
  }
});

document.addEventListener("change", function (event) {
  if (event.target && event.target.id === "statusEditavel") {
    console.log("Novo status selecionado:", event.target.value);

    // Aqui você pode ativar o botão de salvar, por exemplo:
    ativarBotaoSalvarEdicao();
  }
});

document.addEventListener("focusin", function (event) {
  if (event.target && event.target.id === "descricaoEditavel") {
    const textarea = event.target;

    if (!textarea.dataset.preenchido) {
      const agora = new Date();
      const dia = String(agora.getDate()).padStart(2, '0');
      const mes = String(agora.getMonth() + 1).padStart(2, '0');
      const ano = agora.getFullYear();
      const hora = String(agora.getHours()).padStart(2, '0');
      const minutos = String(agora.getMinutes()).padStart(2, '0');

      const dataHora = `${dia}/${mes}/${ano} ${hora}:${minutos} \n\n--------------\n`;

      textarea.value = `${dataHora}\n${textarea.value}`;
      textarea.dataset.preenchido = "true";
    }
  }
});

document.getElementById("fecharBotao").addEventListener("click", async () => {
  document.getElementById("modal").style.display = "none";

  // Reaplica o filtro atual para carregar os dados atualizados
  offset = 0;
  tabelaContainer.innerHTML = "";
  criarCabecalho();
  await carregarTicketsFiltrado();
  containerCarregar.style.display = "block";
});

