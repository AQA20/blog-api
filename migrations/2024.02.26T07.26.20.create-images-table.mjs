import { handleAsyncError } from '../utils/handleErrors.js';

export const up = handleAsyncError(
  async ({ context: { sequelize, DataTypes } }) => {
    await sequelize.getQueryInterface().createTable('Images', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      imageableId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      imageableType: {
        type: DataTypes.ENUM('Article', 'Comment', 'User'),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
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

    // Adding indexes
    await sequelize.getQueryInterface().addIndex('Images', ['imageableId']);
    await sequelize.getQueryInterface().addIndex('Images', ['imageableType']);
  },
);

export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  await sequelize.getQueryInterface().dropTable('Images');
});
