import { seeder } from './umzug.js';

async function checkSeedingStatus() {
  try {
    const executedSeeders = await seeder.executed();
    console.log('Executed Seeders:', executedSeeders);

    const pendingSeeders = await seeder.pending();
    console.log('Pending Seeders:', pendingSeeders);
  } catch (error) {
    console.error('Error checking seeding status:', error);
  }
}

checkSeedingStatus();
