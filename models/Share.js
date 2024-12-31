// article.js
import { DataTypes, Model } from 'sequelize';
import db from '../config/databaseConnection.js';

const sequelize = db.sequelize;

class Share extends Model {}

Share.init(
  {
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
  },
  {
    sequelize,
    timestamps: true,
    paranoid: true,
    // Optimize query performance and enforce data integrity.
    // The unique index on the combination of articleId, ipAddress, and uuid ensures that
    // no two records can exist with the same articleId and ipAddress for the same user (identified by uuid).
    indexes: [
      {
        unique: true,
        fields: ['articleId', 'ipAddress', 'uuid'],
      },
    ],
  },
);

Share.associate = (models) => {
  Share.belongsTo(models.Article, { foreignKey: 'articleId' });
};

export default Share;
