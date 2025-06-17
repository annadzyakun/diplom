const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 3005; // Изменено на 3005







app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'form_data',
    password: 'ANNA',
    port: 5432,
});

// Получение всех заказов с фильтрацией
app.get('/all-orders', async (req, res) => {
    try {
        const { startDate, endDate, employeeId } = req.query;

        let query = `
            SELECT
                o.*,
                u.name AS cleaner_name,
                u.surname AS cleaner_surname,
                TO_CHAR(o.cleaning_date, 'YYYY-MM-DD') AS formatted_cleaning_date
            FROM public.orders o
            LEFT JOIN public.users u ON o.cleaner_id = u.id
            WHERE 1=1  --  Упрощение добавления условий
        `;
        const values = [];

        if (startDate) {
            query += ` AND o.cleaning_date >= $${values.length + 1}`;
            values.push(startDate);
        }

        if (endDate) {
            query += ` AND o.cleaning_date <= $${values.length + 1}`;
            values.push(endDate);
        }

        if (employeeId) {
            query += ` AND o.cleaner_id = $${values.length + 1}`;
            values.push(employeeId);
        }

        query += ` ORDER BY o.cleaning_date DESC`; // Добавляем сортировку по дате
        const result = await pool.query(query, values);

          // Передаём отформатированную дату в response
        const orders = result.rows.map(order => ({
            ...order,
            cleaning_date: order.formatted_cleaning_date // Use formatted date
        }));
        res.json(orders);
    } catch (error) {
        console.error('Ошибка при получении данных из orders:', error);
        res.status(500).json({ message: 'Ошибка при получении данных о заказах' });
    }
});

// Получение детальной информации о заказе по ID
app.get('/order/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const query = `
            SELECT
                o.*,
                u.name AS cleaner_name,
                u.surname AS cleaner_surname,
                TO_CHAR(o.cleaning_date, 'YYYY-MM-DD') AS formatted_cleaning_date
            FROM public.orders o
            LEFT JOIN public.users u ON o.cleaner_id = u.id
            WHERE o.id = $1;
        `;
        const values = [orderId];

        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Заказ не найден' });
        }
        const order = result.rows[0];
        const formattedOrder = {
            ...order,
            cleaning_date: order.formatted_cleaning_date // Use formatted date
        };
        res.json(formattedOrder);
    } catch (error) {
        console.error('Ошибка при получении деталей заказа:', error);
        res.status(500).json({ message: 'Ошибка при получении деталей заказа' });
    }
});

// Получение списка сотрудников
app.get('/employees', async (req, res) => {
    try {
          const query = `
            SELECT id, name, surname
            FROM public.users
            WHERE role = 'cleaner' and name in ('Светлана', 'Ирина', 'Анна','Иван', 'Федор', 'Валентина') and surname in ( 'Симонова', 'Соловьева', 'Соловей','Смирнов', 'Мишин', 'Ветлицкая');
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении списка сотрудников:', error);
        res.status(500).json({ message: 'Ошибка при получении списка сотрудников' });
    }
});

app.listen(port, () => {
    console.log(`Сервер allorders_api запущен на порту ${port}`);
});