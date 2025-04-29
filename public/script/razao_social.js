// Função para buscar sugestões no servidor
async function buscarSugestoesRazaoSocial(termo) {
  try {
    const resposta = await fetch(`/sugestoes-razao-social?q=${encodeURIComponent(termo)}`);
    const sugestoes = await resposta.json();
    return sugestoes;
  } catch (error) {
    console.error('Erro ao buscar sugestões:', error);
    return [];
  }
}

// Função para criar e exibir a lista de sugestões
function criarListaSugestoes(input, sugestoes) {
  let container = document.getElementById('sugestoesContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'sugestoesContainer';
    container.className = 'sugestoesContainer';
    input.parentNode.appendChild(container);
    input.parentNode.style.position = "relative";
  }

  container.innerHTML = '';

  sugestoes.forEach(sugestao => {
    const item = document.createElement('div');
    item.className = 'sugestao-item';
    item.textContent = sugestao.razao_social;
    item.addEventListener('click', () => {
      input.value = sugestao.razao_social;
      container.style.display = 'none'; // Esconde ao clicar
    });
    container.appendChild(item);
  });

  if (sugestoes.length > 0) {
    container.style.display = 'block'; // Mostra se tiver sugestão
  } else {
    container.style.display = 'none'; // Esconde se não tiver sugestão
  }
}


function formatarCNPJInput(cnpj) {
  // Remove tudo que não for número
  cnpj = cnpj.replace(/\D/g, '');

  // Limita no máximo 14 números
  cnpj = cnpj.slice(0, 14);

  // Aplica a máscara conforme digita
  cnpj = cnpj.replace(/^(\d{2})(\d)/, "$1.$2");
  cnpj = cnpj.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
  cnpj = cnpj.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4");
  cnpj = cnpj.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");

  return cnpj;
}


// Função principal para configurar as sugestões
function configurarSugestoesRazaoSocial() {
  const inputRazaoSocial = document.getElementById('razao_social');
  if (!inputRazaoSocial) return;

  inputRazaoSocial.addEventListener('input', async function() {
    const valor = inputRazaoSocial.value.trim();
    const container = document.getElementById('sugestoesContainer');

    if (valor.length > 0) {
      const sugestoes = await buscarSugestoesRazaoSocial(valor);
      criarListaSugestoes(inputRazaoSocial, sugestoes);
    } else {
      if (container) container.style.display = 'none';
    }
  });

  // Evento para fechar a lista ao clicar fora
  document.addEventListener('click', function(event) {
    const container = document.getElementById('sugestoesContainer');
    if (!container || !inputRazaoSocial) return;

    if (event.target !== inputRazaoSocial && !container.contains(event.target)) {
      container.style.display = 'none';
    }
  });
}

// 🔵 Quando abrir o modal, chama a função
document.getElementById('cadastrar_razao').addEventListener('click', function () {
  // Abre o modal
  document.getElementById('modal').style.display = 'flex';

  // Define o conteúdo do modal
  document.getElementById('conteudoModal').innerHTML = `
    <div class="modal-mod">
      <div class="modal-header">
        Cadastrar Razão Social
      </div>
      <form id="formSalvar" class="modal-body">
        <div class="flexModal">
          <div class="campo">
            <label>Razão Social *:</label>
            <input class="inputGrande" type="text" id="razao_social" required maxlength="100">

          </div>
          <div class="campo">
            <label>CNPJ *:</label>
            <input type="text" id="cnpj" class="inputMedio" required>
          </div>
          <div class="campo">
            <label>Nome Fantasia:</label>
            <input type="text" id="nome_fantasia" class="inputMedio">
          </div>
          <div class="campo">
            <label for="cliente">Cliente:</label>
            <input type="checkbox" id="clienteB" class="checkboxRazao">
          </div>
          <div class="campo">
            <label>É cliente desde:</label>
            <input type="date" id="data_cliente">
          </div>
        </div>

        <div class="flexModal">
          <div class="campo">
            <label>Nome:</label>
            <input type="text" id="nomeA">
          </div>
          <div class="campo">
            <label>Número de Contato:</label>
            <input type="text" id="numeroA">
          </div>
          <div class="campo">
            <label>Link Chatwoot:</label>
            <input type="text" id="linkA">
          </div>
          
        </div>

        <div class="flexModal">
          <div class="campo">
            <label>Nome:</label>
            <input type="text" id="nomeB">
          </div>
          <div class="campo">
            <label>Número de Contato:</label>
            <input type="text" id="numeroB">
          </div>
          <div class="campo">
            <label>Link Chatwoot:</label>
            <input type="text" id="linkB">
          </div>
          
        </div>

        <div class="campo" style="flex: 1 1 100%;">
          <label>Observação:</label>
          <textarea id="observacao" class="observacaoRazao"></textarea>
        </div>

        <div class="modal-footer">
          <div class="flexJ">
            <button type="button" class="modal-btn" id="cancelar">Cancelar</button>
            <button class="modal-btn" id="salvar">Salvar</button>
          </div>
        </div>
      </form>
    </div>
  `;

 

  formSalvar.addEventListener('submit', async function(event) {
    event.preventDefault();
  
    // Coletar os dados do formulário
    const razao_social = document.getElementById('razao_social').value.trim();
    const nome_fantasia = document.getElementById('nome_fantasia').value.trim();
    let cnpj = document.getElementById('cnpj').value.trim();
    const cliente = document.getElementById('clienteB').checked ? 1 : 0;
    const data_cliente = document.getElementById('data_cliente').value || null;
    const nome_a = document.getElementById('nomeA').value.trim();
    const contato_a = document.getElementById('numeroA').value.trim();
    const link_a = document.getElementById('linkA').value.trim();
    const nome_b = document.getElementById('nomeB').value.trim();
    const contato_b = document.getElementById('numeroB').value.trim();
    const link_b = document.getElementById('linkB').value.trim();
    const observacao = document.getElementById('observacao').value.trim();
    const data_churn = null; // 🔵 Podemos deixar null por enquanto, se quiser podemos depois tratar
  
    // Remove a máscara do CNPJ
    cnpj = cnpj.replace(/\D/g, '');
  
    // Montar o objeto para enviar
    const dados = {
      razao_social,
      nome_fantasia,
      cnpj,
      cliente,
      data_cliente,
      nome_a,
      contato_a,
      link_a,
      nome_b,
      contato_b,
      link_b,
      data_churn,
      observacao
    };
  
    try {
      const resposta = await fetch('/cadastrar-razao-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });
  
      const resultado = await resposta.json();
  
      if (resposta.ok) {
        alert('Cadastro realizado com sucesso!');
        document.getElementById('modal').style.display = 'none';
        window.location.reload(); // 🔵 Recarrega a página após o cadastro
      } else {
        alert('Erro ao cadastrar: ' + resultado.erro);
      }
    } catch (error) {
      console.error('Erro ao enviar cadastro:', error);
      alert('Erro ao enviar cadastro.');
    }
  });
  

  document.getElementById('cancelar').addEventListener('click', function () {
    document.getElementById('modal').style.display = 'none';
  

  });

  if (window.flatpickr) {
    flatpickr("#data_churn", { dateFormat: "d/m/Y" });
  }

  // 👉 Configura sugestões ao abrir o modal
  configurarSugestoesRazaoSocial();

  const inputCNPJ = document.getElementById('cnpj');

  if (inputCNPJ) {
    inputCNPJ.addEventListener('input', function() {
      this.value = formatarCNPJInput(this.value);
    });
  }
  
});




// listar razao social

