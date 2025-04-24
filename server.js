require('dotenv').config({ path: 'dados.env' });

console.log("🟢 DB_USER carregado:", process.env.DB_USER);

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');



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
// voltar app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));

// Conexão com o banco de dados
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const dbPromise = db.promise(); 

// Ping para manter o pool de conexões ativo
setInterval(() => {
  db.query('SELECT 1', (err) => {
    if (err) console.error("🔴 Erro no ping de conexão:", err.message);
    else console.log("🔁 Ping MySQL OK");
  });
}, 60000); // a cada 60 segundos

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Erro ao conectar ao MySQL:', err);
  } else {
    console.log('🟢 Conexão com o MySQL pool estabelecida!');
    connection.release(); // libera a conexão de volta para o pool
  }
});


// Configuração para guardar a informação do usuário logado entre requisições.
app.use(session({
  secret: 'chave-secreta-do-sistema', // pode ser qualquer frase
  resave: false,
  saveUninitialized: false
}));

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

  const agora = new Date();
  let statusFinal = status;

  // Força status 'fechado' se for do tipo churn ou sistema
  if (tipo === 'churn' || tipo === 'sistema') {
    statusFinal = 'fechado';
  }

  const data_fechamento = statusFinal.toLowerCase() === 'fechado' ? agora.toISOString().split('T')[0] : null;
  const hora_fechamento = statusFinal.toLowerCase() === 'fechado' ? agora.toTimeString().split(' ')[0] : null;

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
    razao_social, cnpj, data_abertura, hora, statusFinal, ticket, card, titulo,
    menu_duvida, descricao, cliente, tipo, atendente,
    churn, funcionalidade, sistema, nome_fantasia, chamado,
    data_fechamento, hora_fechamento
  ];

  db.query(sql, valores, (err, result) => {
    if (err) {
      console.error('Erro ao inserir ticket:', err);
      return res.status(500).json({ error: 'Erro ao salvar o ticket' });
    }
  
    // Atualiza cliente para 0 se for churn
    if (tipo === "churn" && cliente === true) {
      const atualizarClienteSQL = `
        UPDATE razao_social
        SET cliente = 0
        WHERE razao_social = ?
      `;
      db.query(atualizarClienteSQL, [razao_social], (err2) => {
        if (err2) {
          console.error("Erro ao atualizar cliente após churn:", err2);
        } else {
          console.log(`🟡 Cliente ${razao_social} atualizado para não cliente após churn.`);
        }
      });
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

// rota página usuários (tenants_clientes)
app.get("/tenants_clientes", autenticado, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "tenants_clientes.html"));
});

// rota página relatorio
app.get("/relatorio", autenticado, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "relatorio.html"));
});

// rota dashboard
app.get("/dashboard", autenticado, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// rota cadastro de ticket
app.get("/ticket", autenticado, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "ticket.html"));
});
// rota usuarios
app.get("/usuarios", autenticado, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "usuarios.html"));
});

// rota de login (não precisa proteger)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// rota de cadastro (também não precisa)
app.get('/cadastrar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cadastrar.html'));
});

app.get('/churn', autenticado, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'churn.html'));
});

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/teste', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teste.html'));
});

app.get('/apresentacao', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'apresentacao.html'));
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

