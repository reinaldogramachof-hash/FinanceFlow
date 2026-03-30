<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';
$db = getDB();

$year = $_GET['year'] ?? date('Y');

// Monthly summary for the year
$monthly = $db->prepare("SELECT
    strftime('%m', date) as month,
    SUM(CASE WHEN type='receita' THEN value ELSE 0 END) as income,
    SUM(CASE WHEN type='despesa' THEN value ELSE 0 END) as expense
    FROM transactions
    WHERE strftime('%Y', date) = :year
    GROUP BY month ORDER BY month");
$monthly->execute([':year' => $year]);
$monthlyData = $monthly->fetchAll(PDO::FETCH_ASSOC);

// By category
$byCategory = $db->prepare("SELECT category,
    SUM(value) as total,
    COUNT(*) as count,
    type
    FROM transactions
    WHERE strftime('%Y', date) = :year
    GROUP BY category, type ORDER BY total DESC");
$byCategory->execute([':year' => $year]);
$categoryData = $byCategory->fetchAll(PDO::FETCH_ASSOC);

// Totals
$totals = $db->prepare("SELECT
    SUM(CASE WHEN type='receita' THEN value ELSE 0 END) as total_income,
    SUM(CASE WHEN type='despesa' THEN value ELSE 0 END) as total_expense,
    COUNT(*) as total_transactions
    FROM transactions WHERE strftime('%Y', date) = :year");
$totals->execute([':year' => $year]);
$totalsData = $totals->fetch(PDO::FETCH_ASSOC);

echo json_encode([
    'monthly' => $monthlyData,
    'by_category' => $categoryData,
    'totals' => $totalsData,
    'year' => $year
]);
