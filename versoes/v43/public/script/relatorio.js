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
        <div style="grid-column: span 2; display: flex; flex-wrap: wrap; gap: 20px; align-items: center;">
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
    
      } else if (col === "status") {
        celula.textContent = item.status === "fechado" ? "fechado" : "aberto";
    
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
    const ticketAtualizado = await fetch(`/ticket/${ticketAtual}`).then(res => res.json());
   
  
    const linhas = tabela.rows;
    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i];
      if (linha.dataset.ticket === ticketAtual) {
        const dados = ticketAtualizado;
  
        linha.dataset.descricao = dados.descricao || "";
        linha.dataset.cliente = dados.cliente;
  
        // Atualiza células da tabela
        colunas.forEach((col, idx) => {
          const celula = linha.cells[idx]; // ✅ CORRETO: atualiza a célula existente
        
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
        
              link.addEventListener("click", (e) => {
                e.stopPropagation();
              });
        
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
        
  
        // 🔁 Reabre o modal com dados atualizados
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
          <div style="grid-column: span 2; margin-top: 10px;">
            <p><strong>Descrição:</strong></p>
            <textarea id="descricaoEditavel" rows="5" style="width: 100%; resize: vertical;">${dados.descricao}</textarea>
          </div>
        `;
  
        document.getElementById("conteudoModal").innerHTML = conteudoAtualizado;
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

// travar botão salvar

function travarBotaoSalvarEdicao() {
  const botao = document.getElementById("salvarEdicao");
  if (botao) {
    botao.disabled = true;
    botao.style.pointerEvents = "none";
    botao.style.backgroundColor = "#aaa"; // tom de cinza da imagem
    botao.style.color = "white"; // cor do texto
    botao.style.border = "none";
    botao.style.borderRadius = "6px";
    botao.style.padding = "6px 12px";
    botao.style.fontWeight = "bold";
    botao.style.cursor = "default";
  }
}

function ativarBotaoSalvarEdicao() {
  const botao = document.getElementById("salvarEdicao");
  if (botao) {
    botao.disabled = false;
    botao.style.pointerEvents = "auto";
    botao.style.padding = "8px 16px";
    botao.style.backgroundColor = "#2C34C9";
    botao.style.color = "white";
    botao.style.border = "none";
    botao.style.borderRadius = "5px";
    botao.style.fontSize = "14px";
    botao.style.marginTop = "30px";
    botao.style.cursor = "pointer";
    botao.style.fontFamily = "Arial, sans-serif";
  }
}


document.addEventListener("input", function (event) {
  if (event.target && event.target.id === "descricaoEditavel") {
    ativarBotaoSalvarEdicao();
  }
});

