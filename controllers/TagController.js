import Tag from '../models/Tag.js';
import ApiError from '../services/ApiError.js';
import Article from '../models/Article.js';
import resHandler from '../services/ResHandler.js';
import softDelete from '../utils/softDelete.js';
import S3Service from '../services/S3Client.js';
import Image from '../models/Image.js';
import db from '../config/databaseConnection.js';

export default class TagController {
  static #s3Service = new S3Service();
  static #pageSize = 5;

  static async getTags(req, res) {
    const query = req.query;
    const page = query.page ? parseInt(query.page) : 1;
    const pageSize = query?.limit
      ? parseInt(query.limit)
      : TagController.#pageSize;
    const offset = (page - 1) * pageSize;

    const sequelize = db.sequelize;

    // Get tags and order them by amount of articles
    // Sub query was used to avoid ALL_MYSQL_GROUP_BY constraint
    const tags = await sequelize.query(
      `
      SELECT
        Tags.id,
        Tags.name,
        articleCounts.totalCount AS articleCounts,
        (
          SELECT COUNT(DISTINCT Tags.id) as count
          FROM Tags 
          INNER JOIN ArticleTags ON Tags.id = ArticleTags.tagId 
          INNER JOIN Articles ON ArticleTags.articleId = Articles.id
          WHERE Tags.deletedAt IS NULL 
            AND ArticleTags.deletedAt IS NULL
            AND Articles.status = 'Approved'
        ) AS totalTagsCount
      FROM Tags
      INNER JOIN (
        SELECT 
          tagId, 
          COUNT(tagId) AS totalCount
        FROM ArticleTags
        INNER JOIN Articles ON ArticleTags.articleId = Articles.id
        WHERE ArticleTags.deletedAt IS NULL
          AND Articles.status = 'Approved'
        GROUP BY tagId
      ) AS articleCounts ON Tags.id = articleCounts.tagId
      WHERE Tags.deletedAt IS NULL
      ORDER BY articleCounts.totalCount DESC
      LIMIT :pageSize OFFSET :offset
    `,
      {
        type: sequelize.QueryTypes.SELECT,
        raw: true,
        nest: true,
        replacements: { pageSize, offset },
      },
    );

    // Handle tags if they were an empty array
    const totalPages = Math.ceil(tags[0]?.totalTagsCount / pageSize) || 1;

    const data = {
      currentPage: page,
      totalPages,
      tags,
    };

    return resHandler(200, data, res);
  }

  static async getTag(req, res) {
    const value = req.params.value;
    let query;
    if (isNaN(value)) {
      query = { name: value };
    } else {
      query = { id: value };
    }
    const tag = await Tag.findOne({
      where: { deletedAt: null, ...query },
      attributes: ['id', 'name'],
    });
    return resHandler(200, tag, res);
  }

