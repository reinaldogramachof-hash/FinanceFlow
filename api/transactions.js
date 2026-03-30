import { initDB, parseBody, serializeRow, setCORS } from './_db.js';

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  let db;
  try {
    db = await initDB();
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao conectar ao banco de dados' });
  }

  const { id, month, type, category } = req.query;

  try {
    // ===== GET =====
    if (req.method === 'GET') {
      const conditions = [];
      const params = [];
      let i = 1;

      if (month)    { conditions.push(`TO_CHAR(date, 'YYYY-MM') = $${i++}`); params.push(month); }
      if (type)     { conditions.push(`type = $${i++}`);                      params.push(type); }
      if (category) { conditions.push(`category = $${i++}`);                  params.push(category); }

      const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

      const [rows, summary] = await Promise.all([
        db.query(`SELECT * FROM transactions ${where} ORDER BY date DESC, created_at DESC`, params),
        db.query(
          `SELECT
            COALESCE(SUM(CASE WHEN type='receita' THEN value ELSE 0 END), 0) AS income,
            COALESCE(SUM(CASE WHEN type='despesa' THEN value ELSE 0 END), 0) AS expense
           FROM transactions ${where}`,
          params
        )
      ]);

      return res.status(200).json({ data: rows.rows.map(serializeRow), summary: summary.rows[0] });
    }

    // ===== POST =====
    if (req.method === 'POST') {
      const { type: t, value, category: cat, description, date } = await parseBody(req);
      if (!t || !value || !cat || !date)
        return res.status(400).json({ error: 'Campos obrigatórios: type, value, category, date' });

      const r = await db.query(
        `INSERT INTO transactions (type, value, category, description, date)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [t, value, cat, description || '', date]
      );
      return res.status(201).json({ id: r.rows[0].id, message: 'Transação criada' });
    }

    // ===== PUT =====
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'ID obrigatório' });
      const { type: t, value, category: cat, description, date } = await parseBody(req);
      await db.query(
        `UPDATE transactions SET type=$1, value=$2, category=$3, description=$4, date=$5 WHERE id=$6`,
        [t, value, cat, description || '', date, id]
      );
      return res.status(200).json({ message: 'Transação atualizada' });
    }

    // ===== DELETE =====
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'ID obrigatório' });
      await db.query('DELETE FROM transactions WHERE id=$1', [id]);
      return res.status(200).json({ message: 'Transação removida' });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (e) {
    console.error('[transactions]', e);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
