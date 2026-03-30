import { initDB, setCORS } from './_db.js';

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  let db;
  try {
    db = await initDB();
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao conectar ao banco de dados' });
  }

  const year = req.query.year || String(new Date().getFullYear());

  try {
    const [monthly, byCategory, totals] = await Promise.all([
      db.query(
        `SELECT
          TO_CHAR(date, 'MM') AS month,
          COALESCE(SUM(CASE WHEN type='receita' THEN value ELSE 0 END), 0) AS income,
          COALESCE(SUM(CASE WHEN type='despesa' THEN value ELSE 0 END), 0) AS expense
         FROM transactions
         WHERE TO_CHAR(date, 'YYYY') = $1
         GROUP BY month ORDER BY month`,
        [year]
      ),
      db.query(
        `SELECT category, type,
          COALESCE(SUM(value), 0) AS total,
          COUNT(*) AS count
         FROM transactions
         WHERE TO_CHAR(date, 'YYYY') = $1
         GROUP BY category, type ORDER BY total DESC`,
        [year]
      ),
      db.query(
        `SELECT
          COALESCE(SUM(CASE WHEN type='receita' THEN value ELSE 0 END), 0) AS total_income,
          COALESCE(SUM(CASE WHEN type='despesa' THEN value ELSE 0 END), 0) AS total_expense,
          COUNT(*) AS total_transactions
         FROM transactions
         WHERE TO_CHAR(date, 'YYYY') = $1`,
        [year]
      )
    ]);

    return res.status(200).json({
      monthly: monthly.rows,
      by_category: byCategory.rows,
      totals: totals.rows[0],
      year
    });
  } catch (e) {
    console.error('[reports]', e);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
