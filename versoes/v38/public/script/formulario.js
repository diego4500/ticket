//// Vetor com o nomes das empresas simulando um banco de dados




const simulacaoBancoDeDados = [
    {
        "ticket": 1001,
        "nome": "Gamma Tech",
        "cnpjB": "00.000.003/0001-03",
        "clienteB": true,
        "atendente": "diego",
        "card": "4512",
        "status": "pendente",
        "titulo": "como criar pedido",
        "menu": "pedido",
        "Descrição": "",
        "data": "10/02/2025",
        "hora": "12:55"
    }
]
let menu = [
    "produto", "faturamento", "modelo de texto", "contrato",
    "expedição", "troca", "indenização", "financeiro"];

let funcionalidade = [
    "integração bancária", "nota fiscal", "módulo de manutenção", "assinatura digital",
    "notificação", "relatório de roi", "nível de acesso", "orçamento período recorrente"];

let motivos = [
    "sistema fora do ar", "bug"
]

let sistemas = ["Actloc", "Conta Azul", "Eloca", "EstoqueNow", "Gemesis", "LocApp", "RD Station", "TI22"]

// Algumas const e let global
const divFechar = document.querySelector(".novo_fechar");
const razaoInput = document.getElementById("razao_social");
const botaoSalvar = document.querySelector("button[type='submit']");
const ticket = document.getElementById("ticket");
const sugestoesDiv = document.getElementById("sugestoes");
const tipo = document.getElementById("tipo");
const formulario = document.getElementById("formTicket");
const cancelar = document.getElementById("cancelar");
const cancelarDiv = document.getElementById("cancelar_div");
const cnpj = document.getElementById("cnpjB");
const nomeFantasia = document.getElementById("nome_fantasiaB");

let descricaoPreenchida = false;
let itemSelecionadoRazao = false;

// Carregamento da página - Início

aposSalvar();
verificarCancelar();
sugerirProximoTicket();
carregarAtendenteSugerido();



// Carregamento da página - Fim

////////////////////////////////////////////////////////////////////////////////
// EVENTOS INICIO

// Razao Social input - Início
// Exibe as opções de Razões Sociais ao clicar e digitar no input
razaoInput.addEventListener("input", () => {
    // Dentro de função há um outro evento quando clica no cliente    
    razaoSocialSugestoes(razaoInput.value);
});
// Razao Social input - Fim

// Seleção do tipo: dúvida, funcionalidade, churn ou sistema
tipo.addEventListener("change", () => {
    const valorSelecionado = tipo.value;
    selecaoTipo(valorSelecionado);
});

// Ao clicar em tipo ocultar o botão fechar ticket direcionando para o salvamento dos dados
tipo.addEventListener("click", () => {

    ocultarDivFechar();
});

/*
document.addEventListener("click", function(event) {
    const isClickInsideInput = razaoInput.contains(event.target);
    const isClickInsideSugestoes = sugestoesDiv.contains(event.target);

    if (!isClickInsideInput && !isClickInsideSugestoes) {
        sugestoesDiv.style.display = "none";

        if (!itemSelecionadoRazao) {
            document.getElementById("cnpj").value = "";
            document.getElementById("nome_fantasiaB").value = "";

            // Habilita os campos
            const cnpjInput = document.getElementById("cnpj");
            const nomeFantasiaInput = document.getElementById("nome_fantasiaB");

            

            // Opcional: remover o estilo de bloqueado, se estiver usando
            cnpjInput.style.backgroundColor = "";
            nomeFantasiaInput.style.backgroundColor = "";

            const checkbox = document.getElementById("clienteB");
            checkbox.checked = false;
            checkbox.disabled = false;
        }
    }
});
*/



