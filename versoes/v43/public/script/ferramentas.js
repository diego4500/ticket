// Upload Excel (sem alterações)
// Upload Excel
document.getElementById("formUpload").addEventListener("submit", async (e) => {
  e.preventDefault();

  const inputArquivo = document.getElementById("arquivo");
  const arquivo = inputArquivo.files[0];
  const tenantInput = document.getElementById("tenant");
  const nomeFantasiaInput = document.getElementById("nome_fantasia");
  const clienteCheckbox = document.getElementById("cliente");
  const sugestoesDiv = document.getElementById("sugestoesB");

  const formData = new FormData();
  formData.append("arquivo", arquivo); // 👈 nome precisa ser "arquivo"

  try {
    const resposta = await fetch("/importar-razao-social", {
      method: "POST",
      body: formData
    });

    if (!resposta.ok) throw new Error("Erro na requisição");

    const dados = await resposta.json();

    if (dados.sucesso) {
      if (dados.total > 0) {
        alert(`✅ Importação concluída!\n${dados.total} registros foram inseridos.`);
      } else {
        alert("✅ Seu cadastro está completo. Nenhum dado novo foi atualizado.");
      }

      // ✅ Limpa os campos após sucesso
      inputArquivo.value = "";
      tenantInput.value = "";
      nomeFantasiaInput.value = "";
      clienteCheckbox.checked = false;
      sugestoesDiv.style.display = "none";
    } else {
      alert("❌ Importação falhou: " + dados.erro);
    }
  } catch (erro) {
    console.error("Erro na verificação do Excel:", erro);
    alert("❌ Erro ao importar o arquivo.");
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
