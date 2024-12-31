import { handleAsyncError } from '../utils/handleErrors.js';

export const up = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();

  await sequelize.transaction(async (transaction) => {
    const users = await queryInterface.select(null, 'Users', {
      attributes: ['id'],
      order: [['id', 'ASC']],
    });
    const roles = await queryInterface.select(null, 'Roles', {
      attributes: ['id'],
      order: [['id', 'ASC']],
    });
    // Make sure there are enough roles for the users
    if (roles.length < users.length) {
      throw new Error(
        `Roles have ${roles.length} items which is less than the items in users ${users.length},
          please add ${users.length - roles.length} more roles or more`,
      );
    }

    const userRoles = users.map((user, index) => {
      const role = roles[index];
      return {
        roleId: role.id,
        userId: user.id,
      };
    });
    await queryInterface.bulkInsert('UserRoles', userRoles);
  });
});
export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.bulkDelete('UserRoles', null, {});
});
