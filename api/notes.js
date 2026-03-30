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

  const { id } = req.query;

  try {
    // ===== GET =====
    if (req.method === 'GET') {
      const r = await db.query('SELECT * FROM notes ORDER BY updated_at DESC');
      return res.status(200).json(r.rows.map(serializeRow));
    }

    // ===== POST =====
    if (req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.title) return res.status(400).json({ error: 'Título é obrigatório' });

      const r = await db.query(
        `INSERT INTO notes (title, content, color) VALUES ($1, $2, $3) RETURNING id`,
        [body.title, body.content || '', body.color || '#6366f1']
      );
      return res.status(201).json({ id: r.rows[0].id, message: 'Nota criada' });
    }

    // ===== PUT =====
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'ID obrigatório' });
      const body = await parseBody(req);
      await db.query(
        `UPDATE notes SET title=$1, content=$2, color=$3, updated_at=NOW() WHERE id=$4`,
        [body.title, body.content || '', body.color || '#6366f1', id]
      );
      return res.status(200).json({ message: 'Nota atualizada' });
    }

    // ===== DELETE =====
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'ID obrigatório' });
      await db.query('DELETE FROM notes WHERE id=$1', [id]);
      return res.status(200).json({ message: 'Nota removida' });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (e) {
    console.error('[notes]', e);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
