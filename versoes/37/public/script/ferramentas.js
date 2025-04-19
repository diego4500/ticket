// Upload Excel (sem alterações)
document.getElementById('formUpload').addEventListener('submit', function (event) {
  event.preventDefault();
  const inputArquivo = document.getElementById('arquivo');
  const nomeCompleto = inputArquivo.value;
  const nomeArquivo = nomeCompleto.split('\\').pop();
  const confere = nomeArquivo.includes("Locsis");

  if (confere) {
    const form = document.getElementById('formUpload');
    const formData = new FormData(form);

    fetch('/verificar-excel', {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(resultado => {
        if (resultado.sucesso) {
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
          alert("O arquivo não tem a estrutura correta para importação.");
        }
      })
      .catch(error => {
        console.error("Erro na verificação do Excel:", error);
      });
    inputArquivo.value = "";
  } else {
    alert('❌ Esse não é o arquivo com os usuários. Escolha o arquivo correto');
    inputArquivo.value = "";
  }
});

// Tenant com sugestões usando função centralizada
const tenantInput = document.getElementById('tenant');
const sugestoesB = document.getElementById('sugestoesB');
let razaoInput = tenantInput;
let sugestoesDiv = sugestoesB;
let itemSelecionadoRazao = false;

tenantInput.addEventListener('input', () => {
  razaoSocialSugestoes(tenantInput.value);
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

// Salvar atualização do cliente
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
