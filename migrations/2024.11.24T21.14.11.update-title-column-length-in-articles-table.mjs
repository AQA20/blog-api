import { handleAsyncError } from '../utils/handleErrors.js';

export const up = handleAsyncError(
  async ({ context: { sequelize, DataTypes } }) => {
    await sequelize.getQueryInterface().changeColumn('Articles', 'Title', {
      type: DataTypes.STRING(100),
      validate: {
        len: [50, 100],
      },
    });
  },
);

export const down = handleAsyncError(
  async ({ context: { sequelize, DataTypes } }) => {
    await sequelize.getQueryInterface().changeColumn('Articles', 'Title', {
      type: DataTypes.STRING(60),
      validate: {
        len: [40, 60],
      },
    });
  },
);
