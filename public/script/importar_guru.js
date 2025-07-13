document.getElementById('guru').addEventListener('click', abrirModal);

function abrirModal() {
  document.getElementById('modal').style.display = 'flex';

  document.getElementById('conteudoModal').innerHTML = `
    <div class="modal-mod">
      <div class="modal-header">Importar Dados Guru</div>
      <form id="formNovo" class="modal-body">
        <div style="padding-left:20px;">
          <div class="campo">
          <div class="flexJ">
            <scan style="color: #2C34C9;">
            <a href="">Acesse o Guru</a> </scan>
            <label>Insira o Arquivo:</label>
            </div>
            <input type="file" id="arquivoImportar" accept=".xlsx,.xls,.csv" required>
          </div>
        </div>
        <div class="modal-footer">
          <div class="flexJ">
            <button type="button" class="modal-btn" id="fecharNovoModal">Cancelar</button>
            <button type="submit" class="modal-btn" id="importar_grafana">Importar</button>
          </div>
        </div>
      </form>
    </div>
  `;

  // Fechar modal
  document.getElementById('fecharNovoModal').addEventListener('click', () => {
    document.getElementById('modal').style.display = 'none';
  });

  // Submeter formulário
  document.getElementById('formNovo').addEventListener('submit', async (event) => {
    event.preventDefault();

    const arquivo = document.getElementById('arquivoImportar').files[0];
    if (!arquivo) {
      alert('Selecione um arquivo!');
      return;
    }

    const formData = new FormData();
    formData.append('arquivo', arquivo);

    try {
      const resposta = await fetch('/importar_guru', {
        method: 'POST',
        body: formData
      });

      const resultado = await resposta.json();

      if (resposta.ok) {
        alert('✅ Importação realizada com sucesso!');
        document.getElementById('modal').style.display = 'none';
      } else {
        alert('❌ Erro: ' + resultado.erro);
      }
    } catch (erro) {
      console.error('Erro ao importar:', erro);
      alert('❌ Erro ao enviar o arquivo.');
    }
  });
}
