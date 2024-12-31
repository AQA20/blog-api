import { migrator } from './umzug.js';

async function checkMigrationStatus() {
  try {
    const executedMigrations = await migrator.executed();
    console.log('Executed Migrations:', executedMigrations);

    const pendingMigrations = await migrator.pending();
    console.log('Pending Migrations:', pendingMigrations);
  } catch (error) {
    console.error('Error checking migration status:', error);
  }
}

checkMigrationStatus();