// Evento de clicar em salvar acionando o submit
formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    cancelarFalse();
    verificarCancelar();

    descricaoPreenchida = false;

    const razao = document.getElementById("razao_social").value;
    const cnpj = document.getElementById("cnpjB").value;
    const cliente = document.getElementById("clienteB").checked;
    const atendente = document.getElementById("atendente").value;
    const nomeFantasia = document.getElementById("nome_fantasiaB").value;
    const chamado = document.getElementById("chamado").value;
    const ticket = document.getElementById("ticket").value;

    const tipoTicket = document.getElementById("tipo").value;

    // Campos dinâmicos (precisa checar se existem no DOM)
    const cardTicket = document.querySelector("#card")?.checked || false;
    const tituloTicket = document.querySelector("#titulo")?.value || "";
    const statusTicket = document.querySelector("#status")?.value || "";
    const menuDuvidaTicket = document.querySelector("#menu_duvida")?.value || "";
    const descricaoTicket = document.querySelector("#descricao")?.value || "";
    const churnTicket = document.querySelector("#churn_cadastrada")?.value || "";
    const funcionalidadeTicket = document.querySelector("#funcionalidade_cadastrada")?.value || "";
    const sistemasTicket = document.querySelector("#sistemas_cadastrada")?.value || "";

    const dataAtual = new Date();
    const dataFormatada = dataAtual.toISOString().split('T')[0];
    const horaFormatada = dataAtual.toLocaleTimeString("pt-BR");

    // Salvar dados essenciais no localStorage
    localStorage.setItem("razao_social", razao);
    localStorage.setItem("cnpjB", cnpj);
    localStorage.setItem("clienteB", cliente);
    localStorage.setItem("atendente", atendente);
    localStorage.setItem("nome_fantasiaB", nomeFantasia);
    localStorage.setItem("chamado", chamado);

    preencherCamposComDadosSalvos();

    // Objeto com todos os dados a serem enviados
    const dados = {
        razao_social: razao,
        cnpj: cnpj,
        cliente: cliente,
        atendente: atendente,
        tipo: tipoTicket,
        card: cardTicket,
        status: statusTicket,
        titulo: tituloTicket,
        menu_duvida: menuDuvidaTicket,
        descricao: descricaoTicket,
        churn: churnTicket,
        funcionalidade: funcionalidadeTicket,
        sistema: sistemasTicket,
        data: dataFormatada,
        hora: horaFormatada,
        ticket: ticket,
        nome_fantasia: nomeFantasia,
        chamado: chamado
    };


    // Envio para o servidor
    try {
        const response = await fetch("http://localhost:3000/salvar-ticket", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();
        if (response.ok) {
            alert("✅ Ticket salvo com sucesso! ID: " + resultado.id);
            sugerirProximoTicket();
            limparDivGerada();
        } else {
            alert("❌ Erro ao salvar o ticket: " + resultado.error);
        }
    } catch (error) {
        console.error("Erro ao enviar dados:", error);
        alert("❌ Erro ao conectar com o servidor.");
    }
});



cancelar.addEventListener("click", () => {
    cancelarTrue();
    verificarCancelar();
    fecharTicket();
    desbloquearRazaoSocial();
    limparDivGerada();
});

document.addEventListener("click", function (event) {
    const inputsSugestao = [
        document.getElementById("razao_social"),
        document.getElementById("menu_duvida"),
        document.getElementById("funcionalidade_cadastrada"),
        document.getElementById("churn_cadastrada"),
        document.getElementById("sistema_cadastrada")
    ];

    const sugestoesDivs = [
        document.getElementById("sugestoes"),
        document.getElementById("sugestoesMenu")
    ];

    const clicouDentro = [...inputsSugestao, ...sugestoesDivs].some(element =>
        element && element.contains(event.target)
    );

    if (!clicouDentro) {
        sugestoesDivs.forEach(div => {
            if (div) div.style.display = "none";
        });
    }
});
// EVENTOS FIM
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// FUNÇÕES INÍCIO ---->

