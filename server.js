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
  const { format, utcToZonedTime } = require('date-fns-tz');

  const {
    razao_social,
    cnpj,
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

  const fusoHorario = 'America/Sao_Paulo';
  const agora = new Date();
  const zoned = utcToZonedTime(agora, fusoHorario);

  const data_abertura = format(zoned, 'yyyy-MM-dd');
  const hora = format(zoned, 'HH:mm:ss');

  let statusFinal = status;
  if (tipo === 'churn' || tipo === 'sistema') {
    statusFinal = 'fechado';
  }

  const data_fechamento = statusFinal.toLowerCase() === 'fechado' ? data_abertura : null;
  const hora_fechamento = statusFinal.toLowerCase() === 'fechado' ? hora : null;

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

app.get('/apresentacao', autenticado, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'apresentacao.html'));
});

app.get('/razao_social', autenticado, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'razao_social.html'));
});

app.get('/importar', autenticado, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'importar_razao.html'));
});

app.get('/dashboard_tv', autenticado, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard_tv.html'));
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
      descricao,
      card
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
  const { ticket, descricao, status, card, bug = 0, melhoria = 0 } = req.body;



  const isFechado = status.toLowerCase() === "fechado";

  const sql = `
  UPDATE tickets
  SET descricao = ?,
      status = ?,
      card = ?,
      bug = ?,
      melhoria = ?
      ${isFechado ? `,
      data_fechamento = IF(data_fechamento IS NULL, CURDATE(), data_fechamento),
      hora_fechamento = IF(hora_fechamento IS NULL, CURTIME(), hora_fechamento)` : ''}
  WHERE ticket = ?
`;


const params = [descricao, status, card, bug, melhoria, ticket];

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
  t.card,
  t.bug,
  t.melhoria,
  CASE TRIM(t.cliente) WHEN '1' THEN '✅' ELSE '❌' END AS cliente
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

app.get('/tickets/fechados',  (req, res) => {
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

// Função para formatar CNPJ
const formatarCNPJ = (cnpj) => {
  if (!cnpj) return '';
  cnpj = cnpj.toString().replace(/\D/g, '').padStart(14, '0');
  return `${cnpj.substring(0, 2)}.${cnpj.substring(2, 5)}.${cnpj.substring(5, 8)}/${cnpj.substring(8, 12)}-${cnpj.substring(12, 14)}`;
};

app.get('/exportar-excel', autenticado, async (req, res) => {
  try {
    const query = `SELECT * FROM tickets ORDER BY id DESC`;

    db.query(query, async (err, results, fields) => {
      if (err) {
        console.error("Erro ao buscar dados:", err);
        return res.status(500).send("Erro ao gerar relatório.");
      }

      // 🔵 Aqui tratamos conforme você pediu:
      const dadosTratados = results.map(item => ({
        ...item,
        cnpj: formatarCNPJ(item.cnpj),
        cliente: item.cliente === 1 ? "É Cliente" : "Não Cliente",
        card: item.card ?? '',
        bug: item.bug === 1 ? "É Bug" : '',
        melhoria: item.melhoria === 1 ? "É Melhoria" : '',
        impeditivo: item.impeditivo === 1 ? "Sim" : "Não" // ✅ Nova regra para impedimento
      }));

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
      sheet.addRows(dadosTratados);

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

app.get('/exportar-excel-funcionalidade', autenticado, async (req, res) => {
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

      // 🔵 Trata os dados conforme solicitado
      const dadosTratados = results.map(row => {
        const novo = {};

        camposFiltrados.forEach(coluna => {
          const key = coluna.key;

          if (key === 'cnpj') {
            novo[key] = formatarCNPJ(row[key]);
          } else if (key === 'cliente') {
            novo[key] = row[key] === 1 ? "É Cliente" : "Não Cliente";
          } else if (key === 'card') {
            novo[key] = row[key] ?? '';
          } else if (key === 'bug') {
            novo[key] = row[key] === 1 ? "É Bug" : '';
          } else if (key === 'melhoria') {
            novo[key] = row[key] === 1 ? "É Melhoria" : '';
          } else if (key === 'impeditivo') {
            novo[key] = row[key] === 1 ? "Sim" : "Não";
          } else {
            novo[key] = row[key];
          }
        });

        return novo;
      });

      sheet.addRows(dadosTratados);

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







app.get('/exportar-excel-duvidas', autenticado, async (req, res) => {
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

      // 🔵 Trata os dados conforme solicitado
      const dadosTratados = results.map(row => {
        const novo = {};

        camposFiltrados.forEach(coluna => {
          const key = coluna.key;

          if (key === 'cnpj') {
            novo[key] = formatarCNPJ(row[key]);
          } else if (key === 'cliente') {
            novo[key] = row[key] === 1 ? "É Cliente" : "Não Cliente";
          } else if (key === 'card') {
            novo[key] = row[key] ?? '';
          } else if (key === 'bug') {
            novo[key] = row[key] === 1 ? "É Bug" : '';
          } else if (key === 'melhoria') {
            novo[key] = row[key] === 1 ? "É Melhoria" : '';
          } else if (key === 'impeditivo') {
            novo[key] = row[key] === 1 ? "Sim" : "Não";
          } else {
            novo[key] = row[key];
          }
        });

        return novo;
      });

      sheet.addRows(dadosTratados);

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



app.get('/exportar-excel-churn', autenticado, async (req, res) => {
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

app.get('/exportar-excel-cliente-churn', autenticado, async (req, res) => {
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

app.get('/exportar-excel-sistema', autenticado, async (req, res) => {
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
      .slice(1) // ignora cabeçalho
      .map(l => String(l[0]).split(',')[0].trim())
      .filter(valor => typeof valor === 'string' && valor.trim() !== '');

    const inseridos = [];
    const regexCNPJ = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/;

    const promises = linhas.map(razaoCompleta => {
      return new Promise(resolve => {
        const cnpjEncontrado = (razaoCompleta.match(regexCNPJ)?.[0] || '').replace(/\D/g, '');
        const razaoLimpa = razaoCompleta.trim();

        if (!cnpjEncontrado) {
          console.warn(`CNPJ não encontrado para: ${razaoLimpa}`);
          return resolve(); // pula sem salvar se não encontrou CNPJ
        }

        // 🔵 Aqui mudou: agora busca pelo CNPJ, não pela razão social
        db.query('SELECT * FROM razao_social WHERE cnpj = ?', [cnpjEncontrado], (err, result) => {
          if (err) {
            console.error("Erro ao consultar:", err);
            return resolve();
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
            resolve(); // já existe, não insere
          }
        });
      });
    });

    Promise.all(promises).then(() => {
      fs.unlinkSync(caminhoArquivo); // limpa arquivo temporário
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


// excel apresentacao
app.get('/exportar-excel-apresentacao', autenticado, async (req, res) => {
  try {
    const query = `
      SELECT 
        razao_social, 
        nome_fantasia, 
        cnpj, 
        DATE_FORMAT(data_cadastro, '%d/%m/%Y') AS data_cadastro, 
        DATE_FORMAT(data_apresentacao, '%d/%m/%Y') AS data_apresentacao, 
        observacao
      FROM apresentacao
      ORDER BY data_apresentacao DESC
    `;

    db.query(query, async (err, results) => {
      if (err) {
        console.error("Erro ao buscar apresentações:", err);
        return res.status(500).send("Erro ao gerar relatório de apresentações.");
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Apresentações");

      const campos = [
        { key: "razao_social", header: "Razão Social" },
        { key: "nome_fantasia", header: "Nome Fantasia" },
        { key: "cnpj", header: "CNPJ" },
        { key: "data_cadastro", header: "Data Cadastro RD" }, // ✅ aqui o novo nome
        { key: "data_apresentacao", header: "Data Apresentação" },
        { key: "observacao", header: "Observação" }
      ];

      sheet.columns = campos.map(col => ({
        header: col.header,
        key: col.key,
        width: col.key.includes("data") ? 15 : 30
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
        column.width = Math.min(maxLength + 2, 40);
      });

      sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
      sheet.autoFilter = {
        from: 'A1',
        to: 'F1'
      };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio_apresentacoes.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    });
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).send("Erro ao exportar Excel de apresentações.");
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

app.get('/dados-razao-apresentacao', (req, res) => {
  const nome = req.query.nome;
  const query = 'SELECT nome_fantasia, cnpj FROM razao_social WHERE razao_social = ? LIMIT 1';

  db.query(query, [nome], (erro, resultados) => {
    if (erro) {
      console.error("Erro ao buscar dados da apresentação:", erro);
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
  t.card,
  t.bug,
  t.melhoria,
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




/*/
// Salvar churn na tabela churn

app.post("/salvar-churn", async (req, res) => {
  const { razao_social, nome_fantasia, cnpj } = req.body;
  const data_churn = new Date().toISOString().split("T")[0]; // formato seguro para comparação

  const verificarSQL = `
    SELECT * FROM churn 
    WHERE razao_social = ? AND data_churn = ?
  `;

  const buscarDataCliente = `
  SELECT data_cliente 
  FROM razao_social 
  WHERE REPLACE(REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '-', ''), '/', ''), ' ', '') = ? 
  LIMIT 1
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

*/

/*
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

*/

// modal churn

/*

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

*/
const fetch = require("node-fetch");
/*
// cadastrar apresentacao
app.post("/cadastrar-apresentacao", (req, res) => {
  const { razao_social, nome_fantasia, cnpj, data_cliente } = req.body;

  // Converte data_cliente de dd/mm/yyyy para yyyy-mm-dd
  const [dia, mes, ano] = data_cliente.split('/');
  const data_cadastro = `${ano}-${mes}-${dia}`;

  // Pega data atual no formato yyyy-mm-dd
  const hoje = new Date();
  const data_apresentacao = hoje.toISOString().split("T")[0];

  const sql = `
    INSERT INTO apresentacao (razao_social, nome_fantasia, cnpj, data_cadastro, data_apresentacao)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [razao_social, nome_fantasia, cnpj, data_cadastro, data_apresentacao], (err, result) => {
    if (err) {
      console.error("❌ Erro ao cadastrar apresentação:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro no banco de dados" });
    }

    return res.status(200).json({ sucesso: true, mensagem: "✅ Apresentação cadastrada com sucesso!" });
  });
});
*/

// listar apresentacao
app.get("/apresentacoes", (req, res) => {
  const sql = `
    SELECT razao_social, nome_fantasia, cnpj, data_cadastro, data_apresentacao
    FROM apresentacao
    ORDER BY data_apresentacao DESC
  `;

  db.query(sql, (err, resultados) => {
    if (err) {
      console.error("❌ Erro ao buscar apresentações:", err);
      return res.status(500).json({ erro: "Erro ao buscar apresentações" });
    }

    res.json(resultados);
  });
});

// apresentacao modal
app.get("/apresentacoes-funcionalidades", (req, res) => {
  const sql = `
    SELECT t.razao_social, t.nome_fantasia, t.cnpj, t.data_abertura, t.titulo, t.tipo
    FROM tickets t
    INNER JOIN apresentacao a ON t.razao_social = a.razao_social
    WHERE t.tipo IN ('funcionalidade', 'sistema')
      AND DATE(t.data_abertura) BETWEEN DATE_SUB(CURDATE(), INTERVAL 2 DAY) AND CURDATE()
    ORDER BY t.data_abertura DESC
  `;

  db.query(sql, (err, resultados) => {
    if (err) {
      console.error("❌ Erro ao buscar tickets de funcionalidades e sistema para apresentações:", err);
      return res.status(500).json({ erro: "Erro ao buscar dados." });
    }

    res.json(resultados);
  });
});


app.get("/funcionalidades-por-razao", (req, res) => {
  const razao = req.query.razao;

  const sql = `
    SELECT 
      t.funcionalidade,
      t.sistema,
      t.tipo,
      t.data_abertura
    FROM tickets t
    WHERE t.tipo IN ('funcionalidade', 'sistema')
      AND t.razao_social = ?
      AND DATE(t.data_abertura) BETWEEN DATE_SUB(CURDATE(), INTERVAL 2 DAY) AND CURDATE()
    ORDER BY t.data_abertura DESC
  `;

  db.query(sql, [razao], (err, resultados) => {
    if (err) {
      console.error("Erro ao buscar funcionalidades/sistemas:", err);
      return res.status(500).json({ erro: "Erro ao buscar dados." });
    }

    // Junta funcionalidade e sistema em uma coluna única para o front
    const dadosFormatados = resultados.map(row => ({
      funcionalidade: row.funcionalidade || row.sistema || "-",
      tipo: row.tipo,
      data_abertura: row.data_abertura
    }));

    res.json(dadosFormatados);
  });
});

// rota tras funcionalidades da apresentacao

app.get('/funcionalidades-por-cnpj-data-apresentacao', (req, res) => {
  let cnpj = req.query.cnpj;
  if (!cnpj) {
    return res.status(400).json({ erro: 'CNPJ não fornecido' });
  }

  // Remove pontos, traços e barras do CNPJ
  cnpj = cnpj.replace(/[.\-\/]/g, '');

  const sql = `
    SELECT t.funcionalidade, t.tipo, t.data_abertura
    FROM tickets t
    INNER JOIN apresentacao a
      ON REPLACE(REPLACE(REPLACE(t.cnpj, '.', ''), '-', ''), '/', '') = REPLACE(REPLACE(REPLACE(a.cnpj, '.', ''), '-', ''), '/', '')
    WHERE REPLACE(REPLACE(REPLACE(t.cnpj, '.', ''), '-', ''), '/', '') = ?
      AND t.tipo = 'funcionalidade'
      AND DATE(t.data_abertura) = DATE(a.data_apresentacao)
    ORDER BY t.data_abertura DESC
  `;

  db.query(sql, [cnpj], (err, resultados) => {
    if (err) {
      console.error("Erro ao buscar funcionalidades:", err);
      return res.status(500).json({ erro: "Erro ao buscar funcionalidades." });
    }

    res.json(resultados);
  });
});





// Salva observacao e data apresentacao na tabela apresentacao

app.post("/salvar-observacao", (req, res) => {
  const { razao_social, observacao, data_apresentacao, data_cadastro } = req.body;


  const sql = `
    UPDATE apresentacao
SET observacao = ?, data_apresentacao = ?, data_cadastro = ?
WHERE razao_social = ?

  `;

  db.query(sql, [observacao, data_apresentacao, data_cadastro, razao_social], (err, results) => {
    if (err) {
      console.error("❌ Erro ao salvar observação e data:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro ao salvar observação e data" });
    }

    res.json({ sucesso: true });
  });
});




// tras a observacao e a data apresentacao no modal da tabela apresentacao 
app.get("/apresentacao-detalhes", (req, res) => {
  const razao = req.query.razao;

  const sql = `
    SELECT razao_social, nome_fantasia, cnpj, data_cadastro, data_apresentacao, observacao
    FROM apresentacao
    WHERE razao_social = ?
    LIMIT 1
  `;

  db.query(sql, [razao], (err, results) => {
    if (err) {
      console.error("Erro ao buscar apresentação:", err);
      return res.status(500).json({ erro: "Erro ao buscar dados da apresentação" });
    }

    if (results.length === 0) {
      return res.status(404).json({ erro: "Apresentação não encontrada" });
    }

    res.json(results[0]);
  });
});

// salvar razao social completo

app.post('/cadastrar-razao-social', (req, res) => {
  const {
    razao_social,
    nome_fantasia,
    cnpj,
    cliente,
    data_cliente,
    nome_a,
    contato_a,
    link_a,
    nome_b,
    contato_b,
    link_b,
    data_churn,
    observacao
  } = req.body;

  // Primeiro verifica se o CNPJ já existe
  const sqlVerificar = 'SELECT cnpj FROM razao_social WHERE cnpj = ?';

  db.query(sqlVerificar, [cnpj], (err, resultados) => {
    if (err) {
      console.error('Erro ao verificar CNPJ:', err);
      return res.status(500).json({ erro: 'Erro ao verificar CNPJ.' });
    }

    if (resultados.length > 0) {
      // Já existe esse CNPJ
      return res.status(400).json({ erro: 'CNPJ já cadastrado.' });
    }

    // Se não existir, então insere o novo cadastro
    const sqlInserir = `
      INSERT INTO razao_social 
      (razao_social, nome_fantasia, cnpj, cliente, data_cliente, nome_a, contato_a, link_a, nome_b, contato_b, link_b, data_churn, observacao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sqlInserir, [
      razao_social,
      nome_fantasia,
      cnpj,
      cliente,
      data_cliente,
      nome_a,
      contato_a,
      link_a,
      nome_b,
      contato_b,
      link_b,
      data_churn,
      observacao
    ], (err, resultado) => {
      if (err) {
        console.error('Erro ao cadastrar razão social:', err);
        return res.status(500).json({ erro: 'Erro ao cadastrar razão social.' });
      }
      res.status(201).json({ mensagem: 'Cadastro realizado com sucesso!' });
    });
  });
});

// importar grafana

app.post('/importar_grafana', upload.single('arquivo'), (req, res) => {
  console.log("🟢 POST /importar_grafana acionado");
  console.log("🗂️ Arquivo recebido:", req.file?.originalname);

  try {
    const caminho = req.file.path;
    const resultados = [];
    let contador = 0;

    fs.createReadStream(caminho)
      .pipe(csv())
      .on('data', (linha) => {
        const normalizado = {};

        // 🔧 Limpa todas as chaves do objeto
        for (let chave in linha) {
          const chaveLimpa = chave
            .replace(/^\uFEFF/, '')   // remove BOM invisível do começo
            .replace(/"/g, '')        // remove aspas duplas
            .trim()                   // remove espaços em branco
            .toLowerCase();           // transforma em letras minúsculas

          normalizado[chaveLimpa] = linha[chave];
        }

        const tenant = normalizado["tenant"] || "";
        const diasSemAcesso = parseInt(normalizado["dias sem acesso"] || 0);
        const faturamento = parseInt(normalizado["qtd. fat. realizados"] || 0);

        const cnpjEncontrado = (tenant.match(/\d{14}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/) || [])[0];

        

        if (cnpjEncontrado) {
          const cnpj = cnpjEncontrado.replace(/\D/g, '');
          contador++;
          console.log(`[${contador}] 🔎 CNPJ: ${cnpj} | Sem Acesso: ${diasSemAcesso} | Faturamento: ${faturamento}`);
          resultados.push({ cnpj, diasSemAcesso, faturamento });
        }
      })
      .on('end', async () => {
        let totalAtualizados = 0;

        for (const { cnpj, diasSemAcesso, faturamento } of resultados) {
          try {
            await dbPromise.query(
              'UPDATE razao_social SET sem_acesso = ?, faturamento = ? WHERE cnpj = ?',
              [diasSemAcesso, faturamento, cnpj]
            );
            totalAtualizados++;
          } catch (erroAtualizacao) {
            console.error(`Erro ao atualizar CNPJ ${cnpj}:`, erroAtualizacao);
          }
        }

        fs.unlinkSync(caminho);
        res.json({ sucesso: true, totalAtualizados });
      });
  } catch (erro) {
    console.error("Erro ao importar dados do Grafana:", erro);
    res.status(500).json({ sucesso: false, erro: "Erro ao importar dados." });
  }
});




//Listar razão social na pagina cadastrar razao social

app.get('/listar-razao-social', (req, res) => {
  let pagina = parseInt(req.query.pagina) || 1;
  let limite = parseInt(req.query.limite) || 50;
  let offset = (pagina - 1) * limite;
  let filtro = req.query.filtro || 'todos';

  const ordenarPor = req.query.ordenarPor || 'razao_social';
  const direcao = req.query.direcao === 'DESC' ? 'DESC' : 'ASC';

  // Protege contra SQL Injection permitindo apenas certos campos para ordenação:
  const colunasPermitidas = ['razao_social', 'sem_acesso', 'faturamento', 'data_vencimento'];
  const colunaOrdenacao = colunasPermitidas.includes(ordenarPor) ? ordenarPor : 'razao_social';

  let sql = `
    SELECT 
      razao_social, 
      nome_fantasia, 
      cnpj, 
      cliente, 
      DATE_FORMAT(data_cliente, '%Y-%m-%d') AS data_cliente,
      DATE_FORMAT(data_vencimento, '%Y-%m-%d') AS data_vencimento,
      sem_acesso,
      faturamento
    FROM razao_social
  `;

  const params = [];

  if (filtro === 'cliente') {
    sql += ` WHERE cliente = 1 `;
  }

  sql += ` ORDER BY ${colunaOrdenacao} ${direcao} LIMIT ? OFFSET ?`;
  params.push(limite, offset);

  db.query(sql, params, (err, resultados) => {
    if (err) {
      console.error('Erro ao buscar razões sociais:', err);
      return res.status(500).json({ erro: 'Erro ao buscar razões sociais.' });
    }
    res.json(resultados);
  });
});





// roda carregar todos os dados do modal da razao social
// Buscar todos os dados de uma razão social específica
app.get('/dados-completos-razao-social', (req, res) => {
  const nome = req.query.nome;

  const sql = `
    SELECT 
      id,
      razao_social,
      nome_fantasia,
      cnpj,
      cliente,
      DATE_FORMAT(data_cliente, '%Y-%m-%d') AS data_cliente, 
      nome_a,
      contato_a,
      link_a,
      nome_b,
      contato_b,
      link_b,
      observacao,
      dia_vencimento,
      DATE_FORMAT(data_vencimento, '%Y-%m-%d') AS data_vencimento,
      qt_licenca
    FROM razao_social
    WHERE razao_social = ?
    LIMIT 1
  `;

  db.query(sql, [nome], (erro, resultados) => {
    if (erro) {
      console.error("Erro ao buscar razão social:", erro);
      return res.status(500).json({ error: 'Erro interno ao buscar razão social' });
    }

    if (resultados.length > 0) {
      res.json(resultados[0]);
    } else {
      res.status(404).json({ error: 'Razão Social não encontrada' });
    }
  });
});

// editar dados razao social

app.post('/atualizar-razao-social', (req, res) => {
  const {
    id,
    razao_social,
    nome_fantasia,
    cnpj,
    cliente,
    data_cliente,
    nome_a,
    contato_a,
    link_a,
    nome_b,
    contato_b,
    link_b,
    observacao,
    dia_vencimento,
    data_vencimento,
    qt_licenca
  } = req.body;

  if (!id || !razao_social || !cnpj) {
    return res.status(400).json({ erro: 'ID, razão social e CNPJ são obrigatórios.' });
  }

  // Conversões seguras para NULL se vazios
  const dataClienteFinal = data_cliente && data_cliente.trim() !== '' ? data_cliente : null;
  const dataVencimentoFinal = data_vencimento && data_vencimento.trim() !== '' ? data_vencimento : null;

  const diaFinal = dia_vencimento !== '' && dia_vencimento !== null ? parseInt(dia_vencimento, 10) : null;
  const licencaFinal = qt_licenca !== '' && qt_licenca !== null ? parseInt(qt_licenca, 10) : null;

  const sqlAtualizar = `
    UPDATE razao_social 
    SET 
      razao_social = ?, 
      nome_fantasia = ?, 
      cnpj = ?, 
      cliente = ?, 
      data_cliente = ?, 
      nome_a = ?, 
      contato_a = ?, 
      link_a = ?, 
      nome_b = ?, 
      contato_b = ?, 
      link_b = ?, 
      observacao = ?,
      dia_vencimento = ?,
      data_vencimento = ?,
      qt_licenca = ?
    WHERE id = ?
  `;

  db.query(sqlAtualizar, [
    razao_social,
    nome_fantasia,
    cnpj,
    cliente,
    dataClienteFinal,
    nome_a,
    contato_a,
    link_a,
    nome_b,
    contato_b,
    link_b,
    observacao,
    diaFinal,
    dataVencimentoFinal,
    licencaFinal,
    id
  ], (err, resultado) => {
    if (err) {
      console.error('Erro ao atualizar razão social:', err);
      return res.status(500).json({ erro: 'Erro ao atualizar razão social.' });
    }

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Razão social não encontrada.' });
    }

    res.status(200).json({ mensagem: 'Atualização realizada com sucesso!' });
  });
});




// rota pesquisar razao social ou cnpj

app.get('/buscar-razao-social', (req, res) => {
  const termo = req.query.termo || '';
  const pagina = parseInt(req.query.pagina) || 1;
  const limite = parseInt(req.query.limite) || 50;
  const offset = (pagina - 1) * limite;

  const sql = `
    SELECT DISTINCT razao_social, nome_fantasia, cnpj, cliente, DATE_FORMAT(data_cliente, '%Y-%m-%d') AS data_cliente
    FROM razao_social
    WHERE razao_social LIKE ? OR cnpj LIKE ?
    ORDER BY razao_social ASC
    LIMIT ? OFFSET ?
  `;

  const parametros = [`%${termo}%`, `%${termo}%`, limite, offset];

  db.query(sql, parametros, (err, resultados) => {
    if (err) {
      console.error('Erro ao buscar razão social:', err);
      return res.status(500).json({ erro: 'Erro ao buscar razão social.' });
    }
    res.json(resultados);
  });
});









// Rota para contar quantos clientes ativos existem
app.get('/contar-clientes', (req, res) => {
  const sql = `SELECT COUNT(*) AS total FROM razao_social WHERE cliente = 1`;

  db.query(sql, (err, resultado) => {
    if (err) {
      console.error("Erro ao contar clientes:", err);
      return res.status(500).json({ erro: "Erro ao contar clientes." });
    }
    res.json({ total: resultado[0].total });
  });
});




app.post('/importar-razao', upload.single('arquivo'), (req, res) => {
  try {
    const caminhoArquivo = req.file.path;
    const workbook = xlsx.readFile(caminhoArquivo);
    const primeiraAba = workbook.SheetNames[0];
    const planilha = workbook.Sheets[primeiraAba];
    const dados = xlsx.utils.sheet_to_json(planilha, { header: 1 });

    const linhas = dados.slice(0); // Começa da primeira linha mesmo (não pula cabeçalho)
    const inseridos = [];

    const promises = linhas.map(linha => {
      return new Promise(resolve => {
        const razao_social = (linha[0] || '').toString().trim();
        let cnpj = (linha[1] || '').toString().trim();

        if (!razao_social || !cnpj) {
          return resolve(); // pula se vazio
        }

        cnpj = cnpj.replace(/\D/g, '');

        if (cnpj.length !== 14) {
          console.warn(`CNPJ inválido para: ${razao_social}`);
          return resolve();
        }

        db.query('SELECT id FROM razao_social WHERE cnpj = ?', [cnpj], (err, result) => {
          if (err) {
            console.error('Erro ao consultar:', err);
            return resolve();
          }

          if (result.length === 0) {
            db.query(
              'INSERT INTO razao_social (razao_social, cnpj) VALUES (?, ?)',
              [razao_social, cnpj],
              (errInsert) => {
                if (!errInsert) {
                  inseridos.push(razao_social);
                } else {
                  console.error('Erro ao inserir:', errInsert);
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
      fs.unlinkSync(caminhoArquivo);
      res.json({
        sucesso: true,
        total: inseridos.length,
        inseridos
      });
    });

  } catch (erro) {
    console.error('Erro ao importar razão social:', erro);
    res.status(500).json({ sucesso: false, erro: 'Erro ao importar razão social' });
  }
});

// rota sugestão de sistemas

app.get("/sugestoes-sistema", (req, res) => {
  const termo = req.query.q || '';

  const sql = `
    SELECT sistema 
    FROM sistema_titulo 
    WHERE sistema LIKE ?
    ORDER BY sistema ASC
  `;

  const parametro = `%${termo}%`;

  db.query(sql, [parametro], (erro, resultados) => {
    if (erro) {
      console.error("Erro ao buscar sistemas:", erro);
      return res.status(500).json({ erro: "Erro ao buscar sistemas" });
    }

    const sistemas = resultados.map(item => item.sistema);
    res.json(sistemas);
  });
});

// rota cadastrar sistema

app.post("/cadastrar-sistema", (req, res) => {
  const { sistema, usuario } = req.body;

  if (!sistema || !usuario) {
    return res.status(400).json({ sucesso: false, mensagem: "Dados inválidos para cadastro." });
  }

  const sql = `
    INSERT INTO sistema_titulo (sistema, usuario, data_hora)
    VALUES (?, ?, NOW())
  `;

  db.query(sql, [sistema, usuario], (erro, resultado) => {
    if (erro) {
      console.error("Erro ao cadastrar sistema:", erro);
      return res.status(500).json({ sucesso: false, mensagem: "Erro ao cadastrar sistema." });
    }

    res.json({ sucesso: true });
  });
});


// rota sugestão de dúvida

app.get("/sugestoes-duvida", (req, res) => {
  const termo = req.query.q || '';

  const sql = `
    SELECT duvida 
    FROM duvida_titulo 
    WHERE duvida LIKE ?
    ORDER BY duvida ASC
  `;

  const parametro = `%${termo}%`;

  db.query(sql, [parametro], (erro, resultados) => {
    if (erro) {
      console.error("Erro ao buscar dúvidas:", erro);
      return res.status(500).json({ erro: "Erro ao buscar dúvidas" });
    }

    const duvidas = resultados.map(item => item.duvida);
    res.json(duvidas);
  });
});


// rota cadastrar dúvida

app.post("/cadastrar-duvida", (req, res) => {
  const { duvida, usuario } = req.body;

  if (!duvida || !usuario) {
    return res.status(400).json({ sucesso: false, mensagem: "Dados inválidos para cadastro." });
  }

  const sql = `
    INSERT INTO duvida_titulo (duvida, usuario, data_hora)
    VALUES (?, ?, NOW())
  `;

  db.query(sql, [duvida, usuario], (erro, resultado) => {
    if (erro) {
      console.error("Erro ao cadastrar dúvida:", erro);
      return res.status(500).json({ sucesso: false, mensagem: "Erro ao cadastrar dúvida." });
    }

    res.json({ sucesso: true });
  });
});


// salvar churn data

// server.js  (ou onde ficam as rotas)
app.put('/atualizar-data-churn', (req, res) => {
  const { id, novaData } = req.body;           // id do churn  +  yyyy-mm-dd

  if (!id || !novaData) {
    return res.status(400).json({ sucesso:false, mensagem:'id ou data ausentes' });
  }

  const sql = `
    UPDATE churn
       SET data_churn = ?
     WHERE id = ?;
  `;

  db.query(sql, [novaData, id], err => {
    if (err) {
      console.error('Erro ao atualizar data_churn:', err);
      return res.status(500).json({ sucesso:false, mensagem:'erro interno' });
    }
    res.json({ sucesso:true });
  });
});


// listar churn na tabela

app.get("/listar-churns", (req, res) => {
  const sql = `
    SELECT id, razao_social, nome_fantasia, cnpj, data_cliente, data_churn
    FROM churn
    ORDER BY data_churn DESC
  `;

  db.query(sql, (err, resultados) => {
    if (err) {
      console.error("Erro ao listar churns:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar churns." });
    }

    res.json(resultados);
  });
});

app.get('/buscar-churn-por-cnpj-data', (req, res) => {
  const { cnpj, data_cliente } = req.query;

  if (!cnpj || !data_cliente) {
    return res.status(400).json({ sucesso: false, mensagem: 'CNPJ ou data faltando.' });
  }

  const cnpjLimpo = cnpj.replace(/\D/g, '');

  const sql = `
    SELECT churn
    FROM tickets
    WHERE tipo = 'churn'
      AND REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '-', ''), '/', '') = ?
      AND DATE(data_abertura) = DATE(?)
    ORDER BY id DESC
  `;

  db.query(sql, [cnpjLimpo, data_cliente], (err, resultados) => {
    if (err) {
      console.error("Erro ao buscar churn:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro interno." });
    }

    res.json({ sucesso: true, churns: resultados.map(r => r.churn) });
  });
});

app.post("/cadastrar-churn", (req, res) => {
  const { razao_social, nome_fantasia, cnpj, data_churn } = req.body;
  if (!cnpj || !razao_social || !data_churn) {
    return res.status(400).json({ sucesso:false, mensagem:"Dados incompletos." });
  }

  const cnpjLimpo = cnpj.replace(/\D/g, '');

  /* 1.‑ busca data_cliente -------------------------------------------------- */
  const sqlBusca = `
      SELECT data_cliente
        FROM razao_social
       WHERE REPLACE(REPLACE(REPLACE(REPLACE(cnpj,'.',''),'-',''),'/',''),' ','') = ?
       LIMIT 1`;
  db.query(sqlBusca, [cnpjLimpo], (err, rows) => {
    if (err) return res.status(500).json({sucesso:false,mensagem:"Erro ao buscar data_cliente."});

    const data_cliente = rows.length ? rows[0].data_cliente : null;

    /* 2.‑ insere o churn ---------------------------------------------------- */
    const sqlInsert = `
        INSERT INTO churn (razao_social, nome_fantasia, cnpj, data_churn, data_cliente)
        VALUES (?,?,?,?,?)`;
    db.query(sqlInsert,
      [razao_social, nome_fantasia, cnpjLimpo, data_churn, data_cliente],
      (err2) => {
        if (err2) return res.status(500).json({sucesso:false,mensagem:"Erro ao salvar churn."});

        /* 3.‑ marca cliente = 0 na tabela razao_social 🆕 ------------------- */
        const sqlUpdate = `
            UPDATE razao_social
               SET cliente = 0
             WHERE REPLACE(REPLACE(REPLACE(REPLACE(cnpj,'.',''),'-',''),'/',''),' ','') = ?`;
        db.query(sqlUpdate, [cnpjLimpo], (err3) => {
          if (err3) {                    // se falhar, registre mas ainda retorne sucesso do churn
            console.error("⚠️  Churn salvo, mas não foi possível atualizar 'cliente' na tabela razao_social:", err3);
          }
          /* 4.‑ resposta final --------------------------------------------- */
          res.json({ sucesso:true });
        });
      });
  });
});

// cadastrar dentro de ticke o titulo de churn

app.post("/cadastrar-motivo", (req, res) => {
  const { motivo, usuario } = req.body;

  if (!motivo || !usuario) {
    return res.status(400).json({ sucesso: false, mensagem: "Motivo e usuário são obrigatórios." });
  }

  const sql = `INSERT INTO churn_titulo (motivo, usuario) VALUES (?, ?)`;

  db.query(sql, [motivo, usuario], (err, resultado) => {
    if (err) {
      console.error("❌ Erro ao salvar motivo:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro ao salvar motivo." });
    }

    return res.json({ sucesso: true, id: resultado.insertId });
  });
});



// listar apresentação

app.get("/listar-apresentacao", (req, res) => {
  const sql = `
    SELECT 
      id, 
      razao_social, 
      nome_fantasia, 
      cnpj, 
      data_apresentacao, 
      data_cadastro,
      observacao
    FROM apresentacao
    ORDER BY data_apresentacao DESC
  `;

  db.query(sql, (err, resultados) => {
    if (err) {
      console.error("Erro ao buscar apresentações:", err);
      return res.status(500).json({ erro: "Erro ao buscar apresentações." });
    }

    res.json(resultados);
  });
});

// cadastrar apresentação

app.post("/cadastrar-apresentacao", (req, res) => {
  const { razao_social, nome_fantasia, cnpj, dataRD, data_apresentacao } = req.body;

  if (!razao_social || !cnpj || !data_apresentacao) {
    return res.status(400).json({ sucesso: false, mensagem: "Campos obrigatórios não preenchidos." });
  }

  const sql = `
    INSERT INTO apresentacao 
      (razao_social, nome_fantasia, cnpj, data_cadastro, data_apresentacao)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [razao_social, nome_fantasia, cnpj, dataRD, data_apresentacao], (err, resultado) => {
    if (err) {
      console.error("Erro ao cadastrar apresentação:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro ao cadastrar apresentação." });
    }

    res.json({ sucesso: true, mensagem: "Apresentação cadastrada com sucesso." });
  });
});

// busca a listagem de funcionalidade na tabela ticket

app.get('/buscar-funcionalidade', (req, res) => {
  const { cnpj, data_apresentacao } = req.query;

  if (!cnpj || !data_apresentacao) {
    return res.status(400).json({ sucesso: false, mensagem: 'CNPJ ou data faltando.' });
  }

  const cnpjLimpo = cnpj.replace(/\D/g, '');

  const sql = `
    SELECT funcionalidade
    FROM tickets
    WHERE tipo = 'funcionalidade'
      AND REPLACE(REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '-', ''), '/', ''), ' ', '') = ?
      AND DATE(data_abertura) = DATE(?)
    ORDER BY id DESC
  `;

  db.query(sql, [cnpjLimpo, data_apresentacao], (err, resultados) => {
    if (err) {
      console.error("Erro ao buscar funcionalidades:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao buscar funcionalidades." });
    }

    const funcionalidades = resultados.map(r => r.funcionalidade).filter(f => f); // Remove nulos

    res.json({ sucesso: true, funcionalidades: funcionalidades });
  });
});

// contador apresentação

app.get('/contar-apresentacao', (req, res) => {
  const sql = 'SELECT COUNT(*) AS total FROM apresentacao';

  db.query(sql, (err, resultado) => {
    if (err) {
      console.error("Erro ao contar apresentações:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro ao contar apresentações." });
    }

    const total = resultado[0]?.total || 0;
    res.json({ sucesso: true, total });
  });
});

// atualizar, salvar apresentacao

app.put('/atualizar-apresentacao', (req, res) => {
  const { id, novaData, observacao } = req.body;

  if (!id || !novaData) {
    return res.status(400).json({ sucesso: false, mensagem: 'ID ou data ausente.' });
  }

  const sql = `
    UPDATE apresentacao
    SET data_apresentacao = ?, observacao = ?
    WHERE id = ?
  `;

  db.query(sql, [novaData, observacao || null, id], (err, resultado) => {
    if (err) {
      console.error("Erro ao atualizar apresentação:", err);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar a apresentação.' });
    }

    res.json({ sucesso: true });
  });
});

app.get('/contar-churn', (req, res) => {
  const sql = 'SELECT COUNT(*) AS total FROM churn';

  db.query(sql, (err, resultado) => {
    if (err) {
      console.error("Erro ao contar churns:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro ao contar churns." });
    }

    const total = resultado[0]?.total || 0;
    res.json({ sucesso: true, total });
  });
});


// rota grafico apresentacao

app.get('/dados-apresentacoes-semana', (req, res) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // zera hora

  // Força o início da semana sempre em segunda-feira
  const diaDaSemana = hoje.getDay(); // 0 = domingo, 1 = segunda
  const diferencaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;
  const segundaAtual = new Date(hoje);
  segundaAtual.setDate(hoje.getDate() + diferencaSegunda);

  const semanas = [];

  for (let i = 7; i >= 0; i--) {
    const inicio = new Date(segundaAtual);
    inicio.setDate(inicio.getDate() - i * 7);
    inicio.setHours(0, 0, 0, 0);

    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 7); // fim da semana

    const label = i === 0 ? 'Essa Semana' : `há ${i} semanas`;
    semanas.push({ label, inicio, fim });
  }

  const querys = semanas.map((semana) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) AS total 
        FROM apresentacao 
        WHERE data_apresentacao >= ? AND data_apresentacao < ?
      `;
      db.query(sql, [semana.inicio, semana.fim], (err, result) => {
        if (err) return reject(err);
        resolve({ label: semana.label, total: result[0].total, dataRef: semana.inicio });
      });
    });
  });

  Promise.all(querys)
    .then(resultados => res.json(resultados))
    .catch(err => {
      console.error("Erro ao buscar dados:", err);
      res.status(500).json({ erro: "Erro ao buscar dados de apresentações" });
    });
});

// rota clientes ativos gráfico

app.get("/clientes-ativos-mensal", (req, res) => {
  const sql = `
    SELECT n1.*
    FROM n_clientes_ativos n1
    INNER JOIN (
        SELECT MAX(id) AS max_id
        FROM n_clientes_ativos
        GROUP BY YEAR(data_cadastro), MONTH(data_cadastro)
    ) AS ultimos
    ON n1.id = ultimos.max_id
    ORDER BY n1.data_cadastro;
  `;

  db.query(sql, (err, resultados) => {
    if (err) {
      console.error("Erro ao buscar clientes ativos:", err);
      return res.status(500).json({ erro: "Erro ao buscar dados" });
    }
    res.json(resultados);
  });
});




// rota para buscar os tickets em aberto do Diego Rocha
app.get('/tickets-abertos-diego', (req, res) => {
  const query = `
    SELECT COUNT(*) AS total
    FROM tickets
    WHERE LOWER(atendente) = 'diego rocha' AND status = 'aberto';
  `;

  db.query(query, (err, resultados) => {
    if (err) {
      console.error("❌ Erro ao buscar tickets em aberto do Diego:", err);
      return res.status(500).json({ erro: "Erro ao buscar dados" });
    }

    res.json({ total: resultados[0].total });
  });
});

//rota para buscar os tickets em aberto do Diego Rocha


app.get('/tickets-abertos-cassio', (req, res) => {
  const query = `
    SELECT COUNT(*) AS total
    FROM tickets
    WHERE LOWER(atendente) = 'cassio lindembergue' AND status = 'aberto';
  `;

  db.query(query, (err, resultados) => {
    if (err) {
      console.error("❌ Erro ao buscar tickets em aberto do Cassio:", err);
      return res.status(500).json({ erro: "Erro ao buscar dados" });
    }

    res.json({ total: resultados[0].total });
  });
});

// rota conta clientes no mes

app.get('/clientes-mes', (req, res) => {
  const query = `
    SELECT COUNT(*) AS total
    FROM razao_social
    WHERE MONTH(data_cliente) = MONTH(CURDATE())
      AND YEAR(data_cliente) = YEAR(CURDATE());
  `;

  db.query(query, (err, resultados) => {
    if (err) {
      console.error("❌ Erro ao contar clientes do mês:", err);
      return res.status(500).json({ erro: 'Erro ao buscar dados' });
    }

    res.json({ total: resultados[0].total });
  });
});

// contagem churn do mês

app.get('/churns-mes', (req, res) => {
  const query = `
    SELECT COUNT(*) AS total
    FROM churn
    WHERE MONTH(data_churn) = MONTH(CURDATE())
      AND YEAR(data_churn) = YEAR(CURDATE());
  `;

  db.query(query, (err, resultados) => {
    if (err) {
      console.error("❌ Erro ao contar churns do mês:", err);
      return res.status(500).json({ erro: 'Erro ao buscar dados' });
    }

    res.json({ total: resultados[0].total });
  });
});












// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando`);
});





