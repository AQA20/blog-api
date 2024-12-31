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
  const permissionsData = JSON.parse(permissionSamples);
  const processedRoleSamples = Object.entries(permissionsData).map(
    ([roleName]) => {
      const role = {};
      role.name = roleName;
      return role;
    },
  );
  await queryInterface.bulkInsert('Roles', processedRoleSamples);
});
export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.bulkDelete('Roles', null, {});
});
