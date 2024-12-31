import { readFileAsync } from '../utils/fsUtils.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { handleAsyncError } from '../utils/handleErrors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fullPath = path.join(__dirname, '/samples/permissions.json');

export const up = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  let permissionSamples = await readFileAsync(fullPath);
  permissionSamples = JSON.parse(permissionSamples);
  permissionSamples = Object.values(permissionSamples).flat();

  const permissions = permissionSamples.map((permissionName) => {
    const permission = {};
    permission.name = permissionName;
    return permission;
  });
  await queryInterface.bulkInsert('Permissions', permissions);
});
export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.bulkDelete('Permissions', null, {});
});