function fecharTicket() {
    // Limpa os dados do localStorage

    localStorage.removeItem("razao_social");
    localStorage.removeItem("cnpjB");
    localStorage.removeItem("clienteB");
    localStorage.removeItem("atendente");
    localStorage.removeItem("nome_fantasiaB");
    localStorage.removeItem("naoOcultarFechar");
    localStorage.removeItem("chamado");

    // Oculta a div de fechamento
    document.querySelector(".novo_fechar").style.display = "none";

    // Libera campos para novo preenchimento
    desbloquearRazaoSocial();
    document.getElementById("razao_social").value = "";
    document.getElementById("cnpjB").value = "";
    document.getElementById("nome_fantasiaB").value = "";
    document.getElementById("chamado").value = "";

    const clienteCheckbox = document.getElementById("clienteB");
    clienteCheckbox.checked = false;
    clienteCheckbox.disabled = false;
    // Desativa o botão salvar
    /*desativarBotaoSalvar();*/
}

function cancelarTrue() {
    document.getElementById("cancelar").textContent = "Cancelar";
    localStorage.setItem("cancelar", "true");

}

function cancelarFalse() {
    document.getElementById("cancelar").textContent = "Fechar Ticket";
    localStorage.setItem("cancelar", "false");
}

function verificarCancelar() {
    if (localStorage.getItem("cancelar") === "true") {
        document.getElementById("cancelar").textContent = "Cancelar";
    }
    else {
        document.getElementById("cancelar").textContent = "Fechar Ticket";
    }
}


function carregarAtendenteSugerido() {
    const atendenteSugerido = localStorage.getItem("atendente_sugerido");
    if (atendenteSugerido) {
        const selectAtendente = document.getElementById("atendente");
        for (let option of selectAtendente.options) {
            if (option.value.toLowerCase() === atendenteSugerido.toLowerCase()) {
                option.selected = true;
                break;
            }
        }
    }
}

function salvarSimuladorBancoDeDados() {
    const dados = JSON.parse(localStorage.getItem("simuladorBancoDados")) || [];

    const novoRegistro = {
        ticket: parseInt(document.getElementById("ticket").value),
        razao_social: document.getElementById("razao_social").value,
        cnpj: document.getElementById("cnpjB").value,
        cliente: document.getElementById("clienteB").checked,
        atendente: document.getElementById("atendente").value,
        tipo: document.getElementById("tipo").value,
        card: document.getElementById("card") ? document.getElementById("card").checked : null,
        status: document.getElementById("status") ? document.getElementById("status").value : null,
        titulo: document.getElementById("titulo") ? document.getElementById("titulo").value : null,
        menu_duvida: document.getElementById("menu_duvida") ? document.getElementById("menu_duvida").value : null,
        descricao: document.getElementById("descricao") ? document.getElementById("descricao").value : null,
        funcionalidade: document.getElementById("funcionalidade_cadastrada") ? document.getElementById("funcionalidade_cadastrada").value : null,
        churn: document.getElementById("churn_cadastrada") ? document.getElementById("churn_cadastrada").value : null,
        sistema: document.getElementById("sistema_cadastrada") ? document.getElementById("sistema_cadastrada").value : null,
        data: new Date().toLocaleDateString("pt-BR"),
        hora: new Date().toLocaleTimeString("pt-BR")
    };

    dados.push(novoRegistro);
    localStorage.setItem("simuladorBancoDados", JSON.stringify(dados));

    console.log("Registro salvo com sucesso:", novoRegistro);
}

function preencherCamposComDadosSalvos() {
    const razao = localStorage.getItem("razao_social");
    const cnpj = localStorage.getItem("cnpjB");
    const cliente = localStorage.getItem("clienteB") === "true";
    const atendente = localStorage.getItem("atendente");
    const nomeFantasia = localStorage.getItem("nome_fantasiaB");
    const chamadoLocal = localStorage.getItem("chamado");

    if (razao) document.getElementById("razao_social").value = razao;
    if (cnpj) document.getElementById("cnpjB").value = cnpj;

    const checkbox = document.getElementById("clienteB");
    checkbox.checked = cliente;
    checkbox.disabled = cliente;

    if (atendente) document.getElementById("atendente").value = atendente;
    if (nomeFantasia) document.getElementById("nome_fantasiaB").value = nomeFantasia;
    if (chamadoLocal) document.getElementById("chamado").value = chamadoLocal;

    bloquearRazaoSocial(); // bloqueia edição da razão social após preenchimento
}
// Deixa a div novo_fechar visível, dentro dessa div tem o botão Fechar Ticket
function exibirDivFechar() {

    divFechar.style.display = "block";
}