// rota da página do login


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
    const query = `
      SELECT 
        t.razao_social,
        rs.nome_fantasia,
        rs.cnpj,
        t.atendente,
        t.tipo,
        t.status,
        t.descricao,
        t.chamado,
        rs.data_cliente,
        t.data_abertura AS data_do_churn,
        t.hora
      FROM tickets t
      LEFT JOIN razao_social rs 
        ON BINARY TRIM(t.razao_social) = BINARY TRIM(rs.razao_social)
      WHERE t.tipo = 'churn'
      ORDER BY t.id DESC
    `;

    db.query(query, async (err, results) => {
      if (err) {
        console.error("Erro ao buscar dados:", err);
        return res.status(500).send("Erro ao gerar relatório de churn.");
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Churn");

      // Define manualmente a ordem e os cabeçalhos
      const camposOrdenados = [
        { key: "razao_social", header: "Razão Social" },
        { key: "nome_fantasia", header: "Nome Fantasia" },
        { key: "cnpj", header: "CNPJ" },
        { key: "atendente", header: "Atendente" },
        { key: "tipo", header: "Tipo" },
        { key: "status", header: "Status" },
        { key: "descricao", header: "Descrição" },
        { key: "chamado", header: "Chamado" },
        { key: "data_cliente", header: "Data do Cliente" },
        { key: "data_do_churn", header: "Data do Churn" },
        { key: "hora", header: "Hora" },
      ];

      // Define colunas na planilha
      sheet.columns = camposOrdenados.map(col => ({
        header: col.header,
        key: col.key,
        width: col.key.includes("data") ? 15 : col.key.includes("hora") ? 10 : 20
      }));

      // Monta os dados na mesma ordem
      const dados = results.map(row => {
        const novo = {};
        camposOrdenados.forEach(col => {
          novo[col.key] = row[col.key];
        });
        return novo;
      });

      sheet.addRows(dados);

      // Ajuste de largura automática
      sheet.columns.forEach(column => {
        let maxLength = column.header.length;
        column.eachCell({ includeEmpty: true }, cell => {
          const cellLength = cell.value ? cell.value.toString().length : 0;
          if (cellLength > maxLength) maxLength = cellLength;
        });
        column.width = Math.min(maxLength + 2, 30);
      });

      // Congela a primeira linha e ativa filtro
      sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
      sheet.autoFilter = {
        from: 'A1',
        to: `K1` // 11ª coluna = K
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

app.get('/exportar-excel-cliente-churn', async (req, res) => {
  try {
    const query = `
      SELECT 
        razao_social, 
        nome_fantasia, 
        cnpj, 
        data_cliente, 
        data_churn 
      FROM churn 
      ORDER BY data_churn DESC
    `;

    db.query(query, async (err, results) => {
      if (err) {
        console.error("Erro ao buscar churns de clientes:", err);
        return res.status(500).send("Erro ao gerar relatório de churn cliente.");
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Churn Cliente");

      const campos = [
        { key: "razao_social", header: "Razão Social" },
        { key: "nome_fantasia", header: "Nome Fantasia" },
        { key: "cnpj", header: "CNPJ" },
        { key: "data_cliente", header: "Data Cliente" },
        { key: "data_churn", header: "Data Churn" }
      ];

      sheet.columns = campos.map(col => ({
        header: col.header,
        key: col.key,
        width: col.key.includes("data") ? 15 : 20
      }));

      const dados = results.map(row => {
        const novo = {};
        campos.forEach(col => {
          novo[col.key] = row[col.key];
        });
        return novo;
      });

      sheet.addRows(dados);

      sheet.columns.forEach(column => {
        let maxLength = column.header.length;
        column.eachCell({ includeEmpty: true }, cell => {
          const cellLength = cell.value ? cell.value.toString().length : 0;
          if (cellLength > maxLength) maxLength = cellLength;
        });
        column.width = Math.min(maxLength + 2, 30);
      });

      sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
      sheet.autoFilter = {
        from: 'A1',
        to: 'E1'
      };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio_cliente_churn.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    });
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).send("Erro ao exportar Excel de churn cliente.");
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
      .map(l => String(l[0]).split(',')[0].trim())
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
  const { razao_social, nome_fantasia = '', cliente, data_cliente } = req.body;

  if (!razao_social) {
    return res.status(400).json({ sucesso: false, mensagem: "Razão social é obrigatória." });
  }

  const sql = `
    UPDATE razao_social 
    SET nome_fantasia = ?, cliente = ?, data_cliente = ? 
    WHERE razao_social = ?
  `;
  const valores = [nome_fantasia, cliente, data_cliente, razao_social];

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
    SELECT 
      razao_social, 
      nome_fantasia, 
      cnpj, 
      DATE_FORMAT(data_cliente, '%d/%m/%Y') AS data_cliente
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



// rota aprova ou não usuários

app.post('/usuarios/atualizar-aprovado', (req, res) => {
  const { email, aprovado } = req.body;

  if (!email || typeof aprovado === "undefined") {
    return res.status(400).json({ sucesso: false, mensagem: "Dados incompletos." });
  }

  const sql = `UPDATE usuarios SET aprovado = ? WHERE email = ?`;
  db.query(sql, [aprovado, email], (err, resultado) => {
    if (err) {
      console.error("Erro ao atualizar status:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro interno." });
    }

    res.json({ sucesso: true });
  });
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

// Autenticação - Início

// rota para cadastro de usuário

app.post('/cadastro', async (req, res) => {
  try {
    const { email, senha, nome } = req.body;

    console.log("📥 Dados recebidos:", { email, senha, nome });

    if (!email || !senha || !nome) {
      console.log("⚠️ Dados faltando no corpo");
      return res.status(400).json({ sucesso: false, mensagem: 'Campos obrigatórios faltando.' });
    }

    const sqlVerifica = 'SELECT id FROM usuarios WHERE email = ?';
    db.query(sqlVerifica, [email], async (err, results) => {
      if (err) {
        console.error("❌ Erro ao verificar email:", err);
        return res.status(500).json({ sucesso: false, mensagem: 'Erro interno na verificação.' });
      }

      if (results.length > 0) {
        console.log("⚠️ Email já existe");
        return res.status(400).json({ sucesso: false, mensagem: 'Este email já está cadastrado.' });
      }

      try {
        const hash = await bcrypt.hash(senha, 10);
        console.log("🔐 Hash gerado:", hash);

        const sqlInserir = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';
        db.query(sqlInserir, [nome, email, hash], (err) => {
          if (err) {
            console.error("❌ Erro ao inserir:", err);
            return res.status(500).json({ sucesso: false, mensagem: 'Erro ao cadastrar no banco.' });
          }

          console.log("✅ Cadastro realizado com sucesso!");
          res.json({ sucesso: true });
        });

      } catch (erroHash) {
        console.error("❌ Erro ao gerar hash:", erroHash);
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao gerar senha segura.' });
      }
    });
  } catch (erro) {
    console.error("❌ Erro geral na rota /cadastro:", erro);
    res.status(500).json({ sucesso: false, mensagem: 'Erro inesperado.' });
  }
});





// rota para login

app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const sql = 'SELECT * FROM usuarios WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
    }

    const usuario = results[0];

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ sucesso: false, mensagem: 'Senha incorreta.' });
    }

    if (usuario.aprovado !== 1) {
      return res.status(403).json({ sucesso: false, mensagem: 'Seu acesso ainda não foi aprovado.' });
    }

    // ✅ Corrigido: agora salva nome também
    req.session.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email
    };

    res.json({ sucesso: true });
  });
});


