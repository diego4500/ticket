require('dotenv').config({ path: 'dados.env' });

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

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


// Rota para listar tickets
app.get('/tickets', (req, res) => {
    db.query('SELECT * FROM tickets', (err, results) => {
        if (err) {
            console.error('Erro ao buscar tickets:', err);
            return res.status(500).json({ error: 'Erro ao buscar tickets' });
        }
        res.status(200).json(results);
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
