// server.js (или app.js - в зависимости от вашего проекта)

const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors'); // Если нужно разрешить запросы с другого домена

const app = express();
const port = 3000; // Или любой другой порт

// Настройки подключения к базе данных (PostgreSQL)
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'form_data',
    password: 'ANNA',
    port: 5432,                 // Порт PostgreSQL (обычно 5432)
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true })); // Обработка данных из формы
app.use(bodyParser.json()); // Обработка JSON-данных
app.use(cors()); // Разрешение запросов с другого домена (если нужно)

// Маршрут для обработки POST-запроса с формы
app.post('/submit', async (req, res) => {
    try {
        const { name, phone, comment } = req.body;

        // Проверка данных (необязательно, но рекомендуется)
        if (!name || !phone) {
            return res.status(400).send('Имя и телефон обязательны.');
        }

        // SQL-запрос для вставки данных в таблицу
        const query = `
            INSERT INTO public.callback_requests (name, phone, comment)
            VALUES ($1, $2, $3)
            RETURNING id; // Возвращаем id вставленной записи
        `;

        // Значения для подстановки в запрос
        const values = [name, phone, comment];

        // Выполнение запроса к базе данных
        const result = await pool.query(query, values);

        // Отправка ответа клиенту (успешная вставка)
        console.log('Запись успешно добавлена в базу данных. ID:', result.rows[0].id); // Выводим ID
        res.status(200).send('Заявка успешно отправлена!'); // Отправляем OK
    } catch (error) {
        console.error('Ошибка при добавлении записи в базу данных:', error);
        res.status(500).send('Произошла ошибка при отправке заявки.'); // Отправляем ошибку
    }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});