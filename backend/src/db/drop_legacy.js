/**
 * Nettoyage des anciennes tables de tui_masterdata_prod
 * Sécurité stricte : refuse si DB_NAME est masterdata_ia
 */
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_NAME = process.env.DB_NAME || 'tui_masterdata_prod';

function assertSafeDatabaseTarget(name) {
  const normalized = (name || '').toLowerCase().replace(/[\s_\-]+/g, '');
  if (normalized.includes('masterdataia')) {
    console.error('================================================================');
    console.error('⛔ ERREUR CRITIQUE DE SÉCURITÉ :');
    console.error(`Interdiction formelle de cibler la base "${name}".`);
    console.error('================================================================');
    process.exit(1);
  }
}

async function dropLegacyTables() {
  assertSafeDatabaseTarget(DB_NAME);

  console.log(`Connexion à MySQL pour nettoyer les anciennes tables de "${DB_NAME}"...`);
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: 'root',
    password: '',
    database: DB_NAME
  });

  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    const [tables] = await conn.query('SHOW TABLES');
    console.log(`Tables existantes trouvées (${tables.length}) :`);

    for (const t of tables) {
      const tableName = Object.values(t)[0];
      console.log(`  - Suppression de la table : ${tableName}`);
      await conn.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Nettoyage terminé avec succès.');
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  dropLegacyTables().catch(err => {
    console.error('Erreur nettoyage :', err);
    process.exit(1);
  });
}

module.exports = { dropLegacyTables };
