import { readFileAsync } from '../utils/fsUtils.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { handleAsyncError } from '../utils/handleErrors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fullPath = path.join(__dirname, '/samples/tags.json');

export const up = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  let tagSamples = await readFileAsync(fullPath);
  tagSamples = JSON.parse(tagSamples);
  const processedCategorySamples = tagSamples.tags.map((tagName) => {
    const tag = {};
    tag.name = tagName;
    return tag;
  });
  await queryInterface.bulkInsert('Tags', processedCategorySamples);
});
export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.bulkDelete('Tags', null, {});
});
