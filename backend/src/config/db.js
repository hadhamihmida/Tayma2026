const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const config = require('./index');

let pool = null;
let dbMode = 'MYSQL';

// JSON columns that should always be parsed to objects if returned as string
const JSON_COLUMNS = new Set([
  'temporary_data',
  'risk_factors',
  'fraud_details',
  'ocr_extracted_data',
  'ocr_confidence',
  'details',
  'old_value',
  'new_value',
  'sap_idoc_payload'
]);

function parseJsonFields(row) {
  if (!row || typeof row !== 'object') return row;
  const parsed = { ...row };
  for (const col of Object.keys(parsed)) {
    if (JSON_COLUMNS.has(col) && typeof parsed[col] === 'string') {
      try {
        parsed[col] = JSON.parse(parsed[col]);
      } catch (e) {
        // keep as is if not valid JSON
      }
    }
  }
  return parsed;
}

// Convert PostgreSQL $1, $2 parameter placeholders into MySQL ? placeholders
function convertDollarParamsToQuestionMarks(sql) {
  return sql.replace(/\$(\d+)/g, '?');
}

async function getDb() {
  if (pool) return pool;

  try {
    pool = mysql.createPool({
      host: config.DB_HOST,
      port: config.DB_PORT,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      charset: 'utf8mb4'
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log(`[DB] Connecté avec succès à MySQL (${config.DB_NAME} sur ${config.DB_HOST}:${config.DB_PORT})`);

    // Ensure required security tables and columns exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(500) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_token (token(191)),
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure users security columns exist
    try {
      await connection.query(`
        ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS locked_until DATETIME DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS last_login_at DATETIME DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS reset_token_expires_at DATETIME DEFAULT NULL;
      `);
    } catch (colErr) {
      // Ignore if columns already exist or MariaDB doesn't support IF NOT EXISTS in ALTER
    }

    connection.release();
    dbMode = 'MYSQL';
    return pool;
  } catch (err) {
    console.warn('[DB] Impossible de se connecter à MySQL, tentative de bascule vers le moteur de secours PGlite...', err.message);
    
    // Fallback to PGlite
    const { PGlite } = require('@electric-sql/pglite');
    const dataDir = path.join(__dirname, '../../data/pglite');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const pglite = new PGlite(dataDir);
    await pglite.waitReady;
    dbMode = 'PGLITE';
    console.log('[DB] Moteur de secours PostgreSQL 16 (PGlite WASM) actif');

    pool = {
      query: async (text, params = []) => {
        const res = await pglite.query(text, params);
        return {
          rows: (res.rows || []).map(parseJsonFields),
          rowCount: res.affectedRows || (res.rows ? res.rows.length : 0)
        };
      },
      exec: async (sql) => pglite.exec(sql)
    };
    return pool;
  }
}

async function query(text, params = []) {
  await getDb();

  if (dbMode === 'MYSQL') {
    const convertedSql = convertDollarParamsToQuestionMarks(text);
    
    // Ensure all JSON params are stringified if passed as objects/arrays
    const sanitizedParams = params.map(p => {
      if (p !== null && typeof p === 'object' && !(p instanceof Date)) {
        return JSON.stringify(p);
      }
      return p;
    });

    const [results, fields] = await pool.query(convertedSql, sanitizedParams);

    if (Array.isArray(results)) {
      return {
        rows: results.map(parseJsonFields),
        rowCount: results.length
      };
    } else {
      return {
        rows: [],
        rowCount: results.affectedRows || 0,
        insertId: results.insertId
      };
    }
  } else {
    return pool.query(text, params);
  }
}

async function exec(sql) {
  await getDb();
  if (dbMode === 'MYSQL') {
    const connection = await pool.getConnection();
    try {
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      for (const stmt of statements) {
        await connection.query(stmt);
      }
    } finally {
      connection.release();
    }
  } else {
    return pool.exec(sql);
  }
}

module.exports = {
  getDb,
  query,
  exec,
  getMode: () => dbMode
};
