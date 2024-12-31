import { readFileAsync } from '../utils/fsUtils.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { handleAsyncError } from '../utils/handleErrors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fullPath = path.join(__dirname, '/samples/categories.json');

export const up = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  let categorySamples = await readFileAsync(fullPath);
  categorySamples = JSON.parse(categorySamples);
  const processedCategorySamples = categorySamples.categories.map(
    (categoryName) => {
      const category = {};
      category.name = categoryName;
      return category;
    },
  );
  await queryInterface.bulkInsert('Categories', processedCategorySamples);
});
export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.bulkDelete('Categories', null, {});
});
