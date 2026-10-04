const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { getDb, query } = require('../config/db');

async function seed() {
  console.log('[SEED] Démarrage du script de réinitialisation/seed...');
  await getDb();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Reset or ensure users
  const users = [
    { id: 1, email: 'contact@novatech-solutions.fr', full_name: 'Jean Dupont (Novatech Solutions)', role: 'VENDOR', scope: 'WESTERN' },
    { id: 2, email: 'requester.western@group.com', full_name: 'Sophie Martin (Acheteur IT France)', role: 'REQUESTER', scope: 'WESTERN' },
    { id: 3, email: 'requester.nordic@group.com', full_name: 'Lars Lindqvist (Acheteur Nordique)', role: 'REQUESTER', scope: 'NORDIC' },
    { id: 4, email: 'agent.global@group.com', full_name: 'Alexandre Dupont (Agent Master Data)', role: 'MASTER_DATA_AGENT', scope: 'GLOBAL' },
    { id: 5, email: 'manager.global@group.com', full_name: 'Claire Vasseur (Directrice Trésorerie)', role: 'MANAGER_APPROVAL', scope: 'GLOBAL' },
    { id: 6, email: 'admin@group.com', full_name: 'Marc Lefebvre (Administrateur Système)', role: 'ADMIN', scope: 'GLOBAL' }
  ];

  for (const u of users) {
    const existing = await query('SELECT id FROM users WHERE email = ?', [u.email]);
    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO users (id, email, password_hash, full_name, role, geographic_scope, is_active, failed_login_attempts)
         VALUES (?, ?, ?, ?, ?, ?, 1, 0)`,
        [u.id, u.email, passwordHash, u.full_name, u.role, u.scope]
      );
    } else {
      await query(
        `UPDATE users SET password_hash = ?, full_name = ?, role = ?, geographic_scope = ?, is_active = 1, failed_login_attempts = 0, locked_until = NULL WHERE email = ?`,
        [passwordHash, u.full_name, u.role, u.scope, u.email]
      );
    }
  }

  console.log('[SEED] Utilisateurs vérifiés et initialisés avec mot de passe universel: Password123!');
  console.log('[SEED] Seed terminé avec succès !');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[SEED] Erreur :', err);
      process.exit(1);
    });
}

module.exports = { seed };
