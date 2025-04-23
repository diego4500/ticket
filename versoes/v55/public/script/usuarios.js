function carregarUsuarios() {
    const container = document.getElementById("clientes_relatorio");
    const mensagem = document.getElementById("mensagem-relatorio");

    fetch('/usuarios-cadastrados')
        .then(res => res.json())
        .then(dados => {
            mensagem.style.display = "none";
            const tabelaAntiga = container.querySelector("table");
            if (tabelaAntiga) tabelaAntiga.remove();

            if (!dados || dados.length === 0) {
                container.innerHTML = "<p style='margin-top: 20px;'>Nenhum usuário encontrado.</p>";
                return;
            }

            const tabela = document.createElement("table");
            tabela.classList.add("tabela-relatorio");

            const cabecalho = tabela.insertRow();
            const colunas = ["nome", "email", "aprovado"];


            colunas.forEach(col => {
                const th = document.createElement("th");
                th.textContent = col === "email"
                    ? "Email"
                    : col.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                cabecalho.appendChild(th);
            });

            const thExcluir = document.createElement("th");
            thExcluir.textContent = "Excluir";
            cabecalho.appendChild(thExcluir);

            dados.forEach(usuario => {
                const linha = tabela.insertRow();
            
               
            
                // Email
                const celulaEmail = linha.insertCell();
                const emailFormatado = usuario.email && typeof usuario.email === "string"
                    ? usuario.email.trim().toLowerCase()
                    : "-";
                celulaEmail.textContent = emailFormatado;

                 // Nome
                 const celulaNome = linha.insertCell();
                 const nomeFormatado = usuario.nome && typeof usuario.nome === "string"
                     ? usuario.nome.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                     : "-";
                 celulaNome.textContent = nomeFormatado;
            
                // Select Aprovado
                const celulaAprovado = linha.insertCell();
                const select = document.createElement("select");
                select.innerHTML = `
                    <option value="1" ${usuario.aprovado === "Sim" ? "selected" : ""}>Sim</option>
                    <option value="0" ${usuario.aprovado === "Não" ? "selected" : ""}>Não</option>
                `;
                select.addEventListener("change", () => {
                    atualizarAprovado(usuario.email, select.value);
                });
                celulaAprovado.appendChild(select);
            
                // Link Excluir
                const celulaExcluir = linha.insertCell();
                const linkExcluir = document.createElement("a");
                linkExcluir.href = "#";
                linkExcluir.textContent = "Excluir";
                linkExcluir.style.color = "#2C34C9";
                linkExcluir.style.textDecoration = "none";
                linkExcluir.addEventListener("click", (e) => {
                    e.preventDefault();
                    excluirUsuario(usuario.email);
                });
                celulaExcluir.appendChild(linkExcluir);
            });
            
            


            container.appendChild(tabela);
        })
        .catch(err => {
            console.error("Erro ao carregar usuários:", err);
            container.innerHTML = "<p style='margin-top: 20px;'>Erro ao carregar usuários.</p>";
        });
}


carregarUsuarios();

function atualizarAprovado(email, novoValor) {
    fetch("/usuarios/atualizar-aprovado", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, aprovado: parseInt(novoValor) })
    })
        .then(res => res.json())
        .then(resposta => {
            if (!resposta.sucesso) {
                alert("Erro ao atualizar status.");
                console.error(resposta.mensagem);
            }
        })
        .catch(err => {
            alert("Erro ao comunicar com o servidor.");
            console.error(err);
        });
}

function excluirUsuario(email) {
    if (confirm(`Tem certeza que deseja excluir o usuário ${email}?`)) {
        fetch('/usuarios/excluir', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })
            .then(res => res.json())
            .then(dados => {
                if (dados.sucesso) {
                    alert("Usuário excluído com sucesso!");
                    carregarUsuarios();
                } else {
                    alert(dados.mensagem || "Erro ao excluir usuário.");
                }
            })
            .catch(err => {
                console.error("Erro:", err);
                alert("Erro na requisição.");
            });
    }
}


