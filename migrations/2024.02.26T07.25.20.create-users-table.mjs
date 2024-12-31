import { handleAsyncError } from '../utils/handleErrors.js';

export const up = handleAsyncError(
  async ({ context: { sequelize, DataTypes } }) => {
    await sequelize.getQueryInterface().createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING(60),
      },
      email: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
        validate: {
          isEmail: true, // Add email validation (optional)
        },
      },
      password: {
        allowNull: false,
        type: DataTypes.STRING(255),
      },
      createdAt: {
        allowNull: false,
        defaultValue: new Date(),
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        defaultValue: new Date(),
        type: DataTypes.DATE,
      },
      deletedAt: {
        type: DataTypes.DATE,
      },
    });
  },
);
export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  await sequelize.getQueryInterface().dropTable('Users');
});
