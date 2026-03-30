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

  const { id, month, status } = req.query;

  try {
    // ===== GET =====
    if (req.method === 'GET') {
      const conditions = [];
      const params = [];
      let i = 1;

      if (month)  { conditions.push(`TO_CHAR(date, 'YYYY-MM') = $${i++}`); params.push(month); }
      if (status) { conditions.push(`status = $${i++}`);                    params.push(status); }

      const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
      const r = await db.query(
        `SELECT * FROM agenda ${where} ORDER BY date ASC, time ASC NULLS LAST`,
        params
      );
      return res.status(200).json(r.rows.map(serializeRow));
    }

    // ===== POST =====
    if (req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.title || !body.date)
        return res.status(400).json({ error: 'Título e data são obrigatórios' });

      const r = await db.query(
        `INSERT INTO agenda (title, date, time, type, status, description)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [body.title, body.date, body.time || null, body.type || 'evento', body.status || 'pendente', body.description || '']
      );
      return res.status(201).json({ id: r.rows[0].id, message: 'Evento criado' });
    }

    // ===== PUT =====
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'ID obrigatório' });
      const body = await parseBody(req);
      await db.query(
        `UPDATE agenda SET title=$1, date=$2, time=$3, type=$4, status=$5, description=$6 WHERE id=$7`,
        [body.title, body.date, body.time || null, body.type || 'evento', body.status || 'pendente', body.description || '', id]
      );
      return res.status(200).json({ message: 'Evento atualizado' });
    }

    // ===== DELETE =====
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'ID obrigatório' });
      await db.query('DELETE FROM agenda WHERE id=$1', [id]);
      return res.status(200).json({ message: 'Evento removido' });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (e) {
    console.error('[agenda]', e);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
