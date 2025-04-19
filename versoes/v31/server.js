require('dotenv').config({ path: 'dados.env' });

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const fs = require("fs");
const multer = require("multer");
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




// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

