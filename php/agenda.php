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
        if (!empty($_GET['status'])) {
            $where .= " AND status = :status";
            $params[':status'] = $_GET['status'];
        }
        $stmt = $db->prepare("SELECT * FROM agenda WHERE $where ORDER BY date ASC, time ASC");
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        $stmt = $db->prepare("INSERT INTO agenda (title, date, time, type, status, description) VALUES (:title, :date, :time, :type, :status, :description)");
        $stmt->execute([
            ':title' => $input['title'],
            ':date' => $input['date'],
            ':time' => $input['time'] ?? '',
            ':type' => $input['type'] ?? 'evento',
            ':status' => $input['status'] ?? 'pendente',
            ':description' => $input['description'] ?? ''
        ]);
        echo json_encode(['id' => $db->lastInsertId(), 'message' => 'Evento criado']);
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) { echo json_encode(['error' => 'ID obrigatório']); break; }
        $stmt = $db->prepare("UPDATE agenda SET title=:title, date=:date, time=:time, type=:type, status=:status, description=:description WHERE id=:id");
        $stmt->execute([
            ':title' => $input['title'],
            ':date' => $input['date'],
            ':time' => $input['time'] ?? '',
            ':type' => $input['type'] ?? 'evento',
            ':status' => $input['status'] ?? 'pendente',
            ':description' => $input['description'] ?? '',
            ':id' => $id
        ]);
        echo json_encode(['message' => 'Evento atualizado']);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) { echo json_encode(['error' => 'ID obrigatório']); break; }
        $db->prepare("DELETE FROM agenda WHERE id=:id")->execute([':id' => $id]);
        echo json_encode(['message' => 'Evento removido']);
        break;
}
