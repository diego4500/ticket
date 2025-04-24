
const tenantInput = document.getElementById('tenant');
const sugestoesB = document.getElementById('sugestoesB');
let razaoInput = tenantInput;
let sugestoesDiv = sugestoesB;
let itemSelecionadoRazao = false;

tenantInput.addEventListener('input', () => {
    razaoSocialSugestoes(tenantInput.value);
  });



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