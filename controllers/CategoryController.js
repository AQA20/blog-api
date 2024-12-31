import Category from '../models/Category.js';
import resHandler from '../services/ResHandler.js';
import Article from '../models/Article.js';
import Tag from '../models/Tag.js';
import softDelete from '../utils/softDelete.js';
import ImageService from '../services/ImageService.js';
import getQuery from '../utils/getQuery.js';
import ApiError from '../services/ApiError.js';
import db from '../config/databaseConnection.js';

export default class CategoryController {
  static #imgService = new ImageService();

  // Get a category by name or id
  static async getCategory(req, res) {
    const value = req.params.value;
    // Determine whether id or name was passed and return the corresponding query
    const query = getQuery(value, 'name');

    // Find the category depends on the query
    const category = await Category.findOne({ where: { ...query } });

    // Return the response
    return resHandler(201, category, res);
  }

  // Get all of the categories
  static async getCategories(req, res) {
    // Fetch all categories from database
    const category = await Category.findAll({ limit: 16 });
    // Return the response
    return resHandler(200, category, res);
  }

  static async #getImgUrl(thumbnailId) {
    const imageableWithImgUrl =
      await CategoryController.#imgService.getImageableWithImgUrl(
        thumbnailId,
        null,
        { imgLinkProperty: 'featuredImg', type: 'ARTICLE' },
      );
    return imageableWithImgUrl;
  }

  // Get a category with all of it's articles
  static async getCategoryWithArticles(req, res, next) {
    // Get the categoryId url parameter
    const categoryId = req.params.id;
    // Find the category including it's articles
    const categoryArticles = await Article.findAll({
      where: { categoryId },
      attributes: ['id', 'title', 'description', 'thumbnailId'],
      include: [
        { model: Tag, attributes: ['id', 'name'] },
        { model: Category, attributes: ['id', 'name'] },
        { model: Category, attributes: ['id', 'name'] },
      ],
    });
    // Add the actual s3 image url for each article, await for all of the returning promises from map method
    const articlesWithFeaturedImgs = await Promise.all(
      categoryArticles.map(async (article) => {
        const imageableWithImgUrl = await CategoryController.#getImgUrl(
          article.thumbnailId,
        );
        article.setDataValue(
          'featuredImg',
          imageableWithImgUrl.dataValues.featuredImg,
        );
        return article;
      }),
    );

    // Return the response
    return resHandler(200, articlesWithFeaturedImgs, res);
  }

  // Get categories ordered by ones with most amount of articles
  // Using raw query with sub query to prevent the ONLY_FULL_GROUP_BY error
  static async getCategoriesWithArticles(req, res) {
    const sequelize = db.sequelize;
    const categoriesWithCounts = await sequelize.query(
      `SELECT 
        Categories.id,
        Categories.name,
        Articles.title,
        Articles.description,
        Articles.thumbnailId,
        articleCounts.totalCount
      FROM Categories
      INNER JOIN Articles ON Categories.id = Articles.categoryId
      INNER JOIN (
          SELECT categoryId, COUNT(*) AS totalCount
          FROM Articles
          GROUP BY categoryId
      ) AS articleCounts ON Categories.id = articleCounts.categoryId 
      WHERE Articles.deletedAt IS NULL 
      AND Articles.thumbnailId IS NOT NULL
      ORDER BY articleCounts.totalCount DESC LIMIT 2`,
      {
        type: sequelize.QueryTypes.SELECT,
        raw: true,
        nest: true,
      },
    );

    //Add the actual s3 image url for each article, await for all of the returning promises from map method
    const articlesWithFeaturedImgs = await Promise.all(
      categoriesWithCounts.map(async (article) => {
        const imageableWithImgUrl = await CategoryController.#getImgUrl(
          article.thumbnailId,
        );
        article.featuredImg = imageableWithImgUrl.dataValues.featuredImg;
        return article;
      }),
    );

    // Return the response
    return resHandler(200, articlesWithFeaturedImgs, res);
  }
  static async createCategory(req, res) {
    // If category is already exist then return it
    // Otherwise create a new category
    const [category] = await Category.findOrCreate({
      where: {
        name: req.params.name,
      },
      paranoid: false, // Include soft deleted rows
    });

    if (category?.deletedAt) {
      await category.restore();
    }
    // Return the response
    return resHandler(201, category, res);
  }
  static async updateCategory(req, res) {
    // Get the passed categoryId from req.params object
    const categoryId = req.params.id;
    // Get the passed categoryName from req.params object
    const categoryName = req.params.name;
    // Update the category
    await Category.update(
      { name: categoryName },
      {
        where: {
          id: categoryId,
        },
      },
    );
    // Return the response
    return resHandler(201, 'Category updated successfully!', res);
  }

  static async deleteCategory(req, res) {
    // Get the passed categoryId from req.params object
    const categoryId = req.params.id;
    // Soft delete category
    const isDeleted = softDelete(categoryId, Category, [
      { model: Article, name: 'Articles' },
    ]);

    // Check if category was successfully deleted
    if (isDeleted) {
      return resHandler(204, 'Category was successfully deleted!', res);
    }

    // Otherwise throw an error
    throw new ApiError(
      'Category cannot be deleted, it has one or more articles!',
      400,
    );
  }
}
