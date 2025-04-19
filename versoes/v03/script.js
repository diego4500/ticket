

//// Vetor com o nomes das empresas simulando um banco de dados

const empresas = [
    { "nome": "Empresa Alpha", "cnpj": "00.000.001/0001-01", "cliente": true },
    { "nome": "Beta Soluções", "cnpj": "00.000.002/0001-02", "cliente": true },
    { "nome": "Gamma Tech", "cnpj": "00.000.003/0001-03", "cliente": true },
    { "nome": "Delta Comércio", "cnpj": "00.000.004/0001-04", "cliente": false },
    { "nome": "Epsilon Ltda", "cnpj": "00.000.005/0001-05", "cliente": false },
    { "nome": "Zeta Serviços", "cnpj": "00.000.006/0001-06", "cliente": false },
    { "nome": "Eta Consultoria", "cnpj": "00.000.007/0001-07", "cliente": false },
    { "nome": "Theta Engenharia", "cnpj": "00.000.008/0001-08", "cliente": false },
    { "nome": "Iota Digital", "cnpj": "00.000.009/0001-09", "cliente": false },
    { "nome": "Kappa Indústria", "cnpj": "00.000.010/0001-10", "cliente": false },
    { "nome": "Lambda Comércio", "cnpj": "00.000.011/0001-11", "cliente": false },
    { "nome": "Mu Tecnologia", "cnpj": "00.000.012/0001-12", "cliente": false },
    { "nome": "Nu Materiais", "cnpj": "00.000.013/0001-13", "cliente": false },
    { "nome": "Xi Transportes", "cnpj": "00.000.014/0001-14", "cliente": false },
    { "nome": "Omicron Segurança", "cnpj": "00.000.015/0001-15", "cliente": false },
    { "nome": "Pi Automação", "cnpj": "00.000.016/0001-16", "cliente": false },
    { "nome": "Rho Contabilidade", "cnpj": "00.000.017/0001-17", "cliente": false },
    { "nome": "Sigma Marketing", "cnpj": "00.000.018/0001-18", "cliente": false },
    { "nome": "Tau Sistemas", "cnpj": "00.000.019/0001-19", "cliente": false },
    { "nome": "Upsilon Alimentos", "cnpj": "00.000.020/0001-20", "cliente": false },
    { "nome": "Phi Arquitetura", "cnpj": "00.000.021/0001-21", "cliente": true },
    { "nome": "Chi Software", "cnpj": "00.000.022/0001-22", "cliente": true },
    { "nome": "Psi Design", "cnpj": "00.000.023/0001-23", "cliente": true },
    { "nome": "Omega Cosméticos", "cnpj": "00.000.024/0001-24", "cliente": true },
    { "nome": "Alpha Beta", "cnpj": "00.000.025/0001-25", "cliente": false },
    { "nome": "Zeta Sigma", "cnpj": "00.000.026/0001-26", "cliente": false },
    { "nome": "Delta Psi", "cnpj": "00.000.027/0001-27", "cliente": false },
    { "nome": "Epsilon Rho", "cnpj": "00.000.028/0001-28", "cliente": false },
    { "nome": "Lambda Pi", "cnpj": "00.000.029/0001-29", "cliente": false },
    { "nome": "Mu Xi", "cnpj": "00.000.030/0001-30", "cliente": false }
];

