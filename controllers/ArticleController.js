import Article from '../models/Article.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Tag from '../models/Tag.js';
import ArticleTag from '../models/ArticleTag.js';
import Image from '../models/Image.js';
import View from '../models/View.js';
import Share from '../models/Share.js';
import resHandler from '../services/ResHandler.js';
import ApiError from '../services/ApiError.js';
import createSlug from '../utils/createArticleSlug.js';
import db from '../config/databaseConnection.js';
import getQuery from '../utils/getQuery.js';
import ArticleService from '../services/ArticleService.js';
import { Op } from 'sequelize';

export default class ArticleController {
  // Default page size
  static #pageSize = 5;
  // Related articles limit
  static #relatedArticlesLimit = 6;

  // Update article shares
  static async updateShareArticle(req, res) {
    const articleId = req.params.id;

    // Update article shares count and destructure the returned values
    const { metricUUID, cookie } = await ArticleService.updateArticleMetrics(
      req,
      {
        articleId,
        model: Share,
        metricName: 'shareUUID',
      },
    );
    // Set shareUUID cookie for later verification
    res.cookie('shareUUID', metricUUID, cookie);
    return resHandler(200, 'Article share counts have been updated', res);
  }

  static async getArticle(req, res, next) {
    const value = req.params.value;
    const allStatuses = req.query.allStatuses;
    // Determine whether id or slug was passed and return the corresponding query
    const query = getQuery(value, 'slug');

    const article = await ArticleService.fetchArticle(query, !!allStatuses);

    if (!article) {
      return next(new ApiError('Article is not found', 404));
    }

    // Update article views metric
    const { metricUUID, cookie } = await ArticleService.updateArticleMetrics(
      req,
      {
        articleId: article.id,
        model: View,
        metricName: 'viewUUID',
      },
    );
    // Set viewUUID cookie for later verification
    res.cookie('viewUUID', metricUUID, cookie);
    return resHandler(200, article, res);
  }

  // Get search article suggestions
  static async getSearchSuggestions(req, res) {
    const search = req.query.search;
    const articles = await Article.findAll({
      where: {
        status: Article.APPROVED,
        title: {
          [Op.like]: `${search}%`, // Match the beginning of string followed by anything
        },
      },
      limit: 5,
      attributes: ['title', 'slug'],
      order: [['createdAt', 'DESC']],
    });
    return resHandler(200, articles, res);
  }

  static async paginatedArticles(req) {
    const query = req.query;
    const badValues = ['undefined', 'null'];
    // Check if query has prohibited values
    if (Object.values(query).some((value) => badValues.indexOf(value) !== -1)) {
      throw new ApiError('Bad request unexpected value', 400);
    }
    // Get optional queries and assign default values if they were not provided
    const search = query.search || '';
    const orderBy = query.orderBy || 'createdAt';
    const order = query.order || 'DESC';
    const page = query.page ? Number(req.query.page) : 1;
    const pageSize = query?.limit
      ? Number(query.limit)
      : ArticleController.#pageSize;
    const status = query.status || Article.APPROVED;
    // Calculate the offset to be used in pagination
    const offset = (page - 1) * pageSize;

    // Get all articles and destructure returned values
    const { count, articles } = await ArticleService.getAllArticles({
      search,
      orderBy,
      order,
      pageSize,
      offset,
      status,
    });

    const totalPages = Math.ceil(count / pageSize) || 1;

    // Return articles data
    return {
      page,
      totalPages,
      hasNextPage: totalPages > page,
      articles,
    };
  }

  static async getArticles(req, res) {
    const data = await ArticleController.paginatedArticles(req);
    return resHandler(200, data, res);
  }

  // Get all article slugs
  static async getAllArticleSlugs(req, res) {
    // Find approved and only select the slug attribute
    const articles = await Article.findAll({
      where: { status: Article.APPROVED },
      attributes: ['slug'],
      order: [['createdAt', 'DESC']],
    });

    // Return articles
    return resHandler(200, articles, res);
  }

