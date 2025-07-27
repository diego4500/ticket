require('dotenv').config({ path: 'dados.env' });

const mysql = require('mysql2/promise');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Função para gerar embedding com modelo suportado
async function gerarEmbedding(texto) {
  const response = await openai.createEmbedding({
    model: 'text-embedding-ada-002',
    input: texto
  });
  return response.data.data[0].embedding;
}

(async () => {
  const conexao = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE

  });

  const [videos] = await conexao.execute(`SELECT id, descricao FROM video_suporte`);

  for (const video of videos) {
    try {
      const embedding = await gerarEmbedding(video.descricao || '');
      await conexao.execute(
        `UPDATE video_suporte SET descricao_vetorizada = ? WHERE id = ?`,
        [JSON.stringify(embedding), video.id]
      );
      console.log(`✅ Embedding atualizado para vídeo ID ${video.id}`);
    } catch (err) {
      console.error(`❌ Erro ao processar ID ${video.id}:`, err.message);
    }
  }

  await conexao.end();
})();
