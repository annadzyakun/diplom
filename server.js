
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',  // Замените на имя пользователя PostgreSQL
  host: 'localhost',
  database: 'form_data', // Замените на название вашей базы данных
  password: 'ANNA',  // Замените на пароль PostgreSQL
  port: 5432,
});

app.post('/register', async (req, res) => {
    try {
        const { username, password, email, surname, phone, name, patronymic, birthdate, dolzhnost, role, salt } = req.body;

        //  *** Добавлено для отладки ***
        console.log("Data received from client:", req.body);
        //  *** Добавлено для отладки ***

        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO users (username, password, email, surname, phone, name, patronymic, birthdate, dolzhnost, role, salt)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;

        const values = [
            username,
            hashedPassword,
            email,
            surname,
            phone,
            name,
            patronymic,
            birthdate,
            dolzhnost,
            role,  // ***  Проверьте, что тут правильное имя столбца  ***
            salt
        ];

        await pool.query(query, values);

        res.status(201).json({ message: 'Регистрация успешна!' });

    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ message: 'Ошибка регистрации. Пожалуйста, попробуйте позже.' });
    }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
