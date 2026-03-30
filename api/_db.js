// ===== DATABASE — PostgreSQL (Neon) =====
import pg from 'pg';

const { Pool, types } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    '[FinanceFlow] DATABASE_URL não configurado.\n' +
    'Crie um arquivo .env com: DATABASE_URL=postgres://...\n' +
    'Obtenha em: https://neon.tech (gratuito)'
  );
}

// Retorna colunas DATE como string 'YYYY-MM-DD' em vez de objeto Date
types.setTypeParser(1082, val => val);

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1
    });
    pool.on('error', err => {
      console.error('[DB] Erro no pool:', err.message);
    });
  }
  return pool;
}

export async function initDB() {
  const db = getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id          SERIAL PRIMARY KEY,
      type        VARCHAR(20)   NOT NULL,
      value       DECIMAL(12,2) NOT NULL,
      category    VARCHAR(100)  NOT NULL,
      description TEXT          DEFAULT '',
      date        DATE          NOT NULL,
      created_at  TIMESTAMPTZ   DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS agenda (
      id          SERIAL PRIMARY KEY,
      title       VARCHAR(200)  NOT NULL,
      date        DATE          NOT NULL,
      time        TIME,
      type        VARCHAR(50)   DEFAULT 'evento',
      status      VARCHAR(50)   DEFAULT 'pendente',
      description TEXT          DEFAULT '',
      created_at  TIMESTAMPTZ   DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id          SERIAL PRIMARY KEY,
      title       VARCHAR(200)  NOT NULL,
      content     TEXT          DEFAULT '',
      color       VARCHAR(20)   DEFAULT '#6366f1',
      created_at  TIMESTAMPTZ   DEFAULT NOW(),
      updated_at  TIMESTAMPTZ   DEFAULT NOW()
    )
  `);

  return db;
}

// Lê body JSON do stream da requisição
export function parseBody(req) {
  return new Promise(resolve => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let data = '';
    req.on('data', chunk => { data += chunk.toString(); });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
  });
}

// Converte campos Date para ISO string e normaliza TIME para HH:MM
export function serializeRow(row) {
  const out = { ...row };
  for (const key of Object.keys(out)) {
    if (out[key] instanceof Date) out[key] = out[key].toISOString();
    if (key === 'time' && out[key]) out[key] = String(out[key]).substring(0, 5);
  }
  return out;
}

export function setCORS(res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
