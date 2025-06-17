// app.js
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Подключаем маршруты из order.js
const orderRoutes = require('./order');
app.use('/', orderRoutes);

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});