const simulacaoBancoDeDados = [
    {
        "ticket": 1001,
        "nome": "Gamma Tech",
        "cnpj": "00.000.003/0001-03",
        "cliente": true,
        "atendente": "diego",
        "card": "4512",
        "status": "pendente",
        "titulo": "como criar pedido",
        "menu": "pedido",
        "Descrição": "",
        "data": "10/02/2025",
        "hora": "12:55"
    },
    {
        "ticket": 1002,
        "nome": "Beta Soluções",
        "cnpj": "00.000.002/0001-02",
        "cliente": true,
        "atendente": "diego",
        "card": "4513",
        "status": "pendente",
        "titulo": "erro ao salvar",
        "menu": "faturamento",
        "Descrição": "",
        "data": "10/02/2025",
        "hora": "13:00"
    },
    {
        "ticket": 1003,
        "nome": "Empresa Alpha",
        "cnpj": "00.000.001/0001-01",
        "cliente": true,
        "atendente": "diego",
        "card": "4514",
        "status": "pendente",
        "titulo": "campo obrigatório",
        "menu": "produto",
        "Descrição": "",
        "data": "10/02/2025",
        "hora": "13:05"
    },
    {
        "ticket": 1004,
        "nome": "Phi Arquitetura",
        "cnpj": "00.000.021/0001-21",
        "cliente": true,
        "atendente": "diego",
        "card": "4515",
        "status": "pendente",
        "titulo": "menu não aparece",
        "menu": "modelo de texto",
        "Descrição": "",
        "data": "10/02/2025",
        "hora": "13:10"
    },
    {
        "ticket": 1005,
        "nome": "Chi Software",
        "cnpj": "00.000.022/0001-22",
        "cliente": true,
        "atendente": "diego",
        "card": "4516",
        "status": "pendente",
        "titulo": "troca não finaliza",
        "menu": "troca",
        "Descrição": "",
        "data": "10/02/2025",
        "hora": "13:15"
    },
    {
        "ticket": 1006,
        "nome": "Psi Design",
        "cnpj": "00.000.023/0001-23",
        "cliente": true,
        "atendente": "diego",
        "card": "4517",
        "status": "pendente",
        "titulo": "modelo contrato errado",
        "menu": "contrato",
        "Descrição": "",
        "data": "10/02/2025",
        "hora": "13:20"
    },
    {
        "ticket": 1007,
        "nome": "Omega Cosméticos",
        "cnpj": "00.000.024/0001-24",
        "cliente": true,
        "atendente": "diego",
        "card": "4518",
        "status": "pendente",
        "titulo": "erro no financeiro",
        "menu": "financeiro",
        "Descrição": "",
        "data": "10/02/2025",
        "hora": "13:25"
    },
    {
        "ticket": 1008,
        "nome": "Delta Comércio",
        "cnpj": "00.000.004/0001-04",
        "cliente": false,
        "atendente": "diego",
        "card": "4519",
        "status": "pendente",
        "titulo": "dúvida sobre contrato",
        "menu": "contrato",
        "Descrição": "",
        "data": "10/02/2025",
        "hora": "13:30"
    },
    {
        "ticket": 1009,
        "nome": "Zeta Serviços",
        "cnpj": "00.000.006/0001-06",
        "cliente": false,
        "atendente": "diego",
        "card": "4520",
        "status": "pendente",
        "titulo": "como imprimir boleto",
        "menu": "financeiro",
        "Descrição": "",
        "data": "10/02/2025",
        "hora": "13:35"
    },
    {
        "ticket": 1010,
        "nome": "Iota Digital",
        "cnpj": "00.000.009/0001-09",
        "cliente": false,
        "atendente": "diego",
        "card": "4521",
        "status": "pendente",
        "titulo": "problema ao abrir tela",
        "menu": "sistema",
        "Descrição": "",
        "data": "10/02/2025",
        "hora": "13:40"
    }
]
let menu = [
    "produto", "faturamento", "modelo de texto", "contrato",
    "expedição", "troca", "indenização", "financeiro"];

// Todas as const e let
const divFechar = document.querySelector(".novo_fechar");
const razaoInput = document.getElementById("razao_social");
const botaoSalvar = document.querySelector("button[type='submit']");
const ticket = document.getElementById("ticket");
const sugestoesDiv = document.getElementById("sugestoes");
const tipo = document.getElementById("tipo");

////////////////////////////////////////////////////////////////////////////////
// EVENTOS INICIO

// Razao Social input - Início
// Exibe as opções ao clicar e digitar no input
razaoInput.addEventListener("input", () => {
    // Dentro de função há um outro evento quando clica no cliente
    // Dentro do evento de click é acionado a função bloquearRazaoSocial()
    razaoSocialSugestoes(razaoInput.value);
});
// Razao Social input - Fim

// Seleção do tipo: dúvida, funcionalidade, churn ou sistema
tipo.addEventListener("change", () => {
    const valorSelecionado = tipo.value;
    selecaoTipo(valorSelecionado);    
});

// EVENTOS FIM
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// FUNÇÕES INÍCIO ---->

// Ativar botao salvar 
function ativarBotaoSalvar() {
    botaoSalvar.disabled = false;
    botaoSalvar.classList.remove("botao-desativado");
    botaoSalvar.classList.add("botao-ativo");
}

// Desativar o botão salvar
function desativarBotaoSalvar() {
    botaoSalvar.disabled = true;
    botaoSalvar.classList.remove("botao-ativo");
    botaoSalvar.classList.add("botao-desativado");
}

// Bloqueia a razão social
function bloquearRazaoSocial() {
    razaoInput.readOnly = true;
    razaoInput.style.backgroundColor = "#e0e0e0"; // cinza claro
    razaoInput.style.cursor = "not-allowed";      // cursor de bloqueado
}

// Desbloqueia a razão social
function desbloquearRazaoSocial() {
    razaoInput.readOnly = false;
    razaoInput.style.backgroundColor = ""; // volta ao padrão
    razaoInput.style.cursor = ""; // volta ao padrão
}

// Preenchimento do tiket automatico, ele verifica o último e soma mais 1 //
function sugerirProximoTicket() {
    const dados = JSON.parse(localStorage.getItem("simulacaoBancoDeDados")) || [];

    if (dados.length === 0) {
        ticket.value = 1001;
    } else {
        const ultimoTicket = Math.max(...dados.map(ticket => ticket.ticket));
        ticket.value = ultimoTicket + 1;
    }
}

function manterOTicket() {
    const dados = JSON.parse(localStorage.getItem("simulacaoBancoDeDados")) || [];

    if (dados.length === 0) {
        ticket.value = 1001;
    } else {
        const ultimoTicket = Math.max(...dados.map(ticket => ticket.ticket));
        ticket.value = ultimoTicket;
    }
}

