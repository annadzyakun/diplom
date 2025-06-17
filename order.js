const express = require('express');
const {
    Pool
} = require('pg');
const cors = require('cors');
const QRCode = require('qrcode');
const path = require('path'); // Добавляем модуль path

const app = express();
const port = 3000;

// Настройка CORS (разрешаем запросы с любого источника - для разработки)
app.use(cors({
    origin: '*' // !!! В продакшене замените на конкретный домен вашего сайта !!!
}));

app.use(express.json()); // Для обработки JSON в теле запроса
app.use(express.static('public')); //  Указываем папку для статических файлов

// Настройки подключения к PostgreSQL
const pool = new Pool({
    user: 'postgres', // Имя пользователя PostgreSQL
    host: 'localhost', // Или адрес вашего сервера PostgreSQL
    database: 'form_data', // Имя вашей базы данных
    password: 'ANNA', // Пароль пользователя PostgreSQL
    port: 5432,
});

// Проверка подключения к базе данных (добавлено для отладки)
pool.connect()
    .then(() => {
        console.log('Подключение к PostgreSQL успешно установлено!');
    })
    .catch(err => {
        console.error('Ошибка подключения к PostgreSQL:', err);
    });


// API-маршрут для создания клиента
app.post('/customers', async (req, res) => {
    try {
        const {
            surname,
            name,
            patronymic,
            phone,
            email,
            address
        } = req.body;

        console.log("Получен запрос /customers с данными:", {
            surname,
            name,
            patronymic,
            phone,
            email,
            address
        });

        // Выполняем запрос к базе данных для создания нового клиента
        const query = `
            INSERT INTO customers (surname, name, patronymic, phone, email, address)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id;
        `;

        const values = [surname, name, patronymic, phone, email, address];

        const result = await pool.query(query, values);
        const customerId = result.rows[0].id;

        console.log(`Клиент создан с ID: ${customerId}`);
        res.status(201).json({
            message: 'Клиент успешно создан',
            customerId: customerId
        });
    } catch (error) {
        console.error('Ошибка при создании клиента:', error);
        res.status(500).json({
            message: 'Ошибка при создании клиента: ' + error.message
        }); // Включаем сообщение об ошибке
    }
});

// API-маршрут для сохранения заказа
app.post('/orders', async (req, res) => {
    try {
        const {
            square,
            cleaningType,
            periodicity,
            cleaningDate,
            cleaningTime,
            additionalOptions,
            orderComment,
            customerId,
            totalCost
        } = req.body;

        console.log("Получен запрос /orders с данными:", req.body);
        console.log("req.body.totalCost:", req.body.totalCost); // Проверяем, что приходит

        // Преобразуем totalCost в число
        const parsedTotalCost = parseFloat(totalCost); // Используем parseFloat для десятичных чисел
        if (isNaN(parsedTotalCost)) {
            console.error("Некорректное значение totalCost:", totalCost);
            return res.status(400).json({
                message: "Некорректное значение totalCost"
            });
        }

        // Преобразуем totalCost в целое число (без округления!)
        const totalCostInteger = Math.trunc(parsedTotalCost);

        // Преобразуем additionalOptions в JSON-строку
        const parsedAdditionalOptions = JSON.stringify(additionalOptions);

        // Формируем SQL-запрос
        let query;
        let values;

        if (periodicity) {
            query = `
                INSERT INTO orders (square, cleaning_type, periodicity, cleaning_date, cleaning_time, additional_options, order_comment, customer_id, total_cost)
                VALUES ($1::integer, $2, $3::text, $4, $5::time, $6, $7, $8, $9::integer)
                RETURNING id;
            `;
            values = [
                square,
                cleaningType,
                periodicity,
                cleaningDate,
                cleaningTime,
                parsedAdditionalOptions,
                orderComment,
                customerId,
                totalCostInteger
            ];
        } else {
            query = `
                INSERT INTO orders (square, cleaning_type, cleaning_date, cleaning_time, additional_options, order_comment, customer_id, total_cost)
                VALUES ($1::integer, $2, $3, $4, $5, $6, $7, $8::integer)
                RETURNING id;
            `;
            values = [
                square,
                cleaningType,
                cleaningDate,
                cleaningTime,
                parsedAdditionalOptions,
                orderComment,
                customerId,
                totalCostInteger
            ];
        }

        console.log("SQL Query:", query);
        console.log("SQL Values:", values);

        try {
            const result = await pool.query(query, values);
            const orderId = result.rows[0].id;
            console.log(`Заказ сохранен с ID: ${orderId}`);
            res.status(201).json({
                message: 'Заказ успешно сохранен',
                orderId: orderId
            });
        } catch (error) {
            console.error("Ошибка при сохранении заказа:", error);
            console.error("Значение parsedTotalCost:", parsedTotalCost);
            console.error("Значение totalCostInteger:", totalCostInteger);
            console.error("Трассировка стека:", error.stack); // Добавляем трассировку стека
            res.status(500).json({
                message: 'Ошибка при сохранении заказа: ' + error.message
            });
        }

    } catch (error) {
        console.error("Ошибка при сохранении заказа:", error);
        console.error("Трассировка стека:", error.stack); // Добавляем трассировку стека
        res.status(500).json({
            message: 'Ошибка при сохранении заказа: ' + error.message
        });
    }
});

// API endpoint для генерации QR-кода
app.get('/api/generateQrCode/:orderId', async (req, res) => {
  const orderId = req.params.orderId;
  console.log(`Запрос на генерацию QR-кода для orderId: ${orderId}`);

  try {
    // Получите данные о заказе из базы данных (или откуда-то еще)
    const order = await getOrderFromDatabase(orderId);
    console.log(`Данные заказа для QR-кода:`, order);

    // Сгенерируйте данные для QR-кода (например, URL оплаты)
    const paymentUrl = generatePaymentUrl(order);
    console.log(`URL оплаты для QR-кода: ${paymentUrl}`);

    // Сгенерируйте QR-код
    const qrCode = await generateQrCode(paymentUrl); // Используйте вашу библиотеку QR-кодов

    res.json({ qrCode: qrCode });
  } catch (error) {
    console.error(`Ошибка при генерации QR-кода для orderId ${orderId}:`, error);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

// API endpoint для обновления статуса оплаты
app.post('/api/updatePaymentStatus/:orderId', async (req, res) => {
  const orderId = req.params.orderId;
  const isPaid = req.body.isPaid;
  // ✅ Вот здесь! Добавьте логирование для проверки типа и значения isPaid
  console.log(`[DEBUG] Получен isPaid: ${isPaid} (type: ${typeof isPaid})`);

  try {
    await updatePaymentStatusInDatabase(orderId, isPaid);
    res.json({ message: "Статус оплаты успешно обновлен" });
  } catch (error) {
    console.error(`Ошибка при обновлении статуса оплаты для orderId ${orderId}:`, error);
    res.status(500).json({ error: "Произошла ошибка при обновлении статуса оплаты" });
  }
});


// app.listen должен быть здесь, после определения всех маршрутов
app.listen(port, () => {
    console.log(`Сервер обработки заказов запущен на порту ${port}`);
});