const app = require('./src/app');
const config = require('./src/config');
const { getDb, getMode } = require('./src/config/db');

async function startServer() {
  try {
    console.log('[BACKEND] Connexion à la base de données...');
    await getDb();
    console.log(`[BACKEND] Moteur persistant actif : ${getMode()}`);

    app.listen(config.PORT, () => {
      console.log(`================================================================`);
      console.log(`🚀 Master Data IA Backend démarré sur http://localhost:${config.PORT}`);
      console.log(`📡 Microservice IA ciblé sur ${config.AI_ENGINE_URL}`);
      console.log(`🔐 Sécurité RBAC & JWT active (Western / Nordic / Global / Admin)`);
      console.log(`================================================================`);
    });
  } catch (err) {
    console.error('[BACKEND] Échec critique du démarrage du serveur :', err);
    process.exit(1);
  }
}

startServer();
