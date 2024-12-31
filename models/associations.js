import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelFiles = fs.readdirSync(path.join(__dirname, '.'));

modelFiles.splice(modelFiles.indexOf('associations.js'));

export const initAssociations = async () => {
  const models = {};
  try {
    for (const file of modelFiles) {
      const modelName = file.split('.')[0];
      const modelPath = await import(path.join(__dirname, `./${file}`));
      models[modelName] = modelPath.default;
    }

    // Call model associate function
    // To initialize relationships
    Object.values(models).forEach(
      (model) => model.associate && model.associate(models),
    );
    return models;
  } catch (error) {
    console.error('Error associating models', error);
    throw error;
  }
};
