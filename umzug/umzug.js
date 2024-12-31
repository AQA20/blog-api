// umzug.mjs
import { Umzug, SequelizeStorage } from 'umzug';
import db from '../config/databaseConnection.js';
import { fileURLToPath } from 'url';
import path from 'path';

export const migrator = new Umzug({
  migrations: {
    glob: [
      '../migrations/*.mjs',
      { cwd: path.dirname(fileURLToPath(import.meta.url)) },
    ],
  },
  context: {
    sequelize: db.sequelize,
    DataTypes: db.Sequelize.DataTypes,
  },
  storage: new SequelizeStorage({
    sequelize: db.sequelize,
    modelName: db.sequelize.options.migrationStorageTableName,
  }),
});

export const seeder = new Umzug({
  migrations: {
    glob: [
      '../seeders/*.mjs',
      { cwd: path.dirname(fileURLToPath(import.meta.url)) },
    ],
  },
  context: {
    sequelize: db.sequelize,
    DataTypes: db.Sequelize.DataTypes,
  },
  storage: new SequelizeStorage({
    sequelize: db.sequelize,
    modelName: 'seeders',
  }),
});
