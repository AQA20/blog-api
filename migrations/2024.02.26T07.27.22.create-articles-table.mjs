import { handleAsyncError } from '../utils/handleErrors.js';

export const up = handleAsyncError(
  async ({ context: { sequelize, DataTypes } }) => {
    await sequelize.getQueryInterface().createTable('Articles', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(60),
        unique: true,
        allowNull: false,
        validate: {
          len: [40, 60],
        },
      },
      description: {
        type: DataTypes.STRING(300),
        allowNull: false,
        validate: {
          len: [120, 160],
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      thumbnailId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Images',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Categories',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      status: {
        type: DataTypes.ENUM('Approved', 'Pending', 'Rejected', 'Trashed'),
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
  },
);

export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  await sequelize.getQueryInterface().dropTable('Articles');
});
