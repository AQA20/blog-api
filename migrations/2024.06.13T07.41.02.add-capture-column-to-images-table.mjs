import { handleAsyncError } from '../utils/handleErrors.js';

export const up = handleAsyncError(
  async ({ context: { sequelize, DataTypes } }) => {
    await sequelize.getQueryInterface().addColumn('Images', 'capture', {
      type: DataTypes.STRING,
      unique: true,
      after: 'imageableType',
    });
  },
);

export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  await sequelize.getQueryInterface().removeColumn('Images', 'capture');
});
