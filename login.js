const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const cors = require('cors');
const session = require('express-session');
const multer = require('multer'); // Для загрузки файлов
const path = require('path');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json()); // Для обработки JSON в теле запроса

// Настройка сессии
app.use(session({
    secret: 'your-secret-key', // Замените на свой секретный ключ (желательно сложный)
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true в production (HTTPS)
        httpOnly: true, // Защита от XSS
        maxAge: 1000 * 60 * 60 * 24 // 24 часа (1 день)
    }
}));

// Подключение к базе данных PostgreSQL
const pool = new Pool({
    user: 'postgres',            // Замените на ваше имя пользователя PostgreSQL
    host: 'localhost',          // Хост базы данных
    database: 'form_data',    // Название вашей базы данных
    password: 'ANNA',          // Ваш пароль от базы данных
    port: 5432,                 // Порт PostgreSQL
});

// Проверка подключения к БД
pool.connect()
    .then(() => {
        console.log('Connected to PostgreSQL database!');
    })
    .catch(err => {
        console.error('Error connecting to PostgreSQL database:', err);
    });


// API для авторизации
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Необходимо указать логин и пароль' });
    }

    try {
        const query = 'SELECT * FROM public.users WHERE username = $1';
        const values = [username];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        const user = result.rows[0];

        // Сравнение паролей
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        // Успешная авторизация
        req.session.userId = user.id;
        req.session.userRole = user.role;

        // Перенаправление в зависимости от роли
        let redirectUrl;
        if (user.role === 'cleaner') {
            redirectUrl = 'profile.html';
        } else if (user.role === 'manager') {
            redirectUrl = 'profile_man.html';
        } else {
            return res.status(403).json({ message: 'Недопустимая роль' }); // Обработка других ролей
        }

        res.json({ message: 'Успешный вход', user: { id: user.id, role: user.role, redirect: redirectUrl } });

    } catch (error) {
        console.error('Ошибка авторизации:', error);
        res.status(500).json({message: 'Ошибка при входе в систему'});
    }
});

// API для получения данных пользователя (для profile.html)
app.get('/user/:id', async (req, res) => {
    const userId = req.params.id;

    if (!userId) {
        return res.status(400).json({ message: 'Не указан ID пользователя' });
    }

    try {
        const query = 'SELECT id, username, password, role, email, surname, phone, name, patronymic, dolzhnost, photo_path FROM public.users WHERE id = $1';
        const values = [userId];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const user = result.rows[0];
        res.json(user); // Возвращаем все данные пользователя

    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        res.status(500).json({ message: 'Ошибка при получении данных пользователя' });
    }
});

// Настройка Multer для сохранения файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Папка для сохранения изображений (создайте ее, если нет)
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
});

const upload = multer({ storage: storage });

// API для обновления данных пользователя (включая фото)
app.put('/user/:id', upload.single('photo'), async (req, res) => {
    const userId = req.params.id;
    console.log(`PUT /user/${userId} request received`);
    console.log('Request body:', req.body); // Смотрим, что в body
    console.log('Request file:', req.file); // Смотрим, что в file

    if (!userId) {
        return res.status(400).json({ message: 'Не указан ID пользователя' });
    }
    // Формируем части запроса UPDATE
    const updateValues = [];
    const setClauses = [];
    let paramIndex = 1;

    // Обрабатываем текстовые поля из req.body
    if (req.body.surname !== undefined) {
        setClauses.push(`surname = $${paramIndex}`);
        updateValues.push(req.body.surname);
        paramIndex++;
    }
    if (req.body.name !== undefined) {
        setClauses.push(`name = $${paramIndex}`);
        updateValues.push(req.body.name);
        paramIndex++;
    }
    if (req.body.patronymic !== undefined) {
        setClauses.push(`patronymic = $${paramIndex}`);
        updateValues.push(req.body.patronymic);
        paramIndex++;
    }
    if (req.body.phone !== undefined) {
        setClauses.push(`phone = $${paramIndex}`);
        updateValues.push(req.body.phone);
        paramIndex++;
    }
    if (req.body.email !== undefined) {
        setClauses.push(`email = $${paramIndex}`);
        updateValues.push(req.body.email);
        paramIndex++;
    }
    if (req.body.dolzhnost !== undefined) {
         setClauses.push(`dolzhnost = $${paramIndex}`);
        updateValues.push(req.body.dolzhnost);
        paramIndex++;
    }

    // Обрабатываем загрузку фото (если файл был загружен)
    let photoPath = null;
    if (req.file) {
        photoPath = '/uploads/' + req.file.filename;
        setClauses.push(`photo_path = $${paramIndex}`);
        updateValues.push(photoPath);
        paramIndex++;
    }
      if (setClauses.length === 0) {
            return res.status(200).json({ message: 'Данные не были изменены', user: {} }); // Ничего не обновляем
        }
    // userId
    updateValues.push(userId);

    const updateQuery = `
        UPDATE public.users
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, username, password, role, email, surname, phone, name, patronymic, dolzhnost, photo_path;
    `;

    try {
        const result = await pool.query(updateQuery, updateValues);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.status(200).json({
            message: 'Данные пользователя успешно обновлены',
            user: result.rows[0],
        });

    } catch (error) {
        console.error('Ошибка при обновлении данных пользователя:', error);
        res.status(500).json({ message: 'Ошибка при обновлении данных' });
    }
});

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));  //  <-  ВАЖНО:  ДОБАВЬТЕ ЭТУ СТРОКУ

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});