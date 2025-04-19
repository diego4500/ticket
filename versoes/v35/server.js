require('dotenv').config({ path: 'dados.env' });

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');



const fs = require("fs");
const multer = require("multer");
const xlsx = require("xlsx");
const csv = require("csv-parser");


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Conexão com o banco de dados
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

db.connect(err => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err);
    return;
  }
  console.log('Conectado ao MySQL');
});

// Rota para inserir dados no banco
app.post('/salvar-ticket', (req, res) => {
  const {
    razao_social,
    cnpj,
    data,
    hora,
    status,
    ticket,
    card,
    titulo,
    menu_duvida,
    descricao,
    cliente,
    tipo,
    atendente,
    churn,
    funcionalidade,
    sistema,
    nome_fantasia,
    chamado
  } = req.body;

  const sql = `
        INSERT INTO tickets (
            razao_social, cnpj, data, hora, status, ticket, card, titulo,
            menu_duvida, descricao, cliente, tipo, atendente,
            churn, funcionalidade, sistema, nome_fantasia, chamado
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

  const valores = [
    razao_social, cnpj, data, hora, status, ticket, card, titulo,
    menu_duvida, descricao, cliente, tipo, atendente,
    churn, funcionalidade, sistema, nome_fantasia, chamado
  ];

  db.query(sql, valores, (err, result) => {
    if (err) {
      console.error('Erro ao inserir ticket:', err);
      return res.status(500).json({ error: 'Erro ao salvar o ticket' });
    }
    res.status(201).json({ message: 'Ticket salvo com sucesso!', id: result.insertId });
  });
});


// Próximo ticket
app.get("/ultimoticket", (req, res) => {
  db.query("SELECT MAX(ticket) AS ultimo FROM tickets", (err, rows) => {
    if (err) {
      console.error("Erro ao buscar último ticket:", err);
      return res.status(500).json({ error: "Erro ao buscar último ticket" });
    }

    const ultimo = rows[0]?.ultimo || 1000;
    res.json({ proximo: ultimo + 1 });
  });
});


// Servir arquivos estáticos (scripts, CSS, imagens)
app.use(express.static(path.join(__dirname, 'src')));

// rota página usuários
app.get("/usuarios", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "usuarios.html"));
});

// rota página relatorio
app.get("/relatorio", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "relatorio.html"));
});

// ROTA PARA O DASHBOARD
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// rota cadastro ticket
app.get("/ticket", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "ticket.html"));
});

// Rota que exibe todos os dados do banco de dados

app.get('/tickets', (req, res) => {
  const sql = `
    SELECT 
        ticket, 
        atendente, 
        razao_social, 
        tipo, 
        CONCAT_WS('',
            COALESCE(titulo, ''),
            COALESCE(churn, ''),
            COALESCE(funcionalidade, ''),
            COALESCE(sistema, '')
        ) AS titulo,
        status,
        DATE_FORMAT(data, '%d/%m/%Y') AS data
    FROM tickets
    ORDER BY data DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar tickets' });
    res.status(200).json(results);
  });
});


// Rota que exibe somente os abertos do banco de dados

app.get('/tickets/abertos', (req, res) => {
  const sql = `
    SELECT 
        ticket, 
        atendente, 
        razao_social, 
        tipo, 
        CONCAT_WS('',
            COALESCE(titulo, ''),
            COALESCE(churn, ''),
            COALESCE(funcionalidade, ''),
            COALESCE(sistema, '')
        ) AS titulo,
        status,
         DATE_FORMAT(data, '%d/%m/%Y') AS data
    FROM tickets
    WHERE status = 'Aberto'
    ORDER BY data DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar tickets abertos' });
    res.status(200).json(results);
  });
});


// Rota que exibe somente os abertos do banco de dados

app.get('/tickets/fechados', (req, res) => {
  const sql = `
    SELECT 
        ticket, 
        atendente, 
        razao_social, 
        tipo, 
        CONCAT_WS('',
            COALESCE(titulo, ''),
            COALESCE(churn, ''),
            COALESCE(funcionalidade, ''),
            COALESCE(sistema, '')
        ) AS titulo,
        status,
         DATE_FORMAT(data, '%d/%m/%Y') AS data
    FROM tickets
    WHERE status = 'Fechado'
    ORDER BY data DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar tickets fechados' });
    res.status(200).json(results);
  });
});


