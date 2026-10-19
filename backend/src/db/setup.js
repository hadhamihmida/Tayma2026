/**
 * Orchestrateur de configuration complète de la base de données
 * Enchaîne db:create -> migrate -> bootstrap:admin
 */
const { createDatabase } = require('./create_db');
const { runMigrations } = require('./migrate');
const { bootstrapAdmin } = require('./bootstrap_admin');

async function setupDatabase() {
  console.log('================================================================');
  console.log('🚀 DÉMARRAGE DE L\'INITIALISATION COMPLÈTE DE LA BASE DE DONNÉES');
  console.log('================================================================\n');

  await createDatabase();
  await runMigrations();
  await bootstrapAdmin();

  console.log('\n================================================================');
  console.log('✨ CONFIGURATION COMPLÈTE TERMINÉE AVEC SUCCÈS');
  console.log('================================================================\n');
}

if (require.main === module) {
  setupDatabase().catch(err => {
    console.error('Erreur globale setupDatabase :', err);
    process.exit(1);
  });
}

module.exports = { setupDatabase };
