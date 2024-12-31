import { DataTypes, Model } from 'sequelize';
import db from '../config/databaseConnection.js';

const sequelize = db.sequelize;

class Tag extends Model {
  static NAME_CH_MIN = 2;
  static NAME_CH_MAX = 20;
}

Tag.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
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

Tag.associate = (models) => {
  Tag.belongsToMany(models.Article, {
    through: 'ArticleTags',
  });

  Tag.hasMany(models.ArticleTag, {
    foreignKey: 'tagId',
    as: 'taggedArticles',
  });
};

// Hook to soft delete associated ArticleTag records when Tag is deleted
Tag.beforeDestroy(async (tag, options) => {
  await db.models.ArticleTag.update(
    { deletedAt: new Date() },
    { where: { tagId: tag.id }, transaction: options.transaction },
  );
});

export default Tag;