const ExcelJS = require('exceljs');

app.get('/exportar-excel', async (req, res) => {
  try {
    const query = `SELECT * FROM tickets ORDER BY id DESC`; // ✅ ORDENADO AQUI

    db.query(query, async (err, results, fields) => {
      if (err) {
        console.error("Erro ao buscar dados:", err);
        return res.status(500).send("Erro ao gerar relatório.");
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Relatório");

      const colunas = fields.map(field => ({
        header: field.name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        key: field.name,
        width: field.name === 'data' ? 12 : 20
      }));

      sheet.columns = colunas;
      sheet.addRows(results);

      sheet.columns.forEach(column => {
        if (column.key !== 'data') {
          let maxLength = column.header.length;
          column.eachCell({ includeEmpty: true }, cell => {
            const cellLength = cell.value ? cell.value.toString().length : 0;
            if (cellLength > maxLength) maxLength = cellLength;
          });
          column.width = maxLength + 2;
        }
      });

      sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
      sheet.autoFilter = {
        from: 'A1',
        to: `${String.fromCharCode(64 + colunas.length)}1`
      };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorioTodos.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    });
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).send("Erro ao exportar Excel.");
  }
});

// excel funcionalidade

app.get('/exportar-excel-funcionalidade', async (req, res) => {
  try {
    const query = `SELECT * FROM tickets WHERE tipo = 'funcionalidade' ORDER BY id DESC`;

    db.query(query, async (err, results, fields) => {
      if (err) {
        console.error("Erro ao buscar dados:", err);
        return res.status(500).send("Erro ao gerar relatório de funcionalidades.");
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Funcionalidades");

      const colunas = fields.map(field => ({
        header: field.name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        key: field.name,
        width: field.name === 'data' ? 12 : 20
      }));

      sheet.columns = colunas;
      sheet.addRows(results);

      sheet.columns.forEach(column => {
        if (column.key !== 'data') {
          let maxLength = column.header.length;
          column.eachCell({ includeEmpty: true }, cell => {
            const cellLength = cell.value ? cell.value.toString().length : 0;
            if (cellLength > maxLength) maxLength = cellLength;
          });
          column.width = maxLength + 2;
        }
      });

      sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
      sheet.autoFilter = {
        from: 'A1',
        to: `${String.fromCharCode(64 + colunas.length)}1`
      };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio_funcionalidades.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    });
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).send("Erro ao exportar Excel de funcionalidades.");
  }
});

// excel duvida
app.get('/exportar-excel-duvidas', async (req, res) => {
  try {
    const query = `SELECT * FROM tickets WHERE tipo = 'duvida' ORDER BY id DESC`;

    db.query(query, async (err, results, fields) => {
      if (err) {
        console.error("Erro ao buscar dados:", err);
        return res.status(500).send("Erro ao gerar relatório de dúvidas.");
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Dúvidas");

      const colunas = fields.map(field => ({
        header: field.name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        key: field.name,
        width: field.name === 'data' ? 12 : 20
      }));

      sheet.columns = colunas;
      sheet.addRows(results);

      sheet.columns.forEach(column => {
        if (column.key !== 'data') {
          let maxLength = column.header.length;
          column.eachCell({ includeEmpty: true }, cell => {
            const cellLength = cell.value ? cell.value.toString().length : 0;
            if (cellLength > maxLength) maxLength = cellLength;
          });
          column.width = maxLength + 2;
        }
      });

      sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
      sheet.autoFilter = {
        from: 'A1',
        to: `${String.fromCharCode(64 + colunas.length)}1`
      };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio_duvidas.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    });
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).send("Erro ao exportar Excel de dúvidas.");
  }
});


