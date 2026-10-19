/**
 * Script de création de la base de données et configuration de l'utilisateur applicatif
 * Commande : npm run db:create
 */
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_NAME = process.env.DB_NAME || 'tui_masterdata_prod';
const DB_USER = process.env.DB_USER || 'md_app';
const DB_PASSWORD = process.env.DB_PASSWORD || 'StrongAppPassword2026!';

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

async function createDatabase() {
  assertSafeDatabaseTarget(DB_NAME);

  console.log('================================================================');
  console.log('🛠️  CRÉATION DE LA BASE — TUI MASTER DATA IA');
  console.log('================================================================');
  console.log(`📡 Cible MySQL : ${DB_HOST}:${DB_PORT}`);
  console.log(`📦 Base visée   : ${DB_NAME}`);
  console.log(`👤 Utilisateur applicatif à configurer : ${DB_USER}`);

  let rootConnection = null;

  try {
    rootConnection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: 'root',
      password: '',
      multipleStatements: true
    });
    console.log('✅ Connexion root à MySQL réussie.');
  } catch (err) {
    console.error('❌ Impossible de se connecter à MySQL en tant que root :', err.message);
    console.error('👉 Vérifiez que MySQL (XAMPP ou service local) est démarré sur le port ' + DB_PORT);
    process.exit(1);
  }

  try {
    // 1. Création de la base si elle n'existe pas
    console.log(`\n[1/2] Création de la base de données \`${DB_NAME}\`...`);
    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`  ✓ Base de données \`${DB_NAME}\` prête (utf8mb4_unicode_ci).`);

    // 2. Configuration de l'utilisateur applicatif md_app
    console.log(`\n[2/2] Configuration des droits de l'utilisateur \`${DB_USER}\`...`);
    try {
      await rootConnection.query(`CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}'`);
      await rootConnection.query(`CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}'`);
      await rootConnection.query(`CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}'`);

      // Mettre à jour le mot de passe au cas où l'utilisateur existe déjà
      await rootConnection.query(`ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}'`);
      await rootConnection.query(`ALTER USER '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}'`);
      await rootConnection.query(`ALTER USER '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}'`);

      // Attribution stricte des droits DML sur la base tui_masterdata_prod uniquement
      await rootConnection.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost'`);
      await rootConnection.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1'`);
      await rootConnection.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON \`${DB_NAME}\`.* TO '${DB_USER}'@'%'`);
      await rootConnection.query('FLUSH PRIVILEGES');

      console.log(`  ✓ Droits SELECT, INSERT, UPDATE, DELETE accordés à \`${DB_USER}\` sur \`${DB_NAME}\`.*`);
    } catch (privErr) {
      console.error('\n❌ ERREUR LORS DE LA CONFIGURATION DES PRIVILÈGES MYSQL :');
      console.error(`Détail : ${privErr.message}`);
      console.error('\n👉 Si la table système mysql.db est corrompue dans votre environnement XAMPP,');
      console.error('veuillez exécuter manuellement la commande suivante dans phpMyAdmin (onglet SQL en tant que root) :\n');
      console.error('----------------------------------------------------------------');
      console.error(`CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';`);
      console.error(`GRANT SELECT, INSERT, UPDATE, DELETE ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';`);
      console.error(`GRANT SELECT, INSERT, UPDATE, DELETE ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';`);
      console.error('FLUSH PRIVILEGES;');
      console.error('----------------------------------------------------------------\n');
    }

    console.log('\n================================================================');
    console.log('✅ BASE DE DONNÉES CRÉÉE AVEC SUCCÈS !');
    console.log(`Prochaine étape : exécuter 'npm run migrate' pour appliquer le schéma.`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Erreur lors de la création de la base :', err.message);
    process.exit(1);
  } finally {
    if (rootConnection) {
      await rootConnection.end();
    }
  }
}

if (require.main === module) {
  createDatabase();
}

module.exports = { createDatabase };