  static async createArticle(req, res) {
    // Set authorId which references the user_id and it's required
    req.body.authorId = req.user.id;

    // Set article publish state
    req.body.status = Article.PENDING;

    // Create an article slug using article's title
    req.body.slug = createSlug(req.body.title);

    // Use transaction so if something went wrong it rolls back all database
    // operations, note we're automatically pass transactions to all queries in
    // server/config/databaseConnection.js so we don't need to manually pass it
    // to each query.
    await db.sequelize.transaction(async (t) => {
      // Create article
      const article = await Article.create(req.body, {
        include: [
          { model: User, as: 'author', attributes: ['id', 'name'] },
          { model: Category, attributes: ['id', 'name'] },
          { model: Image, attributes: ['id', 'name'] },
          { model: Tag, required: true, attributes: ['id', 'name'] },
        ],
      });

      const { sanitizedHtml, imageables } =
        await ArticleService.processHtmlImages(article.id, req.body.content);
      // Update the article html content;
      article.content = sanitizedHtml;
      // Set first image as article thumbnail Image
      article.thumbnailId = imageables[0].id;
      await article.save();
      // Revalidate nextjs article so it reflects new updates
      await ArticleService.revalidateNextjsArticle(article.slug);
      return resHandler(201, article, res);
    });
  }

