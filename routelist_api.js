const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 3002; // Или другой свободный порт

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'form_data',
    password: 'ANNA',
    port: 5432,
});

// Получение данных о заказах для расписания
app.get('/orders', async (req, res) => {
    try {
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const cleanerId = req.query.cleanerId; // Получаем ID клинера из параметров запроса

        if (!startDate || !endDate) {
            return res.status(400).json({message: 'Необходимо указать startDate и endDate'});
        }

        let query = `
            SELECT id, cleaning_type, cleaning_date, cleaning_time
            FROM public.orders
            WHERE cleaning_date BETWEEN $1 AND $2
        `;
        const values = [startDate, endDate];

        // Если указан ID клинера, добавляем условие фильтрации
        if (cleanerId) {
            query += ` AND cleaner_id = $3`;
            values.push(cleanerId);
        }

        query += ` ORDER BY cleaning_date, cleaning_time`;

        const result = await pool.query(query, values);
        res.json(result.rows);

    } catch (error) {
        console.error('Ошибка при получении данных из orders:', error);
        res.status(500).json({message: 'Ошибка при получении данных о расписании'});
    }
});

// Получение детальной информации о заказе по ID
app.get('/order/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const query = `
            SELECT
                o.*,  -- Все поля из таблицы orders
                u.name AS cleaner_name,    -- Имя клинера
                u.surname AS cleaner_surname  -- Фамилия клинера
            FROM public.orders o
            LEFT JOIN public.users u ON o.cleaner_id = u.id  -- Используем LEFT JOIN, чтобы получить данные даже если cleaner_id NULL
            WHERE o.id = $1;
        `;
        const values = [orderId];

        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({message: 'Заказ не найден'});
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка при получении деталей заказа:', error);
        res.status(500).json({message: 'Ошибка при получении деталей заказа'});
    }
});

// Получение списка клинеров
app.get('/cleaners', async (req, res) => {
    try {
        const query = `
            SELECT id, name, surname
            FROM public.users
            WHERE role = 'cleaner'; -- Фильтруем только клинеров
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении списка клинеров:', error);
        res.status(500).json({ message: 'Ошибка при получении списка клинеров' });
    }
});

// Назначение клинера заказу
app.post('/assign-cleaner', async (req, res) => {
    const { orderId, cleanerId } = req.body;

    if (!orderId || !cleanerId) {
        return res.status(400).json({message: 'Необходимо указать orderId и cleanerId'});
    }

    try {
        // Вариант: Добавление cleaner_id в таблицу orders. (Простой вариант)
        const updateQuery = `
            UPDATE public.orders
            SET cleaner_id = $1  -- Добавляем  cleaner_id
            WHERE id = $2;
        `;
        const updateValues = [cleanerId, orderId];
        await pool.query(updateQuery, updateValues);
        res.json({message: 'Уборщик успешно назначен'});

        // Альтернатива: Создание новой таблицы order_cleaners
        // (Если вам нужно хранить много исполнителей или другие данные)
        // const insertQuery = `
        //     INSERT INTO public.order_cleaners (order_id, cleaner_id)
        //     VALUES ($1, $2);
        // `;
        // const insertValues = [orderId, cleanerId];
        // await pool.query(insertQuery, insertValues);
        // res.json({ message: 'Уборщик успешно назначен' });

    } catch (error) {
        console.error('Ошибка при назначении уборщика:', error);
        res.status(500).json({message: 'Ошибка при назначении уборщика'});
    }
});

app.listen(port, () => {
    console.log(`Сервер routelist_api запущен на порту ${port}`);
});