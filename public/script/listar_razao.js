let paginaAtual = 1;
const limite = 50;
atualizarContadorClientes(); 

document.getElementById('botaoOrdenar').addEventListener('click', () => {
  carregarTabelaRazoesSociais(true); // reseta e recarrega
});

document.addEventListener('DOMContentLoaded', () => {
  carregarTabelaRazoesSociais(true); // ✅ chama com reset = true
  atualizarContadorClientes();       // ✅ chama contador também
});


async function carregarTabelaRazoesSociais(reset = false) {
  const containerCarregar = document.getElementById('container-carregar');
  const botaoCarregarMais = document.getElementById('botaoCarregarMais');
  const divRelatorio = document.getElementById('clientes_relatorio');
  const filtroSelecionado = document.getElementById('filtroCliente').value; // ✅ primeiro o filtro

  const ordenarPor = document.getElementById('ordenarPor')?.value || 'razao_social';
  const direcao = document.getElementById('direcao')?.value || 'ASC';

  if (reset) {
    paginaAtual = 1;
    divRelatorio.innerHTML = '';
    containerCarregar.style.display = 'none';
  }

  try {
    const dados = await buscarRazoesSociais(paginaAtual, limite, filtroSelecionado, ordenarPor, direcao);

    if (dados.length === limite) {
      botaoCarregarMais.style.display = 'block'; // 🔥 Se trouxe 20 registros, permite carregar mais
    } else {
      botaoCarregarMais.style.display = 'none';  // 🔥 Se trouxe menos que 20, acabou
    }

    let tabela = document.querySelector('.tabela-relatorio');

    if (!tabela) {
      tabela = document.createElement('table');
      tabela.className = 'tabela-relatorio';
      tabela.style.borderCollapse = 'collapse';
      tabela.style.width = '100%';
      tabela.style.fontSize = '14px';
      tabela.style.marginTop = '20px';

      tabela.innerHTML = `
      
       <thead style="background-color: #2C34C9; color: white;">
          <tr>
            <th style="padding: 10px;">Razão Social</th>
            <th style="padding: 10px;">Nome Fantasia</th>
            <th style="padding: 10px;">CNPJ</th>
            <th style="padding: 10px;">Cliente</th>
            <th style="padding: 10px;">Data Cliente</th>
            <th style="padding: 10px;">Vence em:</th>
            <th style="padding: 10px;">Dias Sem Acesso</th>
            <th style="padding: 10px;">Faturamento</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;

      divRelatorio.appendChild(tabela);
    }

    const tbody = tabela.querySelector('tbody');

    dados.forEach(item => {
      const linha = document.createElement('tr');
      linha.className = 'linha-click';
      linha.setAttribute('data-razao', encodeURIComponent(item.razao_social));
      linha.style.borderBottom = '1px solid #eee';
      linha.style.cursor = 'pointer';

      const hoje = new Date().toISOString().split("T")[0]; // '2025-04-29'
      const vencimento = item.data_vencimento;
if (item.cliente == 1 && vencimento < hoje) {
        linha.innerHTML = `
        <td style=" background:rgb(252, 219, 219); padding: 10px; max-width: 300px !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap;">${item.razao_social}</td>
        <td style="background:rgb(252, 219, 219); padding: 10px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">${item.nome_fantasia || '-'}</td>
        <td style="background:rgb(252, 219, 219); text-align: center; padding: 10px;">${formatarCNPJ(item.cnpj)}</td>
        <td style="background:rgb(252, 219, 219); text-align: center; padding: 10px;">${item.cliente == 1 ? '✅' : '❌'}</td>
        <td style="background:rgb(252, 219, 219); text-align: center; padding: 10px;">${formatarDataBR(item.data_cliente) || '-'}</td>
        <td style="background:rgb(252, 219, 219); text-align: center; padding: 10px;">${formatarDataBR(item.data_vencimento) || '-'}</td>
        <td style="background:rgb(252, 219, 219); text-align: center; padding: 10px;">${item.sem_acesso || '-'}</td>
        <td style="background:rgb(252, 219, 219); text-align: center; padding: 10px;">${item.faturamento || '-'}</td>
      `;

      }
      else{
        linha.innerHTML = `
        <td style="padding: 10px; max-width: 300px !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap;">${item.razao_social}</td>
        <td style="padding: 10px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">${item.nome_fantasia || '-'}</td>
        <td style="text-align: center; padding: 10px;">${formatarCNPJ(item.cnpj)}</td>
        <td style="text-align: center; padding: 10px;">${item.cliente == 1 ? '✅' : '❌'}</td>
        <td style="text-align: center; padding: 10px;">${formatarDataBR(item.data_cliente) || '-'}</td>
        <td style="text-align: center; padding: 10px;">${formatarDataBR(item.data_vencimento) || '-'}</td>
        <td style="text-align: center; padding: 10px;">${item.sem_acesso || '-'}</td>
          <td style="text-align: center; padding: 10px;">${item.faturamento || '-'}</td>
      `;

      }

   
    

      linha.addEventListener('click', () => {
        const razao = decodeURIComponent(linha.getAttribute('data-razao'));
        abrirModalEditarRazao(razao);
      });

      tbody.appendChild(linha);
    });

    if (dados.length < limite || dados.length === 0) {
      botaoCarregarMais.style.display = 'none';
    } else {
      botaoCarregarMais.style.display = 'block';
    }
    
  } catch (error) {
    console.error('Erro ao carregar tabela:', error);
    botaoCarregarMais.style.display = 'none';
  }
}


async function buscarRazoesSociais(pagina = 1, limite = 20, filtro = 'todos', ordenarPor = 'razao_social', direcao = 'ASC') {
  try {
    const resposta = await fetch(`/listar-razao-social?pagina=${pagina}&limite=${limite}&filtro=${filtro}&ordenarPor=${ordenarPor}&direcao=${direcao}`);
    if (!resposta.ok) throw new Error('Erro ao buscar razões sociais.');
    return await resposta.json();
  } catch (error) {
    console.error('Erro:', error);
    return [];
  }
}



function formatarCNPJ(cnpj) {
  if (!cnpj) return '';
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}



document.getElementById('cadastrar_razao').addEventListener('click', abrirModalCadastrarRazaoSocial);

const botaoCarregarMais = document.getElementById('botaoCarregarMais');
if (botaoCarregarMais) {
  botaoCarregarMais.addEventListener('click', () => {
    paginaAtual++;
    carregarTabelaRazoesSociais();
  });
}

  
  // Abrir o Modal de Cadastro
  function abrirModalCadastrarRazaoSocial() {
    document.getElementById('modal').style.display = 'flex';
  
    document.getElementById('conteudoModal').innerHTML = `
      <!-- conteúdo do formulário de cadastro que você já montou -->
    `;
  
    configurarSugestoesRazaoSocial(); // configurar sugestões
    configurarSalvarRazaoSocial(); // configurar botão salvar
  }
  
  // Configurar Sugestões da Razão Social
  function configurarSugestoesRazaoSocial() {
    const input = document.getElementById('razao_social');
    if (!input) return;
  
    input.addEventListener('input', async function() {
      const termo = input.value.trim();
      if (termo.length > 0) {
        const sugestoes = await buscarSugestoesRazaoSocial(termo);
        criarListaSugestoes(input, sugestoes);
      } else {
        const container = document.getElementById('sugestoesContainer');
        if (container) container.style.display = 'none';
      }
    });
  }
  
  // Configurar evento de Salvar no Modal
  function configurarSalvarRazaoSocial() {
    const form = document.getElementById('formSalvar');
    if (!form) return;
  
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      // aqui monta o objeto e faz o fetch para '/cadastrar-razao-social'
    });
  }
  

  
  // Quando clicar no botão "Cadastrar"
  const botaoCadastrar = document.getElementById('cadastrar_razao');
  if (botaoCadastrar) {
    botaoCadastrar.addEventListener('click', abrirModalCadastrarRazaoSocial);
  }

  // funçao abrir modal
  async function abrirModalEditarRazao(razao_social) {
    try {
        const resposta = await fetch(`/dados-completos-razao-social?nome=${encodeURIComponent(razao_social)}`);

      const dados = await resposta.json();
  
      document.getElementById('modal').style.display = 'flex';
  
      document.getElementById('conteudoModal').innerHTML = `
        <div class="modal-mod">
          <div class="modal-header">Editar Razão Social</div>
          <form id="formEditar" class="modal-body">
            <div class="flexModal">
            <div class="campo">
  <input type="hidden" id="id_razao_social" value="${dados.id}"> <!-- 🔵 Apenas ID escondido -->
  
  <label>Razão Social *:</label>
  <input class="inputGrande" type="text" id="razao_social" value="${dados.razao_social || ''}" required maxlength="100">
</div>
            
              <div class="campo">
                <label>CNPJ *:</label>
                <input type="text" id="cnpj" class="inputMedio" value="${formatarCNPJ(dados.cnpj) || ''}" required>
              </div>
            </div>
            <div class="flexModal">
            
              <div class="campo">
                <label>Nome Fantasia:</label>
                <input type="text" id="nome_fantasia" class="inputMedio" value="${dados.nome_fantasia || ''}">
              </div>
              <div class="campo">
                <label for="cliente">Cliente:</label>
                <input type="checkbox" id="clienteB" class="checkboxRazao" ${dados.cliente == 1 ? 'checked' : ''}>
              </div>
              <div class="campo">
                <label>É cliente desde:</label>
                <input type="date" id="data_cliente" value="${dados.data_cliente || ''}">
              </div>
            </div>
            <div class="flexModal">
              <div class="campo">
                <label>Nome:</label>
                <input type="text" id="nomeA" value="${dados.nome_a || ''}">
              </div>
              <div class="campo">
                <label>Número de Contato:</label>
                <input type="text" id="numeroA" value="${dados.contato_a || ''}">
              </div>
              <div class="campo">
                <label>Link Chatwoot:</label>
                <input type="text" id="linkA" value="${dados.link_a || ''}">
              </div>
              <div class="campoB">
            <button class="chatA" id="chatA">Contato Chat</button>
          </div>
            </div>
            <div class="flexModal">
              <div class="campo">
                <label>Nome:</label>
                <input type="text" id="nomeB" value="${dados.nome_b || ''}">
              </div>
              <div class="campo">
                <label>Número de Contato:</label>
                <input type="text" id="numeroB" value="${dados.contato_b || ''}">
              </div>
              <div class="campo">
                <label>Link Chatwoot:</label>
                <input type="text" id="linkB" value="${dados.link_b || ''}">
              </div>
              <div class="campoB">
            <button class="chatA" id="chatB">Contato Chat</button>
          </div>
            </div>

          <div id="div_cliente">
            <div>
                 <h2>Informações de Cobrança do cliente</h2>
            <div class="flexModal" >           
            
              <div class="campo">
                <label>Dia de vencimento:</label>
                <input type="number" id="dia" min="1" max="31" step="1" style="width: 45px; font-size: 25px; margin-left: 20px;">


              </div>
              <div class="campo">
                <label>Vence em:</label>
                <input type="date" id="vencimento" >
              </div>
              <div class="campo">
                <label>Quantidade de licença:</label>
                <input type="number" id="qt_licenca" min="1" max="31" step="1" style="width: 45px; font-size: 25px; margin-left: 20px;">
              </div>
            </div>
            </div>
          </div>


            <div class="campo" style="flex: 1 1 100%;">
              <label>Observação:</label>
              <textarea id="observacao" class="observacaoRazao">${dados.observacao || ''}</textarea>
            </div>
            <div class="modal-footer">
              <div class="flexJ">
                <button type="button" class="modal-btn" id="fecharModal">Cancelar</button>
                <button class="modal-btn" id="salvarEdicao">Salvar</button>
              </div>
            </div>
          </form>
        </div>
      `;

      // Mostrar ou ocultar a div de cobrança com base no valor de cliente
const divCliente = document.getElementById('div_cliente');
const checkboxCliente = document.getElementById('clienteB');
document.getElementById('dia').value = dados.dia_vencimento || '';
document.getElementById('vencimento').value = dados.data_vencimento || '';
document.getElementById('qt_licenca').value = dados.qt_licenca || '';


checkboxCliente.addEventListener('change', () => {
  divCliente.style.display = checkboxCliente.checked ? 'flex' : 'none';
});


if (checkboxCliente.checked) {
  divCliente.style.display = 'flex';
} else {
  divCliente.style.display = 'none';
}


 
        // inicio - Habilita ou desabilita o botao do chat
      const chatA = document.getElementById('chatA');
      const chatB = document.getElementById('chatB');
      if (dados.link_a && dados.link_a.trim() !== '') {
        habilitarBotoesChat(chatA);
        chatA.addEventListener('click', (e) => {
          e.preventDefault();
          window.open(dados.link_a, '_blank');
        });
      } else {
        desabilitarBotoesChat(chatA);
      }
      
      // 🟡 Configura botão Chat B
      if (dados.link_b && dados.link_b.trim() !== '') {
        habilitarBotoesChat(chatB);
        chatB.addEventListener('click', (e) => {
          e.preventDefault();
          window.open(dados.link_b, '_blank');
        });
      } else {
        desabilitarBotoesChat(chatB);
      }
  // fim - Habilita ou desabilita o botao do chat
      document.getElementById('fecharModal').addEventListener('click', () => {
        document.getElementById('modal').style.display = 'none';
       
      });
  
      document.getElementById('salvarEdicao').addEventListener('click', async (event) => {
        event.preventDefault();
        atualizarContadorClientes(); 
        const dadosAtualizados = {
          id: document.getElementById('id_razao_social').value, // 🔵 novo
            razao_social: document.getElementById('razao_social').value.trim(),
            nome_fantasia: document.getElementById('nome_fantasia').value.trim(),
            cnpj: document.getElementById('cnpj').value.replace(/\D/g, ''),
            cliente: document.getElementById('clienteB').checked ? 1 : 0,
            data_cliente: document.getElementById('data_cliente').value,
            nome_a: document.getElementById('nomeA').value.trim(),
            contato_a: document.getElementById('numeroA').value.trim(),
            link_a: document.getElementById('linkA').value.trim(),
            nome_b: document.getElementById('nomeB').value.trim(),
            contato_b: document.getElementById('numeroB').value.trim(),
            link_b: document.getElementById('linkB').value.trim(),
            observacao: document.getElementById('observacao').value.trim(),
            dia_vencimento: document.getElementById('dia').value,
            data_vencimento: document.getElementById('vencimento').value,
            qt_licenca: document.getElementById('qt_licenca').value
          };
          
          try {
            const resposta = await fetch('/atualizar-razao-social', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dadosAtualizados)
              
            });
          
            const resultado = await resposta.json();
          
            if (resposta.ok) {
              alert('✅ Dados atualizados com sucesso!');
              document.getElementById('modal').style.display = 'none';
              window.location.reload();
            } else {
              alert('❌ Erro: ' + resultado.erro);
            }
          } catch (erro) {
            console.error('Erro ao salvar edição:', erro);
            alert('❌ Erro na comunicação com o servidor.');
          }
          
      });
  
    } catch (error) {
      console.error("Erro ao buscar dados para edição:", error);
      alert('Erro ao abrir edição.');
    }
  }

  function desabilitarBotoesChat(botao) {
    if (botao) botao.classList.add('desativarBotao');
  }

  function habilitarBotoesChat(botao) {
    if (botao) botao.classList.remove('desativarBotao');
  }
  const inputBusca = document.querySelector('.buscar input'); // já existe no seu código
  const filtroCliente = document.getElementById('filtroCliente');
 
  
  filtroCliente.addEventListener('change', () => {
    inputBusca.value = ''; // 🔵 limpa o campo de busca
    carregarTabelaRazoesSociais(true); // 🔵 reseta a tabela
  });
  

  // contador clientes
  
  async function atualizarContadorClientes() {
    try {
      const resposta = await fetch('/contar-clientes');
      if (!resposta.ok) throw new Error('Erro ao buscar quantidade de clientes.');
      const dados = await resposta.json();
  
      const contador = document.getElementById('contador');
      contador.textContent = dados.total.toString().padStart(2, '0'); // força 2 dígitos ex: 01, 02, 10
    } catch (erro) {
      console.error('Erro ao atualizar contador:', erro);
      document.getElementById('contador').textContent = '00';
    }
  }
  

  // listagem para buscar

  document.addEventListener('DOMContentLoaded', () => {
    const inputBusca = document.querySelector('.buscar input');
    const botaoLupa = document.getElementById('lupa');
  
    let paginaBusca = 1; // 🆕 Controle de página da busca
const limiteBusca = 50; // 🆕 Limite de 50 por vez

async function buscarRazaoSocialOuCNPJ(reset = false) {
  document.getElementById('botaoCarregarMais').style.display = 'none';
  const termo = inputBusca.value.trim();
  const containerCarregar = document.getElementById('container-carregar');
  const divRelatorio = document.getElementById('clientes_relatorio');

  if (reset) {
    paginaBusca = 1;
    divRelatorio.innerHTML = '';
    containerCarregar.style.display = 'none';
  }

  try {
    const ordenarPor = document.getElementById('ordenarPor').value;
  const direcao = document.getElementById('direcao').value;
    let url;
if (termo === "") {
  url = `/listar-razao-social?pagina=${paginaBusca}&limite=${limiteBusca}&ordenarPor=${ordenarPor}&direcao=${direcao}`;
} else {
  let termoBusca = /^\d+$/.test(termo) ? termo.replace(/\D/g, '') : termo;
  url = `/buscar-razao-social?termo=${termoBusca}&pagina=${paginaAtual}&limite=50&ordenarPor=${ordenarPor}&direcao=${direcao}`;
}

    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error('Erro ao buscar dados.');

    const dados = await resposta.json();

    if (paginaBusca === 1 && dados.length === 0) {
      divRelatorio.innerHTML = '<p style="margin-top:20px; color:#777;">Nenhum resultado encontrado.</p>';
      return;
    }

    let tabela = document.querySelector('.tabela-relatorio');

    if (!tabela) {
      tabela = document.createElement('table');
      tabela.className = 'tabela-relatorio';
      tabela.style.borderCollapse = 'collapse';
      tabela.style.width = '100%';
      tabela.style.fontSize = '14px';
      tabela.style.marginTop = '20px';

      tabela.innerHTML = `
        <thead style="background-color: #2C34C9; color: white;">
          <tr>
            <th style="padding: 10px;">Razão Social</th>
            <th style="padding: 10px;">Nome Fantasia</th>
            <th style="padding: 10px;">CNPJ</th>
            <th style="padding: 10px;">Cliente</th>
            <th style="padding: 10px;">Data Cliente</th>
            <th style="padding: 10px;">Vence em:</th>
            <th style="padding: 10px;">Dias Sem Acesso:</th>
            <th style="padding: 10px;">Faturamento:</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;

      divRelatorio.appendChild(tabela);
    }

    const tbody = tabela.querySelector('tbody');
    console.log(dados)

    dados.forEach(item => {
      const linha = document.createElement('tr');
      linha.className = 'linha-click';
      linha.setAttribute('data-razao', encodeURIComponent(item.razao_social));
      linha.style.borderBottom = '1px solid #eee';
      linha.style.cursor = 'pointer';

      const hoje = new Date().toISOString().split("T")[0]; // '2025-04-29'
      const vencimento = item.data_vencimento;
      console.log(`hoje ${hoje}`)
      console.log(`vencimento ${vencimento}`)

     if (item.cliente == 1 && vencimento < hoje) {
        linha.innerHTML = `
        <td style=" background:rgb(252, 219, 219); padding: 10px; max-width: 300px !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap;">${item.razao_social}</td>
        <td style="background:rgb(252, 219, 219); padding: 10px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">${item.nome_fantasia || '-'}</td>
        <td style="background:rgb(252, 219, 219); text-align: center; padding: 10px;">${formatarCNPJ(item.cnpj)}</td>
        <td style="background:rgb(252, 219, 219); text-align: center; padding: 10px;">${item.cliente == 1 ? '✅' : '❌'}</td>
        <td style="background:rgb(252, 219, 219); text-align: center; padding: 10px;">${item.data_cliente || '-'}</td>
        <td style="background:rgb(252, 219, 219); text-align: center; padding: 10px;">${item.data_vencimento || '-'}</td>
        <td style="background:rgb(252, 219, 219); text-align: center; padding: 10px;">${item.sem_acesso || '-'}</td>
        <td style="background:rgb(252, 219, 219); text-align: center; padding: 10px;">${item.faturamento || '-'}</td>
      `;

      }
      else{
        linha.innerHTML = `
        <td style="padding: 10px; max-width: 300px !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap;">${item.razao_social}</td>
        <td style="padding: 10px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">${item.nome_fantasia || '-'}</td>
        <td style="text-align: center; padding: 10px;">${formatarCNPJ(item.cnpj)}</td>
        <td style="text-align: center; padding: 10px;">${item.cliente == 1 ? '✅' : '❌'}</td>
        <td style="text-align: center; padding: 10px;">${item.data_cliente || '-'}</td>
        <td style="text-align: center; padding: 10px;">${item.data_vencimento || '-'}</td>
        <td style="text-align: center; padding: 10px;">${item.sem_acesso || '-'}</td>
          <td style="text-align: center; padding: 10px;">${item.faturamento || '-'}</td>
      `;

      }

      linha.addEventListener('click', () => {
        const razao = decodeURIComponent(linha.getAttribute('data-razao'));
        abrirModalEditarRazao(razao);
      });

      tbody.appendChild(linha);
    });

    if (dados.length < limiteBusca) {
      containerCarregar.style.display = 'none';
    } else {
      containerCarregar.style.display = 'block';
    }

  } catch (erro) {
    console.error('Erro na busca:', erro);
    alert('Erro ao buscar.');
  }
}

// 🆕 Quando clicar no botão "Carregar mais" na busca:
document.getElementById('botaoCarregarMais').addEventListener('click', () => {
  paginaBusca++;
  buscarRazaoSocialOuCNPJ();
});

    
    
  
    // Clicar na lupa
    botaoLupa.addEventListener('click', buscarRazaoSocialOuCNPJ);
  
    // Apertar Enter dentro do input
    inputBusca.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        buscarRazaoSocialOuCNPJ(true); // 🔥 força limpar resultados
      }
    });
    
  
    function formatarCNPJ(cnpj) {
      if (!cnpj) return '';
      return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    }
  });

  function formatarDataBR(dataISO) {
  if (!dataISO) return '-';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

  
  
 
    
 
  
  