<!DOCTYPE html>
<html>
<head>
    <title>Список заказов</title>
    <style>
        table {
            border-collapse: collapse;
            width: 100%;
        }
        th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
    </style>
</head>
<body>
    <h1>Список заказов</h1>

    <form method="GET">
        <label for="dateFilter">Фильтр по дате:</label>
        <input type="date" id="dateFilter" name="date" value="<?php echo isset($_GET['date']) ? $_GET['date'] : ''; ?>">

        <label for="employeeFilter">Фильтр по сотруднику:</label>
        <select id="employeeFilter" name="cleaner">
            <option value="">Все сотрудники</option>
            <?php
            // Подключение к базе данных и получение списка сотрудников
            $host = 'localhost';
            $dbname = 'form_data';
            $user = 'postgres';
            $password = 'ANNA';
            $port = 5432;

            try {
                $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $user, $password);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

                $stmt = $pdo->query("SELECT id, surname FROM users");
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $selected = (isset($_GET['cleaner']) && $_GET['cleaner'] == $row['id']) ? 'selected' : '';
                    echo "<option value='" . $row['id'] . "' " . $selected . ">" . htmlspecialchars($row['surname']) . "</option>";
                }
            } catch (PDOException $e) {
                echo "Ошибка подключения к базе данных: " . $e->getMessage();
            }
            ?>
        </select>

        <button type="submit">Фильтр</button>
    </form>

    <table id="ordersTable">
        <thead>
            <tr>
                <th>Тип услуги</th>
                <th>Площадь</th>
                <th>Дата</th>
                <th>Время</th>
                <th>Сотрудник</th>
            </tr>
        </thead>
        <tbody>
            <?php
            // Получение и отображение данных о заказах
            try {
                $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $user, $password);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

                $query = "
                    SELECT
                        orders.id,
                        orders.square,
                        orders.cleaning_type,
                        orders.cleaning_date,
                        orders.cleaning_time,
                        users.surname AS cleaner_name
                    FROM
                        orders
                    LEFT JOIN
                        users ON orders.cleaner_id = users.id
                    WHERE 1=1
                ";

                $params = [];
                if (isset($_GET['date']) && $_GET['date'] != '') {
                    $query .= " AND cleaning_date = :date";
                    $params[':date'] = $_GET['date'];
                }
                if (isset($_GET['cleaner']) && $_GET['cleaner'] != '') {
                    $query .= " AND cleaner_id = :cleaner";
                    $params[':cleaner'] = $_GET['cleaner'];
                }

                $stmt = $pdo->prepare($query);
                $stmt->execute($params);

                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    echo "<tr>";
                    echo "<td>" . htmlspecialchars($row['cleaning_type']) . "</td>";
                    echo "<td>" . htmlspecialchars($row['square']) . "</td>";
                    echo "<td>" . htmlspecialchars($row['cleaning_date']) . "</td>";
                    echo "<td>" . htmlspecialchars($row['cleaning_time']) . "</td>";
                    echo "<td>" . htmlspecialchars($row['cleaner_name']) . "</td>";
                    echo "</tr>";
                }
            } catch (PDOException $e) {
                echo "<tr><td colspan='5'>Ошибка получения данных: " . $e->getMessage() . "</td></tr>";
            }
            ?>
        </tbody>
    </table>

</body>
</html>