function ocultarDivFechar() {

    divFechar.style.display = "none";
}


// Ativar botao salvar 
function ativarBotaoSalvar() {
    botaoSalvar.disabled = false;
    botaoSalvar.classList.remove("botao-desativado");
    botaoSalvar.classList.add("botao-ativo");
}

//*/ Desativar o botão salvar
/*
function desativarBotaoSalvar() {
    botaoSalvar.disabled = true;
    botaoSalvar.classList.remove("botao-ativo");
    botaoSalvar.classList.add("botao-desativado");
}
    */

// Bloqueia a razão social
function bloquearRazaoSocial() {
    razaoInput.readOnly = true;
    razaoInput.style.backgroundColor = "#e0e0e0"; // cinza claro
    razaoInput.style.cursor = "not-allowed";      // cursor de bloqueado

    cnpj.readOnly = true;
    cnpj.style.backgroundColor = "#e0e0e0"; // cinza claro
    cnpj.style.cursor = "not-allowed";

    nomeFantasia.readOnly = true;
    nomeFantasia.style.backgroundColor = "#e0e0e0"; // cinza claro
    nomeFantasia.style.cursor = "not-allowed";
}

// Desbloqueia a razão social
function desbloquearRazaoSocial() {
    razaoInput.readOnly = false;
    razaoInput.style.backgroundColor = ""; // volta ao padrão
    razaoInput.style.cursor = ""; // volta ao padrão

    cnpj.readOnly = false;
    cnpj.style.backgroundColor = ""; // volta ao padrão
    cnpj.style.cursor = ""; // volta ao padrão


    nomeFantasia.readOnly = false;
    nomeFantasia.style.backgroundColor = ""; // volta ao padrão
    nomeFantasia.style.cursor = ""; // volta ao padrão

}

// Preenchimento do tiket automático, ele verifica o último e soma mais 1 //
async function sugerirProximoTicket() {
    try {
        const response = await fetch("http://localhost:3000/ultimoticket");
        const resultado = await response.json();

        if (response.ok && resultado.proximo) {
            ticket.value = resultado.proximo;
        } else {
            ticket.value = 1001; // fallback
        }
    } catch (error) {
        console.error("Erro ao buscar próximo ticket:", error);
        ticket.value = 1001; // fallback
    }
}

/*
Essa função mantem o último ticket, essa situação vai ocorrer se estiver
no mesmo chamado da mesma razão social.
*/
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
function aposSalvar() {
    const campos = ["razao_social", "cnpjB", "clienteB", "atendente", "nome_fantasiaB", "chamado"];


    campos.forEach(campo => {
        const valor = localStorage.getItem(campo);
        if (valor !== null) {
            if (campo === "clienteB") {
                const check = document.getElementById("clienteB");
                check.checked = valor === "true";
                check.disabled = valor === "true";
            } else {
                document.getElementById(campo).value = valor;
            }
        }
    });
}

/*
 Função que verifica se a div novo_fechar está block ou none, se estiver none libera o botão salvar
 se extiver block não aciona o botão salvar   
 */
