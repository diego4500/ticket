document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
 
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  const resposta = await fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, senha })
  });

  const dados = await resposta.json();

  if (dados.sucesso) {
    
    if (dados.sucesso) {
      window.location.href = "/dashboard"; // ou dashboard, ou outra página
    }
  } else {
    alert(dados.mensagem || "Erro no login.");
  }
});

document.getElementById("esqueceu").addEventListener("click", (e) => {
  e.preventDefault();
  alert("Peça um usuário para excluir sua conta. Em seguida faça um novo cadastro e peça a aprovação. Sendo aprovado terá o acesso novamente.");
});
