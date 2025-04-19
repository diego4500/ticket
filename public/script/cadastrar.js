document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    
  
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const confirmar = document.getElementById('confirm_password').value;
    const nome = document.getElementById('nome').value;

    
  
    if (senha !== confirmar) {
      alert('As senhas não coincidem!');
      return;
    }
  
    const resposta = await fetch('/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha, nome })
    });
  
    const dados = await resposta.json();
  
    if (dados.sucesso) {
      alert('Cadastro realizado com sucesso! Aguardar aprovação do administrador');
      window.location.href = '/login.html'; // ou a rota que desejar
    } else {
      alert(dados.mensagem || 'Erro ao cadastrar usuário.');
    }
  });
  