function repetirNaDescricao(e, origem, destino) {
    if (!origem || !destino || descricaoPreenchida) return;

    if (e.target && e.target.id === destino.id) {
        const cardCheckbox = document.getElementById("card");
        let textoInserido = origem.value;

        if (cardCheckbox && cardCheckbox.checked) {
            const razao = document.getElementById("razao_social").value;
            const cnpj = document.getElementById("cnpjB").value;
            const clienteMarcado = document.getElementById("clienteB").checked;
            const statusCliente = clienteMarcado ? "✅ Cliente" : "❌ Não é cliente";

            textoInserido += `\n\nRazão Social: ${razao}\nCNPJ: ${cnpj}\n${statusCliente}`;
        }

        const cursorPos = destino.selectionStart;
        const textoAntes = destino.value.substring(0, cursorPos);
        const textoDepois = destino.value.substring(destino.selectionEnd);

        destino.value = textoAntes + textoInserido + textoDepois;
        destino.selectionStart = destino.selectionEnd = cursorPos + textoInserido.length;
        destino.focus();

        // Marca como preenchido para não repetir no próximo clique
        descricaoPreenchida = true;
    }
}


/*
 Essa função junta os dois vetores que se chama funcionalidade e motivo. Isso ocorre
 porque em churn pode-se aproveitar os motivos das funcionalidades
 */
function juntaFuncionalidadeMotivo(vetorA, vetorB) {
    return [...vetorA, ...vetorB];
}

function limparDivGerada() {
    document.querySelector(".divGerada").innerHTML = ""; // limpa a div ao salvar
    tipo.value = "";

}

// Ao acionar o select tipo aciona um switchcase para executar cada função de tipo
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
            churnSelecionado();
            break;

        case "sistema":
            sistemasSelecionado();
            break;
    }

    // Só oculta a div se ela estiver visível e não foi exibida via salvamento
    if (!localStorage.getItem("naoOcultarFechar")) {
        document.querySelector(".novo_fechar").style.display = "none";
    }
}


// Essa função cria 
function criarBotaoCadastro(texto, container, aoClicar) {
    const botao = document.createElement("button");
    botao.textContent = texto;
    botao.type = "button";
    botao.classList.add("botao-cadastrar");

    // Estilo direto
    botao.style.margin = "10px";
    botao.style.display = "block";
    botao.style.marginLeft = "auto"; // força o alinhamento à direita

    botao.addEventListener("click", () => {
        if (typeof aoClicar === "function") {
            aoClicar();
        }
    });

    container.appendChild(botao);
}

