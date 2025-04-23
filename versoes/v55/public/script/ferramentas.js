
document.getElementById('formUpload').addEventListener('submit', function (event) {
  event.preventDefault(); // Impede o envio automático do formulário

  // Verifica se o nome do arquivo tem Locsis
  const inputArquivo = document.getElementById('arquivo');
  const nomeCompleto = inputArquivo.value;
  const nomeArquivo = nomeCompleto.split('\\').pop(); // Pega só o nome do arquivo  
  const confere = nomeArquivo.includes("Locsis");

  
  if (confere) {
      console.log('✅ Possui o nome Locsis');
      // Caso tenha Locsis segue o fluxo

      const form = document.getElementById('formUpload');
      const formData = new FormData(form);

      // Verifica se tem duas ou mais colunas preenchida
      fetch('/verificar-excel', {
          method: 'POST',
          body: formData
      })
          .then(response => response.json())
          .then(resultado => {
              if (resultado.sucesso) {
                  console.log("✅ Tem duas colunas preenchidas");

                  // Até aqui deu tudo certo e os dados que estão na planilha vão ser salvos no banco de dados caso não tenha repetido
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
                  console.log("❌ Tem coluna alem da A preenchida, só aceita a A");
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
let razaoInput = tenantInput;
let sugestoesDiv = sugestoesB;
let itemSelecionadoRazao = false;

tenantInput.addEventListener('input', () => {
  razaoSocialSugestoes(tenantInput.value);
  
});

document.getElementById('dataCliente').addEventListener('focus', () => {
  const campo = document.getElementById('dataCliente');
  if (!campo.value) {
    trazerDataAtual();
  }
});


// Esconde sugestões se não clicar em nenhuma
tenantInput.addEventListener('blur', () => {
  setTimeout(() => {
    if (!itemSelecionadoRazao) {
      tenantInput.value = '';
      document.getElementById('nome_fantasia').value = '';
      document.getElementById('cliente').checked = false;
      sugestoesDiv.style.display = 'none';
    }
  }, 150);
});

// Sugestões de razão social com preenchimento automático
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

          fetch(`/dados-razao-social?nome=${encodeURIComponent(empresa.razao_social)}`)
            .then(res => res.json())
            .then(dados => {
              document.getElementById('nome_fantasia').value = dados.nome_fantasia || '';
              document.getElementById('cliente').checked = dados.cliente == 1;
            })
            .catch(err => console.error("Erro ao buscar dados:", err));

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

// Salvar atualização do cliente com informações de nome fantasia e se é cliente ou não do checkbox
document.getElementById('formAlterar').addEventListener('submit', function (e) {
  e.preventDefault();

  const razao_social = document.getElementById('tenant').value;
  const nome_fantasia = document.getElementById('nome_fantasia').value;
  const cliente = document.getElementById('cliente').checked ? 1 : 0;
  const data_cliente = document.getElementById('dataCliente').value;

  fetch('/alterar-cliente', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ razao_social, nome_fantasia, cliente, data_cliente })

  })
    .then(res => res.json())
    .then(resposta => {
      if (resposta.sucesso) {
        alert("✅ Cliente atualizado com sucesso!");
        document.getElementById('tenant').value = '';
        document.getElementById('nome_fantasia').value = '';
        document.getElementById('cliente').checked = false;
        location.reload();
      } else {
        alert("❌ Erro ao atualizar: " + resposta.mensagem);
      }
    })
    .catch(error => {
      console.error("Erro ao enviar dados:", error);
      alert("❌ Ocorreu um erro ao tentar atualizar o cliente.");
    });
});

function trazerDataAtual(){
  const hoje = new Date();
const yyyy = hoje.getFullYear();
const mm = String(hoje.getMonth() + 1).padStart(2, '0'); // meses de 0 a 11
const dd = String(hoje.getDate()).padStart(2, '0');

document.getElementById("dataCliente").value = `${yyyy}-${mm}-${dd}`;

}


