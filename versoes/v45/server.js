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
    data_abertura,
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

  // Calcula data/hora de fechamento se status for 'Fechado'
  const agora = new Date();
  const data_fechamento = status.toLowerCase() === 'fechado' ? agora.toISOString().split('T')[0] : null;
  const hora_fechamento = status.toLowerCase() === 'fechado' ? agora.toTimeString().split(' ')[0] : null;

  const sql = `
    INSERT INTO tickets (
      razao_social, cnpj, data_abertura, hora, status, ticket, card, titulo,
      menu_duvida, descricao, cliente, tipo, atendente,
      churn, funcionalidade, sistema, nome_fantasia, chamado,
      data_fechamento, hora_fechamento
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const valores = [
    razao_social, cnpj, data_abertura, hora, status, ticket, card, titulo,
    menu_duvida, descricao, cliente, tipo, atendente,
    churn, funcionalidade, sistema, nome_fantasia, chamado,
    data_fechamento, hora_fechamento
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
      CONCAT_WS('', COALESCE(titulo, ''), COALESCE(churn, ''), COALESCE(funcionalidade, ''), COALESCE(sistema, '')) AS titulo,
      status,
      DATE_FORMAT(data_abertura, '%d/%m/%Y') AS data_abertura,
      chamado,
      descricao
  FROM tickets
  ORDER BY ticket DESC
`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erro ao buscar tickets:', err);
      res.status(500).send('Erro ao buscar tickets');
    } else {
      res.json(results);
    }
  });
});

// Rota modal adicionar descrição

app.post('/atualizar-descricao', (req, res) => {
  const { ticket, descricao, status } = req.body;

  const isFechado = status.toLowerCase() === "fechado";

  const sql = `
    UPDATE tickets
    SET descricao = ?,
        status = ?${isFechado ? `,
        data_fechamento = IF(data_fechamento IS NULL, CURDATE(), data_fechamento),
        hora_fechamento = IF(hora_fechamento IS NULL, CURTIME(), hora_fechamento)` : ''}
    WHERE ticket = ?
  `;

  const params = [descricao, status, ticket];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Erro ao atualizar:", err);
      return res.status(500).json({ sucesso: false });
    }

    res.json({ sucesso: true });
  });
});


// limita o carregamento do relatório de 20 em 20
app.get('/tickets-filtrado', (req, res) => {
  const status = req.query.status;
  const limite = parseInt(req.query.limite) || 20;
  const offset = parseInt(req.query.offset) || 0;

  let sql = `
    SELECT 
      t.ticket, 
      t.atendente, 
      t.razao_social, 
      t.tipo, 
      CONCAT_WS('', COALESCE(t.titulo, ''), COALESCE(t.churn, ''), COALESCE(t.funcionalidade, ''), COALESCE(t.sistema, '')) AS titulo,
      t.status,
      DATE_FORMAT(t.data_abertura, '%d/%m/%Y') AS data_abertura,
      IFNULL(DATE_FORMAT(t.data_fechamento, '%d/%m/%Y'), '-') AS data_fechamento,
      t.hora,
      IFNULL(t.hora_fechamento, '-') AS hora_fechamento,
      t.chamado,
      t.descricao,
      CASE TRIM(t.cliente) WHEN '1' THEN 'Sim' ELSE 'Não' END AS cliente
    FROM tickets t
  `;

  const params = [];

  if (status) {
    sql += ` WHERE t.status = ?`;
    params.push(status.toLowerCase());
  }

  sql += ` ORDER BY t.ticket DESC LIMIT ? OFFSET ?`;
  params.push(limite, offset);

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Erro ao buscar tickets filtrados:", err);
      return res.status(500).json({ erro: "Erro ao buscar dados" });
    }

    res.json(results);
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
         DATE_FORMAT(data_abertura, '%d/%m/%Y') AS data_abertura

    FROM tickets
    WHERE status = 'aberto'
    ORDER BY data_abertura DESC
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
         DATE_FORMAT(data_abertura, '%d/%m/%Y') AS data_abertura
    FROM tickets
    WHERE status = 'Fechado'
    ORDER BY data_abertura DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar tickets fechados' });
    res.status(200).json(results);
  });
});


