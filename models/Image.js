// Image.js
import { DataTypes, Model } from 'sequelize';
import db from '../config/databaseConnection.js';

const sequelize = db.sequelize;

class Image extends Model {
  static USER = 'User';
  static ARTICLE = 'Article';
  static COMMENT = 'Comment';
}

Image.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    imageableId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    imageableType: {
      type: DataTypes.ENUM('article', 'comment', 'user'),
      allowNull: false,
    },
    capture: {
      type: DataTypes.STRING(255),
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date(),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date(),
    },
    deletedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    timestamps: true,
    paranoid: true,
  },
);

Image.associations = (models) => {
  Image.belongsTo(models.Article, {
    foreignKey: 'imageableId',
    constraints: false,
  });
  Image.belongsTo(models.User, {
    foreignKey: 'imageableId',
    constraints: false,
  });
  Image.belongsTo(models.Comment, {
    foreignKey: 'imageableId',
    constraints: false,
  });
};

export default Image;
