require('dotenv').config({ path: 'dados.env' });

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

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


// rota página relatorio
app.get("/relatorio", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "relatorio.html"));
});

// rota cadastro ticket
app.get("/ticket", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "ticket.html"));
});

// Permitir que o front-end busque todos os tickets do banco de dados.

app.get('/tickets', (req, res) => {
    db.query(`
        SELECT 
            ticket, 
            atendente, 
            razao_social, 
            tipo, 
            titulo, 
            menu_duvida, 
            churn, 
            funcionalidade, 
            sistema, 
            status
        FROM tickets
    `, (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar tickets' });
        res.status(200).json(results);
    });
});


// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

