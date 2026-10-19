const { setupDatabase } = require('./setup');

async function runSeed() {
  await setupDatabase();
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed, seedDatabase: runSeed };
