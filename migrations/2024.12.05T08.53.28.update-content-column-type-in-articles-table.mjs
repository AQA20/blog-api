import { handleAsyncError } from '../utils/handleErrors.js';

export const up = handleAsyncError(
  async ({ context: { sequelize, DataTypes } }) => {
    await sequelize.getQueryInterface().changeColumn('Articles', 'content', {
      type: DataTypes.TEXT('medium'),
    });
  },
);

export const down = handleAsyncError(
  async ({ context: { sequelize, DataTypes } }) => {
    await sequelize.getQueryInterface().changeColumn('Articles', 'content', {
      type: DataTypes.TEXT,
    });
  },
);