// Churn excel

app.get('/exportar-excel-churn', async (req, res) => {
  try {
    const query = `SELECT * FROM tickets WHERE tipo = 'churn' ORDER BY id DESC`;

    db.query(query, async (err, results, fields) => {
      if (err) {
        console.error("Erro ao buscar dados:", err);
        return res.status(500).send("Erro ao gerar relatório de churn.");
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Churn");

      const colunas = fields.map(field => ({
        header: field.name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        key: field.name,
        width: field.name === 'data' ? 12 : 20
      }));

      sheet.columns = colunas;
      sheet.addRows(results);

      sheet.columns.forEach(column => {
        if (column.key !== 'data') {
          let maxLength = column.header.length;
          column.eachCell({ includeEmpty: true }, cell => {
            const cellLength = cell.value ? cell.value.toString().length : 0;
            if (cellLength > maxLength) maxLength = cellLength;
          });
          column.width = maxLength + 2;
        }
      });

      sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
      sheet.autoFilter = {
        from: 'A1',
        to: `${String.fromCharCode(64 + colunas.length)}1`
      };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio_churn.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    });
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).send("Erro ao exportar Excel de churn.");
  }
});


// Sistemas Excel

app.get('/exportar-excel-sistema', async (req, res) => {
  try {
    const query = `SELECT * FROM tickets WHERE tipo = 'sistema' ORDER BY id DESC`;

    db.query(query, async (err, results, fields) => {
      if (err) {
        console.error("Erro ao buscar dados:", err);
        return res.status(500).send("Erro ao gerar relatório de sistema.");
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Sistema");

      const colunas = fields.map(field => ({
        header: field.name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        key: field.name,
        width: field.name === 'data' ? 12 : 20
      }));

      sheet.columns = colunas;
      sheet.addRows(results);

      sheet.columns.forEach(column => {
        if (column.key !== 'data') {
          let maxLength = column.header.length;
          column.eachCell({ includeEmpty: true }, cell => {
            const cellLength = cell.value ? cell.value.toString().length : 0;
            if (cellLength > maxLength) maxLength = cellLength;
          });
          column.width = maxLength + 2;
        }
      });

      sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
      sheet.autoFilter = {
        from: 'A1',
        to: `${String.fromCharCode(64 + colunas.length)}1`
      };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio_sistema.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    });
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).send("Erro ao exportar Excel de sistema.");
  }
});

// Verifica se a planilha tem mais de uma coluna preenchida
app.post('/verificar-excel', upload.single('arquivo'), (req, res) => {
  try {
    const caminhoArquivo = req.file.path;

    // Lê o arquivo Excel
    const workbook = xlsx.readFile(caminhoArquivo);
    const primeiraAba = workbook.SheetNames[0];
    const planilha = workbook.Sheets[primeiraAba];
    const dados = xlsx.utils.sheet_to_json(planilha, { header: 1 });

    const primeiraLinha = dados[0] || [];
    const colunasPreenchidas = primeiraLinha.filter(c => c !== undefined && c !== '').length;

    // Deleta o arquivo temporário
    fs.unlinkSync(caminhoArquivo);

    // Retorna true se tiver 2 colunas preenchidas
    res.json({ sucesso: colunasPreenchidas === 2 });
  } catch (erro) {
    console.error("Erro ao verificar Excel:", erro);
    res.status(500).json({ sucesso: false, erro: 'Erro ao verificar arquivo Excel' });
  }
});

// rota onde salva os dados da planilha no banco de dados