const ExcelJS = require('exceljs');

// Exporta excel todos

app.get('/exportar-excel', async (req, res) => {
  try {
    const query = `SELECT * FROM tickets ORDER BY id DESC`;

    db.query(query, async (err, results, fields) => {
      if (err) {
        console.error("Erro ao buscar dados:", err);
        return res.status(500).send("Erro ao gerar relatório.");
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Relatório");

      const colunas = fields
        .filter(field => field.name !== 'id')
        .sort((a, b) => {
          const ordemFinal = ['data_abertura', 'hora', 'data_fechamento', 'hora_fechamento'];
          const aFinal = ordemFinal.includes(a.name);
          const bFinal = ordemFinal.includes(b.name);

          if (aFinal && !bFinal) return 1;
          if (!aFinal && bFinal) return -1;
          return 0;
        })
        .map(field => ({
          header: field.name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          key: field.name,
          width: field.name.includes("data") ? 12 : field.name.includes("hora") ? 10 : 20
        }));

      sheet.columns = colunas;
      sheet.addRows(results);

      sheet.columns.forEach(column => {
        let maxLength = column.header.length;
        column.eachCell({ includeEmpty: true }, cell => {
          const cellLength = cell.value ? cell.value.toString().length : 0;
          if (cellLength > maxLength) maxLength = cellLength;
        });

        if (column.key.includes("data")) {
          column.width = 12;
        } else if (column.key.includes("hora")) {
          column.width = 10;
        } else {
          column.width = Math.min(maxLength, 30);
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

      const colunasParaExcluir = ['id', 'titulo', 'menu_duvida', 'churn', 'sistema'];
      const ordemFinal = ['data_abertura', 'hora', 'data_fechamento', 'hora_fechamento'];

      const camposFiltrados = fields
        .filter(field => !colunasParaExcluir.includes(field.name))
        .sort((a, b) => {
          const aFinal = ordemFinal.includes(a.name);
          const bFinal = ordemFinal.includes(b.name);
          if (aFinal && !bFinal) return 1;
          if (!aFinal && bFinal) return -1;
          return 0;
        })
        .map(field => ({
          header: field.name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          key: field.name,
          width: field.name.includes("data") ? 12 : field.name.includes("hora") ? 10 : 20
        }));

      sheet.columns = camposFiltrados;

      const dadosFiltrados = results.map(row => {
        const novo = {};
        camposFiltrados.forEach(coluna => {
          novo[coluna.key] = row[coluna.key];
        });
        return novo;
      });

      sheet.addRows(dadosFiltrados);

      sheet.columns.forEach(column => {
        let maxLength = column.header.length;
        column.eachCell({ includeEmpty: true }, cell => {
          const cellLength = cell.value ? cell.value.toString().length : 0;
          if (cellLength > maxLength) maxLength = cellLength;
        });

        if (column.key.includes("data")) {
          column.width = 12;
        } else if (column.key.includes("hora")) {
          column.width = 10;
        } else {
          column.width = Math.min(maxLength, 30);
        }
      });

      sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
      sheet.autoFilter = {
        from: 'A1',
        to: `${String.fromCharCode(64 + camposFiltrados.length)}1`
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

      // ❌ Colunas para excluir
      const colunasParaExcluir = ['id', 'churn', 'funcionalidade', 'sistema'];

      const ordemFinal = ['data_abertura', 'hora', 'data_fechamento', 'hora_fechamento'];

      const camposFiltrados = fields
        .filter(field => !colunasParaExcluir.includes(field.name))
        .sort((a, b) => {
          const aFinal = ordemFinal.includes(a.name);
          const bFinal = ordemFinal.includes(b.name);
          if (aFinal && !bFinal) return 1;
          if (!aFinal && bFinal) return -1;
          return 0;
        })
        .map(field => ({
          header: field.name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          key: field.name,
          width: field.name.includes("data") ? 12 : field.name.includes("hora") ? 10 : 20
        }));

      sheet.columns = camposFiltrados;

      const dadosFiltrados = results.map(row => {
        const novo = {};
        camposFiltrados.forEach(coluna => {
          novo[coluna.key] = row[coluna.key];
        });
        return novo;
      });

      sheet.addRows(dadosFiltrados);

      sheet.columns.forEach(column => {
        let maxLength = column.header.length;
        column.eachCell({ includeEmpty: true }, cell => {
          const cellLength = cell.value ? cell.value.toString().length : 0;
          if (cellLength > maxLength) maxLength = cellLength;
        });

        if (column.key.includes("data")) {
          column.width = 12;
        } else if (column.key.includes("hora")) {
          column.width = 10;
        } else {
          column.width = Math.min(maxLength, 30);
        }
      });

      sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
      sheet.autoFilter = {
        from: 'A1',
        to: `${String.fromCharCode(64 + camposFiltrados.length)}1`
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

      const colunasParaExcluir = [
        'id', 'titulo', 'menu_duvida', 'funcionalidade', 'sistema',
        'data_fechamento', 'hora_fechamento'
      ];
      const ordemFinal = ['data_abertura', 'hora'];

      const camposFiltrados = fields
        .filter(field => !colunasParaExcluir.includes(field.name))
        .sort((a, b) => {
          const aFinal = ordemFinal.includes(a.name);
          const bFinal = ordemFinal.includes(b.name);
          if (aFinal && !bFinal) return 1;
          if (!aFinal && bFinal) return -1;
          return 0;
        })
        .map(field => ({
          header: field.name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          key: field.name,
          width: field.name.includes("data") ? 12 : field.name.includes("hora") ? 10 : 20
        }));

      sheet.columns = camposFiltrados;

      const dadosFiltrados = results.map(row => {
        const novo = {};
        camposFiltrados.forEach(coluna => {
          novo[coluna.key] = row[coluna.key];
        });
        return novo;
      });

      sheet.addRows(dadosFiltrados);

      sheet.columns.forEach(column => {
        let maxLength = column.header.length;
        column.eachCell({ includeEmpty: true }, cell => {
          const cellLength = cell.value ? cell.value.toString().length : 0;
          if (cellLength > maxLength) maxLength = cellLength;
        });

        if (column.key.includes("data")) {
          column.width = 12;
        } else if (column.key.includes("hora")) {
          column.width = 10;
        } else {
          column.width = Math.min(maxLength, 30);
        }
      });

      sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
      sheet.autoFilter = {
        from: 'A1',
        to: `${String.fromCharCode(64 + camposFiltrados.length)}1`
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

      const colunasParaExcluir = ['id'];
      const ordemFinal = ['data_abertura', 'hora', 'data_fechamento', 'hora_fechamento'];

      const camposFiltrados = fields
        .filter(field => !colunasParaExcluir.includes(field.name))
        .sort((a, b) => {
          const aFinal = ordemFinal.includes(a.name);
          const bFinal = ordemFinal.includes(b.name);
          if (aFinal && !bFinal) return 1;
          if (!aFinal && bFinal) return -1;
          return 0;
        })
        .map(field => ({
          header: field.name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          key: field.name,
          width:
            field.name.includes('data') ? 12 :
            field.name.includes('hora') ? 10 : 20
        }));

      sheet.columns = camposFiltrados;

      const dadosFiltrados = results.map(row => {
        const novo = {};
        camposFiltrados.forEach(coluna => {
          novo[coluna.key] = row[coluna.key];
        });
        return novo;
      });

      sheet.addRows(dadosFiltrados);

      sheet.columns.forEach(column => {
        let maxLength = column.header.length;
        column.eachCell({ includeEmpty: true }, cell => {
          const cellLength = cell.value ? cell.value.toString().length : 0;
          if (cellLength > maxLength) maxLength = cellLength;
        });

        if (['data_abertura', 'data_fechamento'].includes(column.key)) {
          column.width = 12;
        } else if (['hora', 'hora_fechamento'].includes(column.key)) {
          column.width = 10;
        } else {
          column.width = Math.min(maxLength, 30);
        }
      });

      sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
      sheet.autoFilter = {
        from: 'A1',
        to: `${String.fromCharCode(64 + camposFiltrados.length)}1`
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
              [razaoLimpa, "", cnpjEncontrado, 0],

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




// rota salvar alteração dentro do banco de dados na tabela razao_social

app.post('/alterar-cliente', (req, res) => {
  const { razao_social, nome_fantasia = '', cliente } = req.body;

  if (!razao_social) {
    return res.status(400).json({ sucesso: false, mensagem: "Razão social é obrigatória." });
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





//Rota sugestao do ticket e ferramentas alterar cliente
app.get('/sugestoes-razao-social', (req, res) => {
  const termo = `%${req.query.q}%`;

  const sql = `SELECT razao_social, cnpj FROM razao_social WHERE razao_social LIKE ? LIMIT 10`;

  db.query(sql, [termo], (err, results) => {
    if (err) {
      console.error("Erro ao buscar sugestões:", err);
      return res.status(500).json({ erro: "Erro ao buscar sugestões" });
    }

    res.json(results); // envia lista com razão_social e cnpj
  });
});

app.get('/dados-razao-social', (req, res) => {
  const nome = req.query.nome;
  const query = 'SELECT nome_fantasia, cliente FROM razao_social WHERE razao_social = ? LIMIT 1';

  db.query(query, [nome], (erro, resultados) => {
    if (erro) {
      console.error("Erro ao buscar dados:", erro);
      return res.status(500).json({ error: 'Erro interno ao buscar dados' });
    }

    if (resultados.length > 0) {
      res.json(resultados[0]);
    } else {
      res.status(404).json({ error: 'Razão Social não encontrada' });
    }
  });
});

// rota para carregar quem é cliente

app.get('/clientes', (req, res) => {
  const sql = `
    SELECT razao_social, nome_fantasia, cnpj, cliente
    FROM razao_social
    WHERE cliente = 1
    ORDER BY razao_social
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar clientes:", err);
      return res.status(500).json({ erro: "Erro ao buscar clientes" });
    }
    res.json(results);
  });
});






// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});


app.get('/ticket/:id', (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT 
      t.ticket, 
      t.atendente, 
      t.razao_social, 
      t.tipo, 
      CONCAT_WS('', COALESCE(t.titulo, ''), COALESCE(t.churn, ''), COALESCE(t.funcionalidade, ''), COALESCE(t.sistema, '')) AS titulo,
      t.status,
      DATE_FORMAT(t.data_abertura, '%d/%m/%Y') AS data_abertura,
      IFNULL(DATE_FORMAT(t.data_fechamento, '%d/%m/%Y'), '-') AS data_fechamento,
      t.hora,
      IFNULL(t.hora_fechamento, '-') AS hora_fechamento,
      t.chamado,
      t.descricao,
      CASE rs.cliente WHEN 1 THEN 'Sim' ELSE 'Não' END AS cliente
    FROM tickets t
    LEFT JOIN razao_social rs ON BINARY TRIM(rs.razao_social) = BINARY TRIM(t.razao_social)
    WHERE t.ticket = ?
    LIMIT 1
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Erro ao buscar ticket:", err);
      return res.status(500).json({ erro: "Erro interno ao buscar ticket" });
    }

    if (result.length === 0) {
      return res.status(404).json({ erro: "Ticket não encontrado" });
    }

    res.json(result[0]);
  });
});

app.post('/verificar-excel', upload.single('arquivo'), (req, res) => {
  try {
    const caminhoArquivo = req.file.path;

    const workbook = xlsx.readFile(caminhoArquivo);
    const primeiraAba = workbook.SheetNames[0];
    const planilha = workbook.Sheets[primeiraAba];
    const dados = xlsx.utils.sheet_to_json(planilha, { header: 1 });

    // Verifica se todas as linhas (exceto o cabeçalho) têm no máximo 2 colunas preenchidas
    const valido = dados.slice(1).every(linha => {
      const colunasPreenchidas = linha.filter(c => c !== undefined && c !== '').length;
      return colunasPreenchidas <= 2;
    });

    fs.unlinkSync(caminhoArquivo);
    res.json({ sucesso: valido });

  } catch (erro) {
    console.error("Erro ao verificar Excel:", erro);
    res.status(500).json({ sucesso: false, erro: 'Erro ao verificar arquivo Excel' });
  }
});




