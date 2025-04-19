

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
    let menu = ["produto", "faturamento", "modelo de texto", "contrato", "expedição", "troca", "indenização", "financeiro"];

   

    // ativar botao ////

    function ativarBotaoSalvar() {
        const botaoSalvar = document.querySelector("button[type='submit']");
        botaoSalvar.disabled = false;
        botaoSalvar.classList.remove("botao-desativado");
        botaoSalvar.classList.add("botao-ativo");
    }

    // Preenchimento do tiket automatico //

    function sugerirProximoTicket() {
        const campoTicket = document.getElementById("ticket");
        const dados = JSON.parse(localStorage.getItem("simulacaoBancoDeDados")) || [];
    
        if (dados.length === 0) {
            campoTicket.value = 1001;
        } else {
            const ultimoTicket = Math.max(...dados.map(ticket => ticket.ticket));
            campoTicket.value = ultimoTicket + 1;
        }
    }

    function manterOTicket() {
        const campoTicket = document.getElementById("ticket");
        const dados = JSON.parse(localStorage.getItem("simulacaoBancoDeDados")) || [];
    
        if (dados.length === 0) {
            campoTicket.value = 1001;
        } else {
            const ultimoTicket = Math.max(...dados.map(ticket => ticket.ticket));
            campoTicket.value = ultimoTicket;
        }
    }

 

    // Razão Social - Início //////////////////////////////////////////////////////
    const razaoInput = document.getElementById("razao_social");
    const sugestoesDiv = document.createElement("div");
    sugestoesDiv.id = "sugestoes";
    razaoInput.parentNode.appendChild(sugestoesDiv);
    const botaoSalvar = document.querySelector("button[type='submit']");

    // Evento para desativar o botão sempre que o usuário modificar manualmente o campo
    razaoInput.addEventListener("input", function () {
        botaoSalvar.disabled = true;
        botaoSalvar.classList.remove("botao-ativo");
        botaoSalvar.classList.add("botao-desativado");

        const termo = razaoInput.value.toLowerCase();
        sugestoesDiv.innerHTML = "";
        if (termo.length === 0) {
            sugestoesDiv.style.display = "none";
            return;
        }

        const resultados = empresas.filter(empresa => empresa.nome.toLowerCase().includes(termo));

        if (resultados.length > 0) {
            resultados.forEach(empresa => {
                const div = document.createElement("div");
                div.textContent = empresa.nome;

                ////////////////// EVENTO DE CLIQUE DA SUGESTÃO DA RAZÃO SOCIAL ///////////////////////////////

                div.addEventListener("click", function () {
                    razaoInput.value = empresa.nome;
                    document.getElementById("cnpj").value = empresa.cnpj; // Preenche o CNPJ

                    const clienteCheckbox = document.getElementById("cliente");
                    if (empresa.cliente) {
                        clienteCheckbox.checked = true;
                        clienteCheckbox.disabled = true; // Bloqueia o checkbox se for cliente
                    } else {
                        clienteCheckbox.checked = false;
                        clienteCheckbox.disabled = false; // Libera o checkbox se não for cliente
                    }

                    // ATIVA O BOTÃO SOMENTE SE UMA SUGESTÃO FOI SELECIONADA
                    botaoSalvar.disabled = false;
                    botaoSalvar.classList.remove("botao-desativado");
                    botaoSalvar.classList.add("botao-ativo");

                    sugestoesDiv.style.display = "none";
                });
                sugestoesDiv.appendChild(div);
            });
            sugestoesDiv.style.display = "block";
        } else {
            sugestoesDiv.style.display = "none";
        }
    });

    // Oculta as sugestões ao clicar fora
    document.addEventListener("click", function (event) {
        if (!razaoInput.contains(event.target) && !sugestoesDiv.contains(event.target)) {
            sugestoesDiv.style.display = "none";
        }
    });
    // Razão Social - Fim //////////////////////////////////////////////////////

    // Menu / DÚVIDA - Início //////////////////////////////////////////////////////
    const menuDuvidaInput = document.getElementById("menu_duvida");
    const sugestoesMenuDiv = document.getElementById("sugestoesMenu");

    menuDuvidaInput.addEventListener("input", function () {
        const termo = menuDuvidaInput.value.toLowerCase();
        sugestoesMenuDiv.innerHTML = "";

        if (termo.length === 0) {
            sugestoesMenuDiv.style.display = "none";
            return;
        }

        const resultados = menu.filter(item => item.toLowerCase().includes(termo));

        if (resultados.length > 0) {
            resultados.forEach(item => {
                const div = document.createElement("div");
                div.textContent = item.charAt(0).toUpperCase() + item.slice(1); // Transforma a primeira letra em maiúscula
                div.style.padding = "8px";
                div.style.cursor = "pointer";
                div.style.textAlign = "left";

                div.addEventListener("click", function () {
                    menuDuvidaInput.value = item.charAt(0).toUpperCase() + item.slice(1);
                    sugestoesMenuDiv.style.display = "none";
                });

                sugestoesMenuDiv.appendChild(div);
            });

            sugestoesMenuDiv.style.display = "block";
        } else {
            sugestoesMenuDiv.style.display = "none";
        }
    });

    document.addEventListener("click", function (event) {
        if (!menuDuvidaInput.contains(event.target) && !sugestoesMenuDiv.contains(event.target)) {
            sugestoesMenuDiv.style.display = "none";
        }
    });

    // Menu / DÚVIDA - Fim //////////////////////////////////////////////////////


    // Ao clicar em dúvida libera a div dúvida para display block /////////////////
    document.getElementById("tipo").addEventListener("change", function () {
        let duvidaDiv = document.querySelector(".duvida");
        let funcionalidadeDiv = document.querySelector(".funcionalidade");
        let churnDiv = document.querySelector(".churn");
        let sistemaDiv = document.querySelector(".sistema");

        // Esconde todas as seções antes de mostrar a correta
        duvidaDiv.style.display = "none";
        funcionalidadeDiv.style.display = "none";
        churnDiv.style.display = "none";
        sistemaDiv.style.display = "none";

        // Esconde a div novo_fechar ao selecionar um tipo
        document.querySelector(".novo_fechar").style.display = "none";

        // Remove o atributo required dos campos escondidos
        document.querySelectorAll(".duvida input, .duvida select, .duvida textarea, \
                                  .churn input, .churn select, .churn textarea, \
                                  .sistema input, .sistema select, .sistema textarea").forEach(el => {
            el.removeAttribute("required");
        });

        // Exibe a div correspondente e adiciona required apenas aos campos visíveis
        if (this.value === "duvida") {
            duvidaDiv.style.display = "block";
            duvidaDiv.querySelectorAll("input, select, textarea").forEach(el => {
                // Evita colocar 'required' no checkbox "Abrir Card?"
                if (el.id !== "card") {
                    el.setAttribute("required", "true");
                }
            });
        } else if (this.value === "funcionalidade") {
            funcionalidadeDiv.style.display = "block"; // Sem required
        } else if (this.value === "churn") {
            churnDiv.style.display = "block";
            churnDiv.querySelectorAll("input, select, textarea").forEach(el => {
                el.setAttribute("required", "true");
            });
        } else if (this.value === "sistema") {
            sistemaDiv.style.display = "block";
            sistemaDiv.querySelectorAll("input, select, textarea").forEach(el => {
                el.setAttribute("required", "true");
            });
        }
    });

    document.addEventListener("DOMContentLoaded", function () {
        if (localStorage.getItem("ticket_recomendacao") === null) {
            localStorage.setItem("ticket_recomendacao", "0");
        }

        const ticketRecomendado = localStorage.getItem("ticket_recomendacao");

        if (ticketRecomendado && parseInt(ticketRecomendado) > 0) {
            manterOTicket();
        } else {
            sugerirProximoTicket();
        }
        ativarBotaoSalvar()
    
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
        
    });
    /// Evento Salvar Ticket //////////////////////
    const form = document.getElementById("formTicket");

 

    // Captura o evento de submissão do formulário
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        localStorage.setItem("ticket_recomendacao", "1");
        const ticket = parseInt(document.getElementById("ticket").value);
        const nome = document.getElementById("razao_social").value;
        const cnpj = document.getElementById("cnpj").value;
        const cliente = document.getElementById("cliente").checked;
        const atendente = document.getElementById("atendente").value;
    
        localStorage.setItem("razao_social", nome);
        localStorage.setItem("cnpj", cnpj);
        localStorage.setItem("cliente", cliente);
        localStorage.setItem("atendente", atendente);
    
        const novoTicket = {
            ticket,
            nome,
            cnpj,
            cliente,
            atendente,
            card: document.getElementById("card")?.checked ? gerarCard() : "",
            status: document.getElementById("status")?.value || "",
            titulo: document.getElementById("titulo")?.value || "",
            menu: document.getElementById("menu_duvida")?.value || "",
            Descrição: document.getElementById("descricao")?.value || "",
            data: new Date().toLocaleDateString("pt-BR"),
            hora: new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })
        };
    
        const historico = JSON.parse(localStorage.getItem("simulacaoBancoDeDados")) || [];
        historico.push(novoTicket);
        localStorage.setItem("simulacaoBancoDeDados", JSON.stringify(historico));
    
        alert("Ticket salvo com sucesso!");
    
        document.querySelector(".duvida").style.display = "none";
    document.querySelector(".funcionalidade").style.display = "none";
    document.querySelector(".sistema").style.display = "none";
    document.querySelector(".churn").style.display = "none";

    document.getElementById("tipo").value = "";

        
        document.querySelector(".novo_fechar").style.display = "block";

    });

    //// Fechar Tiket ////////////////////

    document.getElementById("fechar").addEventListener("click", function () {
        localStorage.setItem("ticket_recomendacao", "0");
        // Remove os dados armazenados no localStorage
        localStorage.removeItem("ticket");
        localStorage.removeItem("razao_social");
        localStorage.removeItem("cnpj");
        localStorage.removeItem("cliente");
        localStorage.removeItem("atendente");

        // Reseta todos os campos do formulário manualmente
        document.getElementById("formTicket").reset();

        // Recarrega a página para limpar tudo
        location.reload();
    });

    // Botão ler //

    document.getElementById("ler").addEventListener("click", function () {
        let textoDiv = document.getElementById("textoLer");
        let duvidaDiv = document.getElementById("duvidaLer");
    
        duvidaDiv.style.display = "none"; // Oculta a div da dúvida
        textoDiv.style.display = "block"; // Exibe a div texto
    });
    
    document.getElementById("ler_duvida").addEventListener("click", function () {
        let textoDiv = document.getElementById("textoLer");
        let duvidaDiv = document.getElementById("duvidaLer");
    
        textoDiv.style.display = "none"; // Oculta a div texto
        duvidaDiv.style.display = "block"; // Exibe a div da dúvida
    });
    
    document.getElementById("fecharTexto").addEventListener("click", function () {
        document.getElementById("textoLer").style.display = "none"; // Oculta a div texto
    });
    
    document.getElementById("fecharDuvida").addEventListener("click", function () {
        document.getElementById("duvidaLer").style.display = "none"; // Oculta a div da dúvida
    });

    // Quando clicar no input descrição desejo que puxa o texto do título

    document.getElementById("descricao").addEventListener("click", function () {
        
        const titulo = document.getElementById("titulo").value;
        document.getElementById("descricao").value = titulo;
    });

