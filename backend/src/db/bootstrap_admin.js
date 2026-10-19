/**
 * Script de création du compte administrateur initial
 * Commande : npm run bootstrap:admin
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_NAME = process.env.DB_NAME || 'tui_masterdata_prod';
const DB_USER = process.env.DB_USER || 'md_app';
const DB_PASSWORD = process.env.DB_PASSWORD || 'StrongAppPassword2026!';

const ADMIN_EMAIL = (process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@tui.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'InitialAdmin2026!';

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

async function bootstrapAdmin() {
  assertSafeDatabaseTarget(DB_NAME);

  console.log('================================================================');
  console.log('👑 AMORÇAGE DU COMPTE ADMINISTRATEUR — TUI MASTER DATA IA');
  console.log('================================================================');
  console.log(`📡 Cible MySQL : ${DB_HOST}:${DB_PORT}`);
  console.log(`📦 Base visée   : ${DB_NAME}`);
  console.log(`📧 Email Admin  : ${ADMIN_EMAIL}`);

  let connection = null;

  // Tentative 1 : Connexion avec l'utilisateur applicatif md_app
  // Tentative 2 : Repli avec root pour l'initialisation si nécessaire
  const connectionConfigs = [
    { host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: DB_NAME },
    { host: DB_HOST, port: DB_PORT, user: 'root', password: '', database: DB_NAME }
  ];

  for (const cfg of connectionConfigs) {
    try {
      connection = await mysql.createConnection(cfg);
      console.log(`✅ Connecté à MySQL (${DB_NAME} en tant que ${cfg.user})`);
      break;
    } catch (e) {
      // essayer le suivant
    }
  }

  if (!connection) {
    console.error('❌ Impossible de se connecter à la base de données.');
    process.exit(1);
  }

  try {
    // 1. Vérification si l'administrateur existe déjà
    const [existingUsers] = await connection.query(
      'SELECT id, email, role, status FROM users WHERE LOWER(email) = ?',
      [ADMIN_EMAIL]
    );

    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      console.log(`\nℹ Le compte Administrateur (${existing.email}) existe déjà (ID: ${existing.id}, Rôle: ${existing.role}).`);
      console.log('✓ Aucune modification effectuée.');
      return;
    }

    // 2. Création du mot de passe haché (bcrypt 12 rounds)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

    // 3. Insertion de l'administrateur
    const [insertResult] = await connection.query(
      `INSERT INTO users (
        email, 
        password_hash, 
        full_name, 
        role, 
        status, 
        is_active, 
        geographic_scope, 
        language, 
        must_change_password, 
        failed_attempts, 
        failed_login_attempts
      ) VALUES (?, ?, ?, 'ADMIN', 'active', 1, 'GLOBAL', 'fr', 1, 0, 0)`,
      [ADMIN_EMAIL, passwordHash, 'System Administrator']
    );

    const adminId = insertResult.insertId;
    console.log(`\n✓ Compte Administrateur créé avec succès (ID: ${adminId}) :`);
    console.log(`  • Email : ${ADMIN_EMAIL}`);
    console.log(`  • Rôle  : ADMIN`);
    console.log(`  • Statut: active (must_change_password = 1)`);

    // 4. Inscription dans la piste d'audit (audit_logs avec chaînage SHA-256)
    try {
      const [lastLog] = await connection.query(
        'SELECT row_hash FROM audit_logs ORDER BY id DESC LIMIT 1'
      );
      const prevHash = (lastLog.length > 0 && lastLog[0].row_hash) 
        ? lastLog[0].row_hash 
        : '0000000000000000000000000000000000000000000000000000000000000000';

      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const action = 'BOOTSTRAP_ADMIN_CREATED';
      const newData = JSON.stringify({ email: ADMIN_EMAIL, role: 'ADMIN', status: 'active' });

      const payload = [
        prevHash,
        adminId,
        action,
        timestamp,
        JSON.stringify({}),
        newData
      ].join('|');

      const rowHash = crypto.createHash('sha256').update(payload).digest('hex');

      await connection.query(
        `INSERT INTO audit_logs (
          actor_id, 
          user_id, 
          target_user_id, 
          action, 
          old_data, 
          new_data, 
          ip, 
          ip_address, 
          user_agent, 
          timestamp, 
          prev_hash, 
          row_hash
        ) VALUES (?, ?, ?, ?, ?, ?, '127.0.0.1', '127.0.0.1', 'CLI Bootstrap', ?, ?, ?)`,
        [adminId, adminId, adminId, action, JSON.stringify({}), newData, timestamp, prevHash, rowHash]
      );
      console.log('  ✓ Action consignée dans la table d\'audit immuable (SHA-256 chained).');
    } catch (auditErr) {
      console.warn('  ⚠️ Note : journalisation d\'audit initiale :', auditErr.message);
    }

    console.log('\n================================================================');
    console.log('🎉 COMPTE ADMINISTRATEUR INITIAL PRÊT !');
    console.log('Vous pouvez vous connecter à la plateforme.');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Erreur lors de l\'amorçage de l\'administrateur :', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  bootstrapAdmin();
}

module.exports = { bootstrapAdmin };