// rota para excluir usuário

app.delete('/usuarios/excluir', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ sucesso: false, mensagem: "Email não informado." });
  }

  const sql = 'DELETE FROM usuarios WHERE email = ?';
  db.query(sql, [email], (err, result) => {
    if (err) {
      console.error("Erro ao excluir usuário:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro interno." });
    }

    res.json({ sucesso: true });
  });
});

//rota para retornar dados da sessão
app.get("/sessao", (req, res) => {
  if (req.session.usuario) {
    return res.json({
      logado: true,
      nome: req.session.usuario.nome
    });
  }
  res.json({ logado: false });
});



// Função para proteger páginas restritas
function autenticado(req, res, next) {
  if (req.session.usuario && req.session.usuario.id) return next();
  res.status(401).sendFile(path.join(__dirname, 'public', 'nao_autorizado.html'));
}

// rota listar usuarios
app.get('/usuarios-cadastrados', (req, res) => {
  const sql = `
    SELECT 
      nome,
      email, 
      CASE aprovado WHEN 1 THEN 'Sim' ELSE 'Não' END AS aprovado
    FROM usuarios
    ORDER BY email
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuários:", err);
      return res.status(500).json({ erro: "Erro ao buscar usuários." });
    }
    res.json(results);
  });
});

// rota usuário logado
app.get("/usuario-logado", (req, res) => {
  if (req.session && req.session.usuario) {
    res.json({ nome: req.session.usuario.nome });
  } else {
    res.status(401).json({ erro: "Usuário não autenticado" });
  }
});





// rota de logout
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ sucesso: true });
});

// roda sugestão de funcionalidade 
app.get("/sugestoes-funcionalidade", (req, res) => {
  const termo = (req.query.q || "").toLowerCase(); // ✅ primeiro define
    const sql = `
  SELECT DISTINCT funcionalidade FROM funcionalidade_titulo
  WHERE LOWER(TRIM(funcionalidade)) LIKE ?
  LIMIT 20
`;

  db.query(sql, [`%${termo}%`], (err, resultados) => {
    if (err) {
      console.error("Erro ao buscar funcionalidades:", err);
      console.error("Erro ao cadastrar:", err);
return res.status(500).send("Erro interno: " + err.message);

    }

    const funcionalidades = resultados.map(row => row.funcionalidade);
    res.json(funcionalidades);
  });
});





//

// rota cadastrar funcionalidade
app.post("/cadastrar-funcionalidade", (req, res) => {
  let { funcionalidade, usuario } = req.body;

  if (!funcionalidade || !usuario) {
    return res.status(400).json({ sucesso: false, mensagem: "Campos obrigatórios ausentes." });
  }

  funcionalidade = funcionalidade.toLowerCase(); // 👈 converte aqui

  const sql = `
    INSERT INTO funcionalidade_titulo (funcionalidade, usuario, data_hora)
    VALUES (?, ?, NOW())
  `;

  db.query(sql, [funcionalidade, usuario], (err) => {
    if (err) {
      console.error("Erro ao cadastrar funcionalidade:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro ao salvar no banco." });
    }

    res.json({ sucesso: true });
  });
});

// rota sugestões de churn

app.get("/sugestoes-churn", (req, res) => {
  const termo = (req.query.q || "").toLowerCase();

  const sqlChurn = `
    SELECT motivo AS termo FROM churn_titulo
    WHERE LOWER(TRIM(motivo)) LIKE ?
  `;
  const sqlFuncionalidade = `
    SELECT funcionalidade AS termo FROM funcionalidade_titulo
    WHERE LOWER(TRIM(funcionalidade)) LIKE ?
  `;

  const termoLike = `%${termo}%`;

  const resultadosCombinados = [];

  db.query(sqlChurn, [termoLike], (errChurn, resultadosChurn) => {
    if (errChurn) {
      console.error("Erro ao buscar churns:", errChurn);
      return res.status(500).json([]);
    }

    resultadosCombinados.push(...resultadosChurn.map(row => row.termo));

    db.query(sqlFuncionalidade, [termoLike], (errFunc, resultadosFunc) => {
      if (errFunc) {
        console.error("Erro ao buscar funcionalidades:", errFunc);
        return res.status(500).json([]);
      }

      resultadosCombinados.push(...resultadosFunc.map(row => row.termo));

      // Remove duplicados e envia
      const unicos = [...new Set(resultadosCombinados)];
      res.json(unicos);
    });
  });
});


// rota cadastrar churn

app.post("/cadastrar-churn", (req, res) => {
  let { motivo, usuario } = req.body;

  if (!motivo || !usuario) {
    return res.status(400).json({ sucesso: false, mensagem: "Campos obrigatórios ausentes." });
  }

  motivo = motivo.toLowerCase();

  const sql = `
    INSERT INTO churn_titulo (motivo, usuario, data_hora)

    VALUES (?, ?, NOW())
  `;

  db.query(sql, [motivo, usuario], (err) => {
    if (err) {
      console.error("Erro ao cadastrar motivo:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro ao salvar no banco." });
    }

    res.json({ sucesso: true });
  });
});

// Salvar churn na tabela churn

app.post("/salvar-churn", async (req, res) => {
  const { razao_social, nome_fantasia, cnpj } = req.body;
  const data_churn = new Date().toISOString().split("T")[0]; // formato seguro para comparação

  const verificarSQL = `
    SELECT * FROM churn 
    WHERE razao_social = ? AND data_churn = ?
  `;

  const buscarDataClienteSQL = `
    SELECT data_cliente FROM razao_social WHERE razao_social = ?
  `;

  const inserirSQL = `
    INSERT INTO churn (razao_social, nome_fantasia, cnpj, data_cliente, data_churn)
    VALUES (?, ?, ?, ?, ?)
  `;

  try {
    // Verifica se já existe churn para essa razão social hoje
    const [existentes] = await dbPromise.query(verificarSQL, [razao_social, data_churn]);

    if (existentes.length > 0) {
      return res.json({ sucesso: true });
    }

    // Busca a data_cliente (pode vir como null)
    const [resultadoData] = await dbPromise.query(buscarDataClienteSQL, [razao_social]);
    const data_cliente = resultadoData.length > 0 ? resultadoData[0].data_cliente : null;

    // Insere mesmo que data_cliente seja null
    await dbPromise.query(inserirSQL, [razao_social, nome_fantasia, cnpj, data_cliente, data_churn]);

    res.json({ sucesso: true });
  } catch (err) {
    console.error("Erro ao salvar churn:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno ao salvar churn." });
  }
});



// buscar os churns

app.get("/churns", (req, res) => {
  const sql = `
    SELECT 
      razao_social, 
      nome_fantasia, 
      cnpj, 
      DATE_FORMAT(data_cliente, '%d/%m/%Y') AS data_cliente, 
      DATE_FORMAT(data_churn, '%d/%m/%Y') AS data_churn
    FROM churn
    ORDER BY data_churn DESC
  `;

  db.query(sql, (err, resultados) => {
    if (err) {
      console.error("Erro ao buscar churns:", err);
      return res.status(500).json({ erro: "Erro ao buscar churns" });
    }

    res.json(resultados);
  });
});

// modal churn

app.get("/churns-por-razao", (req, res) => {
  const razao = req.query.razao;

  const sql = `
    SELECT 
      c.razao_social,
      c.nome_fantasia,
      c.cnpj,
      c.data_cliente,
      c.data_churn,
      t.churn
    FROM churn c
    LEFT JOIN tickets t 
      ON BINARY TRIM(t.razao_social) = BINARY TRIM(c.razao_social)
      AND t.tipo = 'churn'
      AND DATE(t.data_abertura) = DATE(c.data_churn)
    WHERE BINARY TRIM(c.razao_social) = ?
    ORDER BY c.data_churn DESC
  `;

  db.query(sql, [razao], (err, resultados) => {
    if (err) {
      console.error("Erro ao buscar churns:", err);
      return res.status(500).json({ erro: "Erro ao buscar churns." });
    }

    res.json(resultados);
  });
});

const fetch = require("node-fetch");





// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando`);
});





