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
        $stmt = $db->query("SELECT * FROM notes ORDER BY updated_at DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        $stmt = $db->prepare("INSERT INTO notes (title, content, color) VALUES (:title, :content, :color)");
        $stmt->execute([
            ':title' => $input['title'],
            ':content' => $input['content'] ?? '',
            ':color' => $input['color'] ?? '#6366f1'
        ]);
        echo json_encode(['id' => $db->lastInsertId(), 'message' => 'Nota criada']);
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) { echo json_encode(['error' => 'ID obrigatório']); break; }
        $stmt = $db->prepare("UPDATE notes SET title=:title, content=:content, color=:color, updated_at=datetime('now') WHERE id=:id");
        $stmt->execute([
            ':title' => $input['title'],
            ':content' => $input['content'] ?? '',
            ':color' => $input['color'] ?? '#6366f1',
            ':id' => $id
        ]);
        echo json_encode(['message' => 'Nota atualizada']);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) { echo json_encode(['error' => 'ID obrigatório']); break; }
        $db->prepare("DELETE FROM notes WHERE id=:id")->execute([':id' => $id]);
        echo json_encode(['message' => 'Nota removida']);
        break;
}
