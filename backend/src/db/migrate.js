/**
 * Script d'application des migrations de schéma de base de données
 * Commande : npm run migrate
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_NAME = process.env.DB_NAME || 'tui_masterdata_prod';

// RÈGLE ABSOLUE DE SÉCURITÉ : Sanctuarisation de masterdata_ia
function assertSafeDatabaseTarget(name) {
  const normalized = (name || '').toLowerCase().replace(/[\s_\-]+/g, '');
  if (normalized.includes('masterdataia')) {
    console.error('================================================================');
    console.error('⛔ ERREUR CRITIQUE DE SÉCURITÉ :');
    console.error(`Interdiction formelle de cibler la base "${name}".`);
    console.error('La base historique "masterdata_ia" est sanctuarisée et intouchable.');
    console.error('Veuillez utiliser DB_NAME=tui_masterdata_prod');
    console.error('================================================================');
    process.exit(1);
  }
}

async function runMigrations() {
  assertSafeDatabaseTarget(DB_NAME);

  console.log('================================================================');
  console.log('🚀 MIGRATIONS DE SCHÉMA — TUI MASTER DATA IA');
  console.log('================================================================');
  console.log(`📡 Cible MySQL : ${DB_HOST}:${DB_PORT}`);
  console.log(`📦 Base visée   : ${DB_NAME}`);

  let connection = null;

  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: 'root',
      password: '',
      database: DB_NAME,
      multipleStatements: true
    });
    console.log(`✅ Connexion à la base "${DB_NAME}" établie.`);
  } catch (err) {
    console.error(`❌ Échec de connexion à la base "${DB_NAME}" :`, err.message);
    console.error('👉 Veuillez vérifier que la base existe (lancez npm run db:create au préalable).');
    process.exit(1);
  }

  try {
    // 1. Table de versionnement schema_migrations
    console.log('\n[1/3] Vérification de la table de versionnement `schema_migrations`...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
        \`version\` VARCHAR(100) NOT NULL PRIMARY KEY,
        \`applied_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Table `schema_migrations` prête.');

    // 2. Vérification si la migration initiale a déjà été jouée
    const MIGRATION_VERSION = '001_initial_schema_14_tables';
    const [rows] = await connection.query(
      'SELECT version, applied_at FROM schema_migrations WHERE version = ?',
      [MIGRATION_VERSION]
    );

    if (rows.length > 0) {
      console.log(`  ℹ Migration "${MIGRATION_VERSION}" déjà appliquée le : ${rows[0].applied_at}`);
      console.log('  ✓ Schéma à jour (aucun changement requis).');
    } else {
      console.log(`\n[2/3] Application du schéma complet depuis backend/src/db/schema.sql...`);
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Fichier de schéma introuvable à : ${schemaPath}`);
      }

      const sqlContent = fs.readFileSync(schemaPath, 'utf8');

      // Exécution du schéma SQL
      await connection.query(sqlContent);

      // Enregistrement dans schema_migrations
      await connection.query(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, CURRENT_TIMESTAMP)',
        [MIGRATION_VERSION]
      );
      console.log(`  ✓ Migration "${MIGRATION_VERSION}" appliquée et enregistrée avec succès.`);
    }

    // 3. Vérification des tables et triggers créés
    console.log(`\n[3/3] Vérification du modèle de données :`);
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]).filter(t => t !== 'schema_migrations');
    console.log(`  ✓ ${tableNames.length} tables métier détectées dans "${DB_NAME}" :`);
    tableNames.forEach(t => console.log(`     • ${t}`));

    const [triggers] = await connection.query('SHOW TRIGGERS');
    const triggerNames = triggers.map(tr => tr.Trigger);
    console.log(`  ✓ ${triggerNames.length} triggers d'immuabilité détectés :`);
    triggerNames.forEach(tr => console.log(`     ⚡ ${tr}`));

    console.log('\n================================================================');
    console.log('🎉 TOUTES LES MIGRATIONS SONT APPLIQUÉES AVEC SUCCÈS !');
    console.log('Prochaine étape : exécuter "npm run bootstrap:admin"');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Erreur lors de l\'exécution des migrations :', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
