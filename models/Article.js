// article.js
import { DataTypes, Model } from 'sequelize';
import db from '../config/databaseConnection.js';
import Metrics from '../services/Metrics.js';
import Image from './Image.js';
import ImageService from '../services/ImageService.js';

const sequelize = db.sequelize;

class Article extends Model {
  static APPROVED = 'Approved';
  static PENDING = 'Pending';
  static REJECTED = 'Rejected';
  static TRASHED = 'Trashed';
  static TITLE_CHAR_MIN = 50;
  static TITLE_CHAR_MAX = 100;
  static DES_CHAR_MIN = 160;
  static DES_CHAR_MAX = 300;
  static CT_WD_MIN = 140;
  static CT_WD_MAX = 5000;
}

Article.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(Article.TITLE_CHAR_MAX),
      unique: true,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(60),
      unique: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(Article.DES_CHAR_MAX),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    thumbnailId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Approved', 'Pending', 'Rejected', 'Trashed'),
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

Article.associate = (models) => {
  Article.belongsTo(models.User, {
    through: 'authorId',
    as: 'author',
  });
  Article.belongsToMany(models.Tag, {
    through: 'ArticleTags',
  });
  Article.belongsTo(models.Category, {
    foreignKey: 'categoryId',
  });
  Article.hasMany(models.Image, {
    foreignKey: 'imageableId',
    constraints: false,
    scope: {
      imageableType: 'ARTICLE',
    },
  });
  Article.hasMany(models.View, {
    foreignKey: 'articleId',
  });
  Article.hasMany(models.Share, {
    foreignKey: 'articleId',
  });

  Article.hasMany(models.ArticleTag, {
    foreignKey: 'articleId',
    as: 'articleTags',
  });
};

Article.afterFind(async (data, options) => {
  // Initialize the ImageService instance to handle image URL retrieval
  const imgService = new ImageService();

  /**
   * Helper function to attach image URLs to an article object
   * @param {Object} article - The article object
   */
  const attachImageUrls = async (article) => {
    // Skip if the article is not found or thumbnailId is not retrieved
    if (!article || !article.thumbnailId) return;

    if (article.Images) {
      // If the article includes its associated Images
      // Retrieve and set the featured image (thumbnail) URL
      const thumbnailUrl = imgService.getImageUrl(
        article.Images,
        article.thumbnailId,
      );
      article.setDataValue('featuredImg', thumbnailUrl);

      // Retrieve and set all image URLs for the article
      const allImageUrls = imgService.getImageUrls(article.Images);
      article.setDataValue('Images', allImageUrls);
    } else {
      // If Images are not preloaded, fetch the featured image URL by thumbnailId
      const imageable = await imgService.getImageableWithImgUrl(
        article.thumbnailId, // Thumbnail ID to fetch the image
        null,
        {
          type: Image.ARTICLE, // Image type (specific to the ImageService logic)
          imgLinkProperty: 'featuredImg', // The property to set the image URL
          paranoid: options.paranoid,
        },
      );

      // Attach the featured image URL to the article
      article.setDataValue('featuredImg', imageable.dataValues.featuredImg);
    }
  };

  // Handle the input data from the `afterFind` hook
  if (Array.isArray(data)) {
    // If multiple articles are retrieved, process each in parallel
    await Promise.all(data.map(attachImageUrls));
  } else {
    // If a single article is retrieved, process it directly
    await attachImageUrls(data);
  }
});

// Hook to clean up by soft deleting associated records when an Article is updated
Article.afterUpdate(async (article, options) => {
  if (!options.context) return;
  const transaction = options.transaction;
  const { categoryId, oldCategoryId } = options.context;
  // If categoryId is being updated
  if (categoryId) {
    // Check if old category can be deleted
    const categoriesCount = await Article.count({
      where: { categoryId: oldCategoryId },
      transaction,
    });
    // If no other articles set to this category
    if (categoriesCount === 0) {
      // Soft delete the old associated category
      await db.models.Category.destroy({
        where: { id: oldCategoryId },
        transaction,
      });
    }
  }
});

// Hook to clean up by soft deleting associated records when an Article is deleted
Article.afterDestroy(async (article, options) => {
  const transaction = options.transaction;

  // Check if tags can be deleted
  const tagDeletions = article.Tags.map(async (tag) => {
    const articleTagCount = await db.models.ArticleTag.count({
      where: { tagId: tag.id },
      transaction,
    });

    // If there was only one ArticleTag, which links the deleted Article with a Tag
    if (articleTagCount === 1) {
      // Soft delete associated ArticleTag and Tag
      await db.models.ArticleTag.destroy({
        where: { articleId: article.id },
        transaction,
      });
      return db.models.Tag.destroy({ where: { id: tag.id }, transaction });
    }
  });

  // Check if the category can be deleted
  let categoryDeletion;
  const categoryArticleCount = await Article.count({
    where: { categoryId: article.categoryId },
    transaction,
  });

  // If no other articles set to this category
  if (categoryArticleCount === 0) {
    categoryDeletion = db.models.Category.destroy({
      where: { id: article.categoryId },
      transaction,
    });
  }

  // Soft delete associated images
  const imageDeletions = article.Images.map(async (image) =>
    db.models.Image.destroy({ where: { id: image.id }, transaction }),
  );

  // Delete article metrics
  await Metrics.deleteMetrics(article.id, transaction);

  // Execute all deletions
  await Promise.all([...tagDeletions, categoryDeletion, ...imageDeletions]);
});

export default Article;
