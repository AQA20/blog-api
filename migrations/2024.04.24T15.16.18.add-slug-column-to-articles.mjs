import { handleAsyncError } from '../utils/handleErrors.js';

export const up = handleAsyncError(
  async ({ context: { sequelize, DataTypes } }) => {
    await sequelize.getQueryInterface().addColumn('Articles', 'slug', {
      type: DataTypes.STRING,
      unique: true,
      after: 'title',
    });
  },
);

export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  await sequelize.getQueryInterface().removeColumn('Articles', 'slug');
});
