document.getElementById('formUpload').addEventListener('submit', function(event) {
    event.preventDefault(); // Impede o envio automático do formulário
    // Início - Verifica se o arquivo tem o nome Locsis que é originalmente puxado do grafana
    const inputArquivo = document.getElementById('arquivo');
    const nomeCompleto = inputArquivo.value;
    const nomeArquivo = nomeCompleto.split('\\').pop(); // Pega só o nome do arquivo  
    const confere = nomeArquivo.includes("Locsis");
    // Fim - Verifica se o arquivo tem o nome Locsis que é originalmente puxado do grafana  
    //onsole.log("Nome do arquivo:", nomeArquivo);
    //console.log("Contém 'Locsis'?", confere);
    if(confere){
        console.log('Possui o nome Locsis')
    }else{
        console.log('não possui o nome locsis')
    }
  });
  