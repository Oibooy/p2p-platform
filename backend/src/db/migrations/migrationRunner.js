const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../../infrastructure/logger');

async function runMigrations() {
  const migrationsDir = path.join(__dirname);
  
  try {
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.js') && file !== 'migrationRunner.js')
      .sort();

    for (const file of migrationFiles) {
      const migration = require(path.join(migrationsDir, file));
      logger.info(`Running migration: ${file}`);
      await migration.up();
      logger.info(`Completed migration: ${file}`);
    }
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    throw error;
  }
}

module.exports = runMigrations;