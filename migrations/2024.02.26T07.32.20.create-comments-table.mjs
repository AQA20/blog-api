import { handleAsyncError } from '../utils/handleErrors.js';

export const up = handleAsyncError(
  async ({ context: { sequelize, DataTypes } }) => {
    await sequelize.getQueryInterface().createTable('Comments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      status: {
        type: DataTypes.ENUM('Approved', 'Pending', 'Rejected', 'Trashed'),
        allowNull: false,
      },
      content: {
        type: DataTypes.STRING(1000),
        allowNull: false,
        validate: {
          len: [60, 1000], // Validates length between 60 and 1000 characters
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      articleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Articles',
          key: 'id',
        },
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
  await sequelize.getQueryInterface().dropTable('Comments');
});
