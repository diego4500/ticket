document.getElementById('formUpload').addEventListener('submit', function (event) {
    event.preventDefault(); // Impede o envio automático do formulário

    const inputArquivo = document.getElementById('arquivo');
    const nomeCompleto = inputArquivo.value;
    const nomeArquivo = nomeCompleto.split('\\').pop(); // Pega só o nome do arquivo  
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

                    // Reenvia o mesmo arquivo para o back-end para importar no banco
                    fetch('/importar-razao-social', {
                        method: 'POST',
                        body: formData
                    })
                        .then(res => res.json())
                        .then(resposta => {
                            if (resposta.sucesso) {
                                if (resposta.total === 0) {
                                    alert("Nenhuma nova razão social foi inserida, seu cadastro está completo.");
                                } else {
                                    alert(`Foram inseridas ${resposta.total} novas razões sociais:\n\n- ${resposta.inseridos.join("\n- ")}`);
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
                    console.log("❌ Não há duas colunas preenchidas");
                    alert("O arquivo não tem a estrutura correta para importação.");
                }
            })
            .catch(error => {
                console.error("Erro na verificação do Excel:", error);
            });
            inputArquivo.value ="";

    } else {
        console.log("Não possui o nome Locsis")
        alert('❌ Esse não é o arquivo com os usuários. Escolha o arquivo correto');
        inputArquivo.value ="";
    }
});