/* 
Essa função carrega os dados para dar sequência no mesmo ticket, caso deseje não puxar esses dados
basta clicar no botação fechar ticket que esse localstorage será apagado e automaticamente 
os dados não serão mais puxados.
*/
function CarregarDadosClienteLocalstorage() {
    const campos = ["razao_social", "cnpj", "cliente", "atendente"];
    campos.forEach(campo => {
        const valor = localStorage.getItem(campo);
        if (valor !== null) {
            if (campo === "cliente") {
                const check = document.getElementById("cliente");
                check.checked = valor === "true";
                check.disabled = valor === "true";
            } else {
                document.getElementById(campo).value = valor;
            }
        }
    });
}

function verificaNovoFecharNone() {
    if (getComputedStyle(divFechar).display === "none") {
        ativarBotaoSalvar();
    }
}

function selecaoTipo(valorSelecionado) {
    const divGerada = document.querySelector(".divGerada");
    divGerada.innerHTML = ""; // limpa conteúdo anterior

    switch (valorSelecionado) {
        case "duvida":
            duvidaSelecionada(); // ✅ chama a função dúvida criando toda a estrutura 
            break;

        case "funcionalidade":
            funcionalidadeSelecionada();
            break;

        case "churn":
            break;

        case "sistema":
            break;
    }

    // Oculta a div de fechar
    document.querySelector(".novo_fechar").style.display = "none";
}


// Nessa função é criada toda a estrutura HTML para completar o formulário dúvida
function duvidaSelecionada() {
    const divGerada = document.querySelector(".divGerada");

    const novaDiv = document.createElement("div");
    novaDiv.classList.add("duvida");

    novaDiv.innerHTML = `
        <div class="check">
            <label for="card">Abrir Card?</label>
            <input type="checkbox" id="card">
        </div>
        <div class="status">
            <label for="status">Status:</label>
            <select id="status" name="status" required>
                <option value="" disabled selected>Selecione um Status</option>
                <option value="pendente">Pendente</option>
                <option value="em-analise">Em Análise</option>
                <option value="resolvido">Resolvido</option>
            </select>
        </div>
        <label for="titulo">Título:</label>
        <input type="text" id="titulo" autocomplete="off">

        <label for="menu_duvida">Menu/Dúvida:</label>
        <div class="sugestoes-container">
            <input type="text" id="menu_duvida" name="menu_duvida" autocomplete="off" required>
            <div id="sugestoesMenu"></div>
        </div>

        <label for="descricao">Descrição:</label>
        <textarea id="descricao" name="descricao" autocomplete="off"></textarea>
    `;

    divGerada.appendChild(novaDiv);
}

function funcionalidadeSelecionada() {
    const divGerada = document.querySelector(".divGerada");

    const novaDiv = document.createElement("div");
    novaDiv.classList.add("funcionalidade");
    novaDiv.style.display = "block"; // exibe a div gerada

    novaDiv.innerHTML = `
        <div class="status">
            <label for="status">Status:</label>
            <select id="status" name="status" required>
                <option value="" disabled selected>Selecione um Status</option>
                <option value="pendente">Pendente</option>
                <option value="em-analise">Em Análise</option>
                <option value="resolvido">Resolvido</option>
            </select>
        </div> 
        <label for="funcionalidade_cadastrada">Funcionalidade</label>
        <div class="sugestoes-container">
            <input type="text" id="funcionalidade_cadastrada" name="funcionalidade_cadastrada" autocomplete="off" required>
            <div id="sugestoesMenu"></div>
        </div>
        <label for="descricao">Descrição:</label>
        <textarea id="descricao" name="descricao" autocomplete="off"></textarea>
    `;

    divGerada.appendChild(novaDiv);
}

function razaoSocialSugestoes(razao) {
    const termoLower = razao.trim().toLowerCase();
    sugestoesDiv.innerHTML = "";

    const resultados = empresas.filter(emp =>
        emp.nome.toLowerCase().includes(termoLower)
    );

    if (resultados.length > 0) {
        resultados.forEach(empresa => {
            const div = document.createElement("div");
            div.textContent = empresa.nome;

            // Evento ao clicar no cliente fixa as informações no formulário como: nome, cnpj, cliente
            div.addEventListener("click", () => {
                razaoInput.value = empresa.nome;
                document.getElementById("cnpj").value = empresa.cnpj;
                const checkbox = document.getElementById("cliente");
                checkbox.checked = empresa.cliente;
                checkbox.disabled = empresa.cliente;
                sugestoesDiv.style.display = "none";
                //Ao clicar no clicar no cliente o nome Razão Social é bloqueado para edição
                bloquearRazaoSocial();
                verificaNovoFecharNone();
            });
            sugestoesDiv.appendChild(div);
        });
        sugestoesDiv.style.display = "block";
    } else {
        sugestoesDiv.style.display = "none";
    }
}
// Oculta sugestões ao clicar fora
document.addEventListener("click", (e) => {
    if (!razaoInput.contains(e.target) && !sugestoesDiv.contains(e.target)) {
        sugestoesDiv.style.display = "none";
    }
});
// FUNÇÕES FIM
////////////////////////////////////////////////////////////////////////////////


