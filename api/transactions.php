<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';
$db = getDB();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        $where = '1=1';
        $params = [];

        if (!empty($_GET['month'])) {
            $where .= " AND strftime('%Y-%m', date) = :month";
            $params[':month'] = $_GET['month'];
        }
        if (!empty($_GET['type'])) {
            $where .= " AND type = :type";
            $params[':type'] = $_GET['type'];
        }
        if (!empty($_GET['category'])) {
            $where .= " AND category = :category";
            $params[':category'] = $_GET['category'];
        }

        $stmt = $db->prepare("SELECT * FROM transactions WHERE $where ORDER BY date DESC, created_at DESC");
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Summary
        $stmtSum = $db->prepare("SELECT
            SUM(CASE WHEN type='receita' THEN value ELSE 0 END) as income,
            SUM(CASE WHEN type='despesa' THEN value ELSE 0 END) as expense
            FROM transactions WHERE $where");
        $stmtSum->execute($params);
        $summary = $stmtSum->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'data' => $rows,
            'summary' => $summary
        ]);
        break;

    case 'POST':
        $stmt = $db->prepare("INSERT INTO transactions (type, value, category, description, date) VALUES (:type, :value, :category, :description, :date)");
        $stmt->execute([
            ':type' => $input['type'],
            ':value' => $input['value'],
            ':category' => $input['category'],
            ':description' => $input['description'] ?? '',
            ':date' => $input['date']
        ]);
        echo json_encode(['id' => $db->lastInsertId(), 'message' => 'Transação criada']);
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) { echo json_encode(['error' => 'ID obrigatório']); break; }
        $stmt = $db->prepare("UPDATE transactions SET type=:type, value=:value, category=:category, description=:description, date=:date WHERE id=:id");
        $stmt->execute([
            ':type' => $input['type'],
            ':value' => $input['value'],
            ':category' => $input['category'],
            ':description' => $input['description'] ?? '',
            ':date' => $input['date'],
            ':id' => $id
        ]);
        echo json_encode(['message' => 'Transação atualizada']);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) { echo json_encode(['error' => 'ID obrigatório']); break; }
        $db->prepare("DELETE FROM transactions WHERE id=:id")->execute([':id' => $id]);
        echo json_encode(['message' => 'Transação removida']);
        break;
}