  // Get all of the articles that belong to a specific tag id, ordered by views,shares or createdAt depending on user inputs
  // While we can achieve that using the sequelize ORM, I preferred to use raw query, AS it a bit complex query
  static async getTagWithArticles(req, res) {
    const sequelize = db.sequelize;
    const tagName = req.params.name;

    const query = req.query;
    // Make sure no values are set to 'undefined' or 'null'
    const badValues = ['undefined', 'null'];
    if (Object.values(query).some((value) => badValues.indexOf(value) !== -1)) {
      console.warn(query);
      throw new ApiError('Bad request unexpected value', 400);
    }

    // Find tag by name
    const tag = await Tag.findOne({
      where: { deletedAt: null, name: tagName },
      attributes: ['id'],
    });

    if (!tag) {
      throw new ApiError('Tag not found', 404);
    }

    // Get the tagId
    const tagId = tag.id;

    // Get optional queries
    const orderBy = query.orderBy || 'createdAt';
    const order = query.order || 'DESC';
    const page = query.page ? Number(req.query.page) : 1;

    // Paginate
    const pageSize = TagController.#pageSize;
    const offset = (page - 1) * pageSize;

    // tagId, orderBy, limit, offset and order variables are already being sanitized via Joi request middleware

    // COALESCE(views_count, 0) AS views_count, The COALESCE is used here to return 0 if the article doesn't have views_count
    // Otherwise it would return NULL and same for shares_count.

    // Then we're using INNER JOIN (to get the match values between the two tables) to join ArticleTags
    // Then after inner joining the ArticleTags we INNER JOIN the Tags table

    // Then we use LEFT JOIN (returns everything from the left table whether it has a match value or not)
    // to include the Articles even if they don't have shares or views

    // We are using aliases and GROUP BY along with COUNT(*) aggregate function in sub queries
    // to avoid theALL_MYSQL_GROUP_BY constraint and getting the total count of shares and views correctly

    const tagArticles = await sequelize.query(
      `
      SELECT
          Articles.id,
          Articles.title,
          Articles.description,
          Articles.thumbnailId,
          Articles.createdAt,
          Articles.slug,
          Tags.name AS tagName,
          Tags.id AS tagId,
          COALESCE(views_count, 0) AS Views,
          COALESCE(shares_count, 0) AS Shares,
          totalCount
      FROM Articles
      INNER JOIN ArticleTags ON Articles.id = ArticleTags.articleId
      INNER JOIN Tags ON ArticleTags.tagId = :tagId
      LEFT JOIN (
          SELECT articleId, COUNT(*) AS views_count 
          FROM Views 
          GROUP BY articleId
      ) AS v ON Articles.id = v.articleId
      LEFT JOIN (
          SELECT articleId, COUNT(*) AS shares_count 
          FROM Shares 
          GROUP BY articleId
      ) AS s ON Articles.id = s.articleId
      CROSS JOIN (
        SELECT COUNT(Articles.id) AS totalCount
        FROM Articles
        INNER JOIN ArticleTags ON Articles.id = ArticleTags.articleId
        WHERE ArticleTags.tagId = :tagId
      ) AS totalCount
      WHERE ArticleTags.tagId = :tagId AND Tags.id = :tagId AND ArticleTags.deletedAt IS NULL
      ORDER BY 
          CASE WHEN :orderBy = 'views' THEN views_count
               WHEN :orderBy = 'shares' THEN shares_count
               WHEN :orderBy = 'createdAt' THEN Articles.createdAt
          END ${order}
      LIMIT :pageSize OFFSET :offset;
      `,
      {
        replacements: { tagId, orderBy, pageSize, offset },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
        nest: true,
      },
    );

    // Fetch the featuredImg url from s3
    const tagArticlesWithImgs = await Promise.all(
      tagArticles.map(async (article) => {
        const { name } = await Image.findByPk(article.thumbnailId);
        const featuredImg = TagController.#s3Service.getFile(name);
        article.featuredImg = featuredImg;
        return article;
      }),
    );

    const data = {
      currentPage: page,
      totalPages: Math.ceil(tagArticles[0]?.totalCount / pageSize) || 1,
      articles: tagArticlesWithImgs,
    };
    return resHandler(200, data, res);
  }

  static async createTag(req, res) {
    const [tag] = await Tag.findOrCreate({
      where: {
        name: req.params.name,
      },
      paranoid: false, // Include soft deleted row
    });

    if (tag?.deletedAt) {
      await tag.restore();
    }
    return resHandler(201, tag, res);
  }
  static async updateTag(req, res, next) {
    const tagId = req.params.id;
    const tagName = req.params.name;
    await Tag.update(
      { name: tagName },
      {
        where: {
          id: tagId,
        },
      },
    );
    return resHandler(201, 'Tag updated successfully!', res);
  }

  static async deleteTag(req, res) {
    // Get the passed tagId from req.params object
    const tagId = req.params.id;
    // Soft delete tag
    const isDeleted = softDelete(tagId, Tag, [
      { model: Article, name: 'Articles' },
    ]);

    // Check if tag was successfully deleted
    if (isDeleted) {
      return resHandler(204, '', res);
    }

    // Otherwise throw an error
    throw new ApiError(
      'Tag cannot be deleted, it has one or more articles!',
      400,
    );
  }
}
