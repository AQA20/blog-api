import { DataTypes, Model } from 'sequelize';
import db from '../config/databaseConnection.js';

const sequelize = db.sequelize;

class ArticleTag extends Model {}

ArticleTag.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    tagId: DataTypes.INTEGER,
    articleId: DataTypes.INTEGER,
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

ArticleTag.associate = (models) => {
  // Define associations
  ArticleTag.belongsTo(models.Tag, {
    foreignKey: 'tagId',
  });
  ArticleTag.belongsTo(models.Article, {
    foreignKey: 'articleId',
  });
};

export default ArticleTag;
