import { handleAsyncError } from '../utils/handleErrors.js';

export const up = handleAsyncError(
  async ({ context: { sequelize, DataTypes } }) => {
    await sequelize.getQueryInterface().changeColumn('Users', 'password', {
      allowNull: false,
      type: DataTypes.STRING(64), // Set max length as 64 to align with Joi validation
      validate: {
        len: [12, 64], // Enforce length constraint between 12 and 64 characters
      },
    });
  },
);

export const down = handleAsyncError(
  async ({ context: { sequelize, DataTypes } }) => {
    await sequelize.getQueryInterface().changeColumn('Users', 'password', {
      allowNull: false,
      type: DataTypes.STRING(255), // Revert to previous state
    });
  },
);
