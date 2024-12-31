import { readFileAsync } from '../utils/fsUtils.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { handleAsyncError } from '../utils/handleErrors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fullPath = path.join(__dirname, '/samples/permissions.json');

export const up = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  const permissionSamples = await readFileAsync(fullPath);
  const permissionData = JSON.parse(permissionSamples);

  // Combine permission lookups and insertions into a single transaction
  await sequelize.transaction(async (transaction) => {
    const rolePermissions = [];
    for (const [roleName, permissionNames] of Object.entries(permissionData)) {
      // Find role by name using findByPk (assuming roles have unique primary keys)
      const [role] = await queryInterface.select(null, 'Roles', {
        where: { name: roleName },
        attributes: ['id'],
      });
      for (const permissionName of permissionNames) {
        // Find permission by name using findByPk (assuming permissions have unique primary keys)
        const [permission] = await queryInterface.select(null, 'Permissions', {
          where: { name: permissionName },
          attributes: ['id'],
        });
        rolePermissions.push({
          roleId: role.id,
          permissionId: permission.id,
        });
      }
    }

    // Insert all role permissions in bulk after lookups
    await queryInterface.bulkInsert('RolePermissions', rolePermissions);
  });
});
export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.bulkDelete('RolePermissions', null, {});
});