app.post('/importar-razao-social', upload.single('arquivo'), (req, res) => {
  try {
    const caminhoArquivo = req.file.path;

    const workbook = xlsx.readFile(caminhoArquivo);
    const primeiraAba = workbook.SheetNames[0];
    const planilha = workbook.Sheets[primeiraAba];
    const dados = xlsx.utils.sheet_to_json(planilha, { header: 1 });

    const linhas = dados
  .slice(1) // ignora a primeira linha (índice 0)
  .map(l => l[0])
  .filter(valor => typeof valor === 'string' && valor.trim() !== '');

    const inseridos = [];
    const regexCNPJ = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/;

    const promises = linhas.map(razaoCompleta => {
      return new Promise(resolve => {
        const cnpjEncontrado = razaoCompleta.match(regexCNPJ)?.[0] || '';
        const razaoLimpa = razaoCompleta.trim();

        db.query('SELECT * FROM razao_social WHERE razao_social = ?', [razaoLimpa], (err, result) => {
          if (err) {
            console.error("Erro ao consultar:", err);
            return resolve(); // continua mesmo com erro
          }

          if (result.length === 0) {
            db.query(
              'INSERT INTO razao_social (razao_social, nome_fantasia, cnpj, cliente) VALUES (?, ?, ?, ?)',
              [razaoLimpa, 0, cnpjEncontrado, 0],
              (errInsert) => {
                if (!errInsert) {
                  inseridos.push(razaoLimpa);
                } else {
                  console.error("Erro ao inserir:", errInsert);
                }
                resolve();
              }
            );
          } else {
            resolve(); // já existe
          }
        });
      });
    });

    Promise.all(promises).then(() => {
      fs.unlinkSync(caminhoArquivo); // limpa arquivo enviado
      res.json({
        sucesso: true,
        total: inseridos.length,
        inseridos: inseridos
      });
    });

  } catch (erro) {
    console.error("Erro ao importar razão social:", erro);
    res.status(500).json({ sucesso: false, erro: 'Erro ao importar razão social' });
  }
});

app.get('/sugestoes-razao-social', (req, res) => {
  const sql = `SELECT razao_social FROM razao_social ORDER BY razao_social`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erro ao buscar sugestões:', err);
      return res.status(500).json({ erro: 'Erro ao buscar sugestões' });
    }

    const sugestoes = results.map(r => r.razao_social);
    res.json(sugestoes);
  });
});

app.get('/sugestoes-razao-social', (req, res) => {
  const sql = `SELECT razao_social FROM razao_social ORDER BY razao_social`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erro ao buscar sugestões:', err);
      return res.status(500).json({ erro: 'Erro ao buscar sugestões' });
    }

    const sugestoes = results.map(r => r.razao_social);
    res.json(sugestoes);
  });
});


// rota salvar alteração dentro do banco de dados na tabela razao_social

app.post('/alterar-cliente', (req, res) => {
  const { razao_social, nome_fantasia, cliente } = req.body;

  if (!razao_social || !nome_fantasia) {
    return res.status(400).json({ sucesso: false, mensagem: "Campos obrigatórios não preenchidos." });
  }

  const sql = `UPDATE razao_social SET nome_fantasia = ?, cliente = ? WHERE razao_social = ?`;
  const valores = [nome_fantasia, cliente, razao_social];

  db.query(sql, valores, (err, result) => {
    if (err) {
      console.error("Erro ao atualizar cliente:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao atualizar cliente." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ sucesso: false, mensagem: "Razão social não encontrada." });
    }

    res.json({ sucesso: true, mensagem: "Cliente atualizado com sucesso!" });
  });
});

// rota que busca os dados da razao_social e preenche automático o campo nome_fantasia e o checkbox cliente

app.get('/dados-razao-social', (req, res) => {
  const { nome } = req.query;

  const sql = `SELECT nome_fantasia, cliente FROM razao_social WHERE razao_social = ? LIMIT 1`;

  db.query(sql, [nome], (err, results) => {
    if (err) {
      console.error("Erro ao buscar dados:", err);
      return res.status(500).json({ erro: "Erro ao buscar dados" });
    }

    if (results.length === 0) {
      return res.status(404).json({ erro: "Razão social não encontrada" });
    }

    res.json(results[0]);
  });
});





// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

