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

// Sugestões quando clico no input tenant

const tenantInput = document.getElementById('tenant');
const sugestoesB = document.getElementById('sugestoesB');
let sugestoes = [];

tenantInput.addEventListener('input', () => {
  const termo = tenantInput.value.toLowerCase();
  fetch('/sugestoes-razao-social')
    .then(res => res.json())
    .then(data => {
      sugestoes = data.filter(nome => nome.toLowerCase().includes(termo));
      mostrarSugestoesB(sugestoes);
    });
});

function mostrarSugestoesB(lista) {
    sugestoesB.innerHTML = '';
    sugestoesB.style.display = 'block';
  
    lista.forEach(sugestao => {
      const div = document.createElement('div');
      div.textContent = sugestao;
      div.onclick = () => {
        tenantInput.value = sugestao;
        sugestoesB.innerHTML = '';
        sugestoesB.style.display = 'none';
  
        // Busca nome_fantasia e cliente
        fetch(`/dados-razao-social?nome=${encodeURIComponent(sugestao)}`)
          .then(res => res.json())
          .then(dados => {
            document.getElementById('nome_fantasia').value = dados.nome_fantasia || '';
            document.getElementById('cliente').checked = dados.cliente == 1;
          })
          .catch(err => {
            console.error("Erro ao buscar dados da razão social:", err);
          });
      };
      sugestoesB.appendChild(div);
    });
  }
  

// Esconde ao clicar fora
document.addEventListener('click', (e) => {
  if (!tenantInput.contains(e.target) && !sugestoesB.contains(e.target)) {
    sugestoesB.style.display = 'none';
  }
});

// Salva os dados na tabela razao_social o cliente e o nome_fantasia

document.getElementById('formAlterar').addEventListener('submit', function (e) {
    e.preventDefault();
  
    const razao_social = document.getElementById('tenant').value;
    const nome_fantasia = document.getElementById('nome_fantasia').value;
    const cliente = document.getElementById('cliente').checked ? 1 : 0;
  
    fetch('/alterar-cliente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ razao_social, nome_fantasia, cliente })
    })
      .then(res => res.json())
      .then(resposta => {
        if (resposta.sucesso) {
          alert("✅ Cliente atualizado com sucesso!");
  
          // Limpar os campos
          document.getElementById('tenant').value = '';
          document.getElementById('nome_fantasia').value = '';
          document.getElementById('cliente').checked = false;
  
        } else {
          alert("❌ Erro ao atualizar: " + resposta.mensagem);
        }
      })
      .catch(error => {
        console.error("Erro ao enviar dados:", error);
        alert("❌ Ocorreu um erro ao tentar atualizar o cliente.");
      });
  });
  