function copiaDadosDescricao(campoTitulo, campoDescricao) {
    campoDescricao.addEventListener("click", () => {
        if (!descricaoPreenchida) {
            repetirNaDescricao({ target: campoDescricao }, campoTitulo, campoDescricao);
            descricaoPreenchida = true;
        }
    });

    campoDescricao.addEventListener("blur", () => {
        if (campoDescricao.value.trim() === "") {
            descricaoPreenchida = false;
        }
    });
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
        <div class="flex">
            <div class="filho">
                <div class="status">
                    <label for="status">Status *:</label>
                    <select id="status" name="status" required>
                        <option value="" disabled selected>Selecione um Status</option>
                        <option value="aberto">Aberto</option>            
                        <option value="fechado">Fechado</option>
                    </select>
                </div>
            </div>
            <div class="filho">
                <label for="menu_duvida">Menu/Dúvida *:</label>
                <div class="sugestoes-container">
                    <input type="text" id="menu_duvida" name="menu_duvida" autocomplete="off" required>
                    <div id="sugestoesMenu"></div>
                </div>
            </div>
        </div>       
        <label for="titulo">Título:</label>
        <input type="text" id="titulo" autocomplete="off" required>        

        <label for="descricao">Descrição:</label>
        <textarea id="descricao" name="descricao" autocomplete="off"></textarea>
    `;

    divGerada.appendChild(novaDiv);

    criarSugestaoAoClicar("menu_duvida", "sugestoesMenu", menu, (itemSelecionado) => { });

    const campoDescricao = document.getElementById("descricao");
    const campoTitulo = document.getElementById("titulo");
    copiaDadosDescricao(campoTitulo, campoDescricao);
}






function funcionalidadeSelecionada() {
    const divGerada = document.querySelector(".divGerada");

    const novaDiv = document.createElement("div");
    novaDiv.classList.add("funcionalidade");
    novaDiv.style.display = "block"; // exibe a div gerada

    novaDiv.innerHTML = `
        <div class="check">
            <label for="card">Abrir Card?</label>
            <input type="checkbox" id="card">
        </div> 
        <div class="flex">
    <div class="filho">
        <div class="status">
            <label for="status">Status *:</label>
            <select id="status" name="status" required>
                <option value="" disabled selected>Selecione um Status</option>
                <option value="aberto">Aberto</option>            
                <option value="fechado">Fechado</option>
            </select>
        </div> 
    </div>
    <div class="filho">
        <label for="funcionalidade_cadastrada">Funcionalidade *:</label>
            <div class="sugestoes-container">
                 <input type="text" id="funcionalidade_cadastrada" name="funcionalidade_cadastrada" autocomplete="off" required>
            <div id="sugestoesMenu"></div>
           </div>
    </div>
</div>
        <label for="descricao">Descrição:</label>
        <textarea id="descricao" name="descricao" autocomplete="off"></textarea>
    `;

    divGerada.appendChild(novaDiv);
    criarSugestaoAoClicar("funcionalidade_cadastrada", "sugestoesMenu", funcionalidade, (itemSelecionado) => {
    });

    const campoDescricao = document.getElementById("descricao");
    const campoTitulo = document.getElementById("funcionalidade_cadastrada");
    copiaDadosDescricao(campoTitulo, campoDescricao);
}

function churnSelecionado() {
    const divGerada = document.querySelector(".divGerada");
    const novaDiv = document.createElement("div");
    novaDiv.classList.add("churn");
    novaDiv.style.display = "block"; // exibe a div gerada

    novaDiv.innerHTML = `
     <label for="churn_cadastrada">Churn *:</label>
    <div class="sugestoes-container">
        <input type="text" id="churn_cadastrada" name="churn_cadastrada" autocomplete="off" required>
        <div id="sugestoesMenu"></div>
    </div>
    <label for="descricao">Descrição:</label>
    <textarea id="descricao" name="descricao" autocomplete="off" ></textarea> `;
    divGerada.appendChild(novaDiv);

    let motivo = juntaFuncionalidadeMotivo(funcionalidade, motivos);
    criarSugestaoAoClicar("churn_cadastrada", "sugestoesMenu", motivo, (itemSelecionado) => {
    });

    const campoDescricao = document.getElementById("descricao");
    const churnCadastrada = document.getElementById("churn_cadastrada");
    copiaDadosDescricao(churnCadastrada, campoDescricao);

}

function sistemasSelecionado() {
    const divGerada = document.querySelector(".divGerada");
    const novaDiv = document.createElement("div");
    novaDiv.classList.add("sistemas");
    novaDiv.style.display = "block"; // exibe a div gerada

    novaDiv.innerHTML = `
     <label for="sistemas_cadastrada">Sistemas *:</label>
    <div class="sugestoes-container">
        <input type="text" id="sistemas_cadastrada" name="sistemas_cadastrada" autocomplete="off" required>
        <div id="sugestoesMenu"></div>
    </div>`;
    divGerada.appendChild(novaDiv);

    let motivo = juntaFuncionalidadeMotivo(funcionalidade, motivos);
    criarSugestaoAoClicar("sistemas_cadastrada", "sugestoesMenu", sistemas, (itemSelecionado) => {
    });
}

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
                    document.getElementById('cnpjB').value = empresa.cnpj;

                    fetch(`/dados-razao-social?nome=${encodeURIComponent(empresa.razao_social)}`)
                        .then(res => res.json())
                        .then(dados => {
                            

                            const nomeFantasiaInput = document.getElementById('nome_fantasiaB');
                            const clienteCheckbox = document.getElementById('clienteB');
                            const cnpjInput = document.getElementById('cnpjB');

                            nomeFantasiaInput.value = dados?.nome_fantasia || '';
                            nomeFantasiaInput.disabled = true;
                            nomeFantasiaInput.style.backgroundColor = "#e0e0e0";

                            clienteCheckbox.checked = dados?.cliente === 1 || dados?.cliente === '1'; // ⚠️ compare como string OU número
                            clienteCheckbox.disabled = dados?.cliente === 1 || dados?.cliente === '1';

                            cnpjInput.disabled = true;
                            cnpjInput.style.backgroundColor = "#e0e0e0";

                            ativarBotaoSalvar();
                        })
                        .catch(err => {
                            console.error("Erro ao buscar dados adicionais:", err);
                        });

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


// ⚠️ Adicione esse trecho no final do script ou logo após configurar o input
razaoInput.addEventListener('blur', () => {
    setTimeout(() => {
        if (!itemSelecionadoRazao) {
            razaoInput.value = '';
            document.getElementById('cnpj').value = '';
            document.getElementById('nome_fantasia').value = '';
            const checkbox = document.getElementById('cliente');
            checkbox.checked = false;
            checkbox.disabled = false;
            sugestoesDiv.style.display = 'none';
        }
    }, 150); // delay para permitir clique na sugestão
});




function criarSugestaoAoClicar(inputId, divId, lista, aoSelecionar) {
    const input = document.getElementById(inputId);
    const sugestoesDiv = document.getElementById(divId);

    if (!input || !sugestoesDiv) return;

    let itemSelecionado = false; // flag pra saber se clicou em uma sugestão

    function mostrarSugestoes() {
        sugestoesDiv.innerHTML = "";
        itemSelecionado = false;

        const termo = input.value.trim().toLowerCase();

        if (termo.length < 1) {
            sugestoesDiv.style.display = "none";
            return;
        }

        const resultados = lista.filter(item => item.toLowerCase().includes(termo));

        if (resultados.length > 0) {
            resultados.forEach(item => {
                const div = document.createElement("div");
                div.textContent = item.charAt(0).toUpperCase() + item.slice(1);

                div.addEventListener("click", () => {
                    input.value = item.charAt(0).toUpperCase() + item.slice(1);
                    sugestoesDiv.style.display = "none";
                    itemSelecionado = true;

                    if (typeof aoSelecionar === "function") {
                        aoSelecionar(item);
                    }
                });

                sugestoesDiv.appendChild(div);
            });

            sugestoesDiv.style.display = "block";
        } else {
            // Nenhuma sugestão encontrada — botão de cadastro
            switch (inputId) {
                case "funcionalidade_cadastrada":
                    criarBotaoCadastro("Cadastrar ", sugestoesDiv, () => {

                    });
                    break;

                case "churn_cadastrada":
                    criarBotaoCadastro("Cadastrar Funcionalidade", sugestoesDiv, () => {

                    });
                    criarBotaoCadastro("Cadastrar Motivo", sugestoesDiv, () => {

                    });
                    break;

                case "sistema_cadastrada":
                    criarBotaoCadastro("Cadastrar Sistema", sugestoesDiv, () => {

                    });
                    break;

                case "menu_duvida":
                    criarBotaoCadastro("Cadastrar Menu/Dúvida", sugestoesDiv, () => {

                    });
                    break;

                default:
                    sugestoesDiv.style.display = "none";
            }

            sugestoesDiv.style.display = "block";
        }
    }

    input.addEventListener("click", mostrarSugestoes);
    input.addEventListener("input", mostrarSugestoes);

    // Se clicar fora e não tiver selecionado nenhuma sugestão, limpa o input
    input.addEventListener("blur", () => {
        setTimeout(() => { // pequeno delay pra permitir clicar na sugestão
            if (!itemSelecionado) {
                input.value = "";
            }
            sugestoesDiv.style.display = "none";
        }, 200);
    });
}



// FUNÇÕES FIM
////////////////////////////////////////////////////////////////////////////////


