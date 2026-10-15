const mysql = require('mysql2/promise');
const config = require('./index');

let pool = null;

// JSON columns that should always be parsed to objects if returned as string
const JSON_COLUMNS = new Set([
  'currencies',
  'required_documents',
  'draft_data',
  'extracted_ocr_data',
  'ai_result',
  'details',
  'old_data',
  'new_data',
  'payload',
  'response',
  'setting_value',
  'temporary_data',
  'risk_factors',
  'fraud_details',
  'ocr_extracted_data',
  'ocr_confidence',
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

/**
 * Garde-fou de sécurité : vérification stricte, insensible à la casse et sans espaces
 * pour interdire absolument tout ciblage de l'ancienne base masterdata_ia.
 */
function assertSafeDatabaseTarget(dbName) {
  if (!dbName || typeof dbName !== 'string') {
    throw new Error('[DB Security] Nom de base de données non défini dans la configuration.');
  }

  const normalized = dbName.toLowerCase().replace(/[\s_\-]+/g, '');
  if (normalized.includes('masterdataia')) {
    console.error('================================================================');
    console.error('⛔ ERREUR CRITIQUE DE SÉCURITÉ :');
    console.error(`Interdiction formelle de se connecter à la base "${dbName}".`);
    console.error('La base historique "masterdata_ia" est sanctuarisée et intouchable.');
    console.error('Veuillez configurer DB_NAME=tui_masterdata_prod dans votre .env');
    console.error('================================================================');
    process.exit(1);
  }
}

async function getDb() {
  if (pool) return pool;

  assertSafeDatabaseTarget(config.DB_NAME);

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
    console.log(`[DB] Connecté avec succès à MySQL (${config.DB_NAME} en tant que ${config.DB_USER} sur ${config.DB_HOST}:${config.DB_PORT})`);
    connection.release();

    return pool;
  } catch (err) {
    console.error(`[DB] Erreur critique lors de la connexion à MySQL (${config.DB_NAME}):`, err.message);
    throw err;
  }
}

async function query(sql, params = []) {
  const db = await getDb();
  try {
    const [rows, fields] = await db.query(sql, params);

    // Format query results to match unified format
    if (Array.isArray(rows)) {
      const parsedRows = rows.map(r => parseJsonFields(r));
      return {
        rows: parsedRows,
        rowCount: parsedRows.length,
        fields
      };
    }

    return {
      rows: [],
      rowCount: rows.affectedRows || 0,
      insertId: rows.insertId,
      affectedRows: rows.affectedRows
    };
  } catch (err) {
    console.error('[DB Query Error]:', { sql: sql.substring(0, 150), message: err.message });
    throw err;
  }
}

module.exports = {
  getDb,
  query,
  assertSafeDatabaseTarget,
  parseJsonFields
};
