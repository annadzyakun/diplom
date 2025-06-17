<?php

// Разрешить запросы с определенного домена (РЕКОМЕНДУЕТСЯ - ЗАМЕНИТЕ!)
$allowedOrigin = "http://localhost";  // ЗАМЕНИТЕ ЭТИМ АДРЕСОМ ВАШЕГО САЙТА
// $allowedOrigin = "https://www.example.com";  // Пример HTTPS

// Разрешить запросы с любого домена (ТОЛЬКО ДЛЯ ОТЛАДКИ, НЕ ДЛЯ ПРОДАКШЕНА!)
// $allowedOrigin = "*";

header("Access-Control-Allow-Origin: " . $allowedOrigin);
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json; charset=utf-8'); // Явное указание кодировки

// Обработка предварительного запроса (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200); // Отправляем HTTP 200 OK
    exit;
}

// Логирование (для отладки)
error_log("Получен запрос к process_callback.php");

// Подключение к базе данных (ЗАМЕНИТЕ ДАННЫМИ СВОЕЙ БАЗЫ ДАННЫХ!)
$host = 'localhost';       // или адрес вашего хоста базы данных
$dbname = 'form_data'; // Имя вашей базы данных
$username = 'ANNA';    // Ваше имя пользователя базы данных
$password = 'ANNA';    // Ваш пароль базы данных

try {
    $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); // Установка режима выборки по умолчанию
} catch (PDOException $e) {
    error_log("Ошибка подключения к базе данных: " . $e->getMessage()); // Логирование ошибки подключения
    http_response_code(500);  // Отправляем HTTP 500 Internal Server Error
    echo json_encode(["status" => "error", "message" => "Ошибка подключения к базе данных"]); // Отправляем JSON
    exit;
}

// Получение данных из POST-запроса
$name = $_POST['name'] ?? '';
$phone = $_POST['phone'] ?? '';
$comment = $_POST['comment'] ?? '';

// Валидация данных (более строгая валидация)
$errors = [];

if (empty($name)) {
    $errors['name'] = "Имя обязательно для заполнения";
}

if (empty($phone)) {
    $errors['phone'] = "Телефон обязателен для заполнения";
} elseif (!preg_match('/^[0-9\+\(\)\s-]{7,}$/', $phone)) { // Минимальная проверка формата телефона
    $errors['phone'] = "Неверный формат телефона";
}

if (!empty($errors)) {
    http_response_code(400); // Отправляем HTTP 400 Bad Request
    echo json_encode(["status" => "error", "message" => "Ошибка валидации", "errors" => $errors]); // Отправляем JSON
    error_log("Ошибка валидации данных: " . json_encode($errors));
    exit;
}

// Подготовка SQL-запроса
$sql = "INSERT INTO public.callback_requests (name, phone, comment) VALUES (:name, :phone, :comment)";
$stmt = $pdo->prepare($sql);

// Привязка параметров
$stmt->bindParam(':name', $name);
$stmt->bindParam(':phone', $phone);
$stmt->bindParam(':comment', $comment);

// Выполнение запроса
try {
    $stmt->execute();
    http_response_code(200); // Отправляем HTTP 200 OK
    echo json_encode(["status" => "success", "message" => "Ваш запрос успешно отправлен! Мы свяжемся с вами в ближайшее время."]); // Отправляем JSON
    error_log("Успешно добавлен запрос в базу данных: Name=" . $name . ", Phone=" . $phone);

} catch (PDOException $e) {
    error_log("Ошибка при сохранении данных: " . $e->getMessage());
    http_response_code(500); // Отправляем HTTP 500 Internal Server Error
    echo json_encode(["status" => "error", "message" => "Ошибка при сохранении данных в базе данных"]); // Отправляем JSON
}

// Закрытие соединения (необязательно, PDO закрывает соединение при уничтожении объекта)
$pdo = null;

exit;  // Важно завершить выполнение скрипта
?>