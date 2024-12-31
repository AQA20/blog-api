import { handleAsyncError } from '../utils/handleErrors.js';

export const up = handleAsyncError(
  async ({ context: { sequelize, DataTypes } }) => {
    await sequelize.getQueryInterface().createTable('Views', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      articleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Articles',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      ipAddress: {
        type: DataTypes.STRING(45), // Supports both IPv4 and IPv6 addresses
        allowNull: false,
        validate: {
          isIP: true, // Ensures the value is a valid IP address
        },
      },
      uuid: {
        type: DataTypes.UUID,
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
    await sequelize.getQueryInterface().addIndex('Views', ['ipAddress']);
    await sequelize.getQueryInterface().addIndex('Views', ['uuid']);
  },
);

export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  await sequelize.getQueryInterface().dropTable('Views');
});