  static async updateArticle(req, res) {
    const articleId = req.params.id;
    // Use transaction so if something went wrong it rolls back all database
    // operations, note we're automatically pass transactions to all queries in
    // server/config/databaseConnection.js so we don't need to manually pass it
    // to each query.
    await db.sequelize.transaction(async (t) => {
      // Fetch the article instance first
      const existedArticle = await Article.findByPk(articleId, {
        include: Tag,
      });

      if (req.body.content) {
        const { sanitizedHtml } = await ArticleService.processHtmlImages(
          existedArticle.id,
          req.body.content,
        );
        // Update the article html content;
        req.body.content = sanitizedHtml;
      }

      // Save old tags for further processing
      const oldTags = existedArticle.Tags;
      const newTags = req.body.tags || [];
      if (newTags.length > 0) {
        // Create article tags
        await ArticleService.createArticleTags(newTags, existedArticle.id, t);
        // Delete unused tags
        await ArticleService.deleteArticleTags(oldTags, newTags, t);
      }

      // Save the old categoryId to pass it to the hooks
      const oldCategoryId = existedArticle.categoryId;
      // Update the article instance's fields
      existedArticle.set(req.body);
      // Save the updated instance with the context
      await existedArticle.save({
        context: {
          categoryId: req.body.categoryId,
          oldCategoryId,
        },
      });
    });

    // Refetch the updated article
    const article = await Article.findByPk(articleId, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name'] },
        { model: Category, attributes: ['id', 'name'] },
        { model: Image, attributes: ['id', 'name'] },
        { model: Tag, attributes: ['id', 'name'] },
      ],
    });

    // Revalidate nextjs article so it reflects new updates
    ArticleService.revalidateNextjsArticle(article.slug);

    // Return the updated article
    return resHandler(201, article, res);
  }

  static async updateArticleStatus(req, res) {
    // Update article status
    const article = await Article.findOne({ where: { id: req.params.id } });
    article.status = req.body.status;
    await article.save();
    // Revalidate nextjs article so it reflects new updates
    ArticleService.revalidateNextjsArticle(article.slug);
    return resHandler(201, 'Article status has been updated', res);
  }

  static async deleteArticle(req, res) {
    const id = req.params.id;

    // Use transaction so if something went wrong it rolls back all database
    // operations, note we're automatically pass transactions to all queries in
    // server/config/databaseConnection.js so we don't need to manually pass it
    // to each query.
    await db.sequelize.transaction(async (t) => {
      // Fetch article with associated tags, images, and category So the
      // beforeDestroy hook cleans up those associated models
      const article = await ArticleService.fetchArticle({ id }, true);
      article.status = Article.TRASHED;
      await article.save();
      await article.destroy();
    });

    // Return the response
    return resHandler(204, '', res);
  }

  static async restoreArticle(req, res) {
    const id = req.params.id;
    // Set paranoid to false to include soft deleted rows
    const paranoid = false;
    // Use transaction so if something went wrong it rolls back all database
    // operations, note we're automatically pass transactions to all queries in
    // server/config/databaseConnection.js so we don't need to manually pass it
    // to each query. However we need to pass it to nested functions that query
    // the database
    await db.sequelize.transaction(async (t) => {
      // Fetch the article with its associations, including soft-deleted rows
      const article = await Article.findByPk(id, {
        paranoid,
        include: [
          {
            model: User,
            as: 'author',
            required: true,
            paranoid,
            attributes: ['id', 'name'],
          },
          { model: Category, paranoid, attributes: ['id', 'name'] },
          { model: Tag, paranoid, attributes: ['id', 'name'] },
          { model: Image, paranoid, attributes: ['id', 'name'] },
          { model: Share, paranoid, attributes: ['id', 'articleId'] },
          { model: View, paranoid, attributes: ['id', 'articleId'] },
        ],
      });

      // Restore the article and set status to Pending
      await article.restore();
      article.status = Article.PENDING;
      await article.save();

      // Restore article's category
      await Category.restore({ where: { id: article.categoryId } });

      // Prepare all associated models for restoration (using Promise.all)
      const restorePromises = [];

      // Restore Shares, Views, and Images in parallel
      restorePromises.push(...article.Shares.map((share) => share.restore()));
      restorePromises.push(...article.Views.map((view) => view.restore()));
      restorePromises.push(...article.Images.map((image) => image.restore()));

      // For each tag, restore it and its associated ArticleTag
      for (const tag of article.Tags) {
        restorePromises.push(tag.restore()); // Restore the tag
        const articleTag = await ArticleTag.findOne({
          where: { tagId: tag.id, articleId: article.id },
        });
        if (articleTag) restorePromises.push(articleTag.restore()); // Restore the associated ArticleTag
      }

      // Wait for all restore operations to finish
      await Promise.all(restorePromises);

      // Return the restored article
      return resHandler(200, article, res);
    });
  }

  static async getRelatedArticles(req, res) {
    const { articleId, categoryId, tagIds } = req.validated;

    const STATUS_APPROVED = Article.APPROVED; // Only approved articles
    const RELATED_LIMIT = ArticleController.#relatedArticlesLimit; // Maximum number of related articles

    // Base query for category + approved status
    const baseQuery = {
      where: {
        categoryId,
        status: STATUS_APPROVED,
        id: { [Op.notIn]: [articleId] }, // Exclude the original article
      },
      order: [['createdAt', 'DESC']],
      limit: RELATED_LIMIT,
      attributes: {
        // Exclude the 'content' column
        exclude: ['content'],
      },
    };

    // Step 1: Find articles matching category and tags
    if (tagIds?.length) {
      baseQuery.include = [
        {
          model: Tag,
          where: { id: { [Op.in]: tagIds } },
          through: { attributes: [] }, // Don't include join table
        },
      ];
    }

    const tagMatchedArticles = await Article.findAll(baseQuery);
    let relatedArticles = [...tagMatchedArticles];
    // Exclude already added and original
    let excludedIds = [...relatedArticles.map(a => a.id), articleId];  

    // Step 2: If less than 6, find more articles from the same category
    if (relatedArticles.length < RELATED_LIMIT) {
      const moreFromCategory = await Article.findAll({
        where: {
          categoryId,
          status: STATUS_APPROVED,
          id: { [Op.notIn]: excludedIds },
        },
        order: [['createdAt', 'DESC']],
        limit: RELATED_LIMIT - relatedArticles.length,
        attributes: { exclude: ['content'] }, // Exclude 'content' column
      });

      relatedArticles = [...relatedArticles, ...moreFromCategory];
      excludedIds = [...excludedIds, ...moreFromCategory.map(a => a.id)];
    }

    // Step 3: If still less than 6, fetch latest approved articles globally
    if (relatedArticles.length < RELATED_LIMIT) {
      const latestArticles = await Article.findAll({
        where: {
          status: STATUS_APPROVED,
          id: { [Op.notIn]: excludedIds },
        },
        order: [['createdAt', 'DESC']],
        limit: RELATED_LIMIT - relatedArticles.length,
        attributes: { exclude: ['content'] }, // Exclude 'content' column
      });

      relatedArticles = [...relatedArticles, ...latestArticles];
    }

    // Return the list of related articles
    return resHandler(200, relatedArticles, res);
  }
}
