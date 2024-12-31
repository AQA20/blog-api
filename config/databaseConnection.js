import Sequelize from 'sequelize';
import { env } from 'process';
import configuration from './databaseConfig.js';
import mysql2 from 'mysql2';
import { initAssociations } from '../models/associations.js';
import cls from 'cls-hooked';

const _env = env.NODE_ENV || 'development';
const config = configuration[_env];
const db = {};

// Fix "Please install mysql2 package manually".
if (config.dialect === 'mysql') {
  config.dialectModule = mysql2;
}

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config,
  );
}

db.sequelize = sequelize;
//Automatically pass transactions to all queries
const namespace = cls.createNamespace('default-namespace');
// eslint-disable-next-line react-hooks/rules-of-hooks
Sequelize.useCLS(namespace);
db.Sequelize = Sequelize;

// Test connection
db.sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch((error) => {
    const errorMessage = 'Unable to connect to the database';
    console.error(errorMessage, error);
    throw new Error(errorMessage);
  });

// Associate models
initAssociations()
  .then((models) => (db.models = models))
  .catch((error) => {
    const errorMessage = 'Unable to associate models';
    console.error(errorMessage, error);
    throw new Error(errorMessage);
  });

export default db;
