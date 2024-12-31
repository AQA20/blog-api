import Article from '../models/Article.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Tag from '../models/Tag.js';
import ArticleTag from '../models/ArticleTag.js';
import Image from '../models/Image.js';
import Metrics from '../services/Metrics.js';
import db from '../config/databaseConnection.js';
import { Op } from 'sequelize';
import softDelete from '../utils/softDelete.js';
import { JSDOM } from 'jsdom';
import { DOMAIN, SECURE, SAME_SITE } from '../utils/constants.js';

export default class ArticleService {
  // Update article shares or views
  static async updateArticleMetrics(req, options) {
    const { articleId, model, metricName } = options;
    if (
      [articleId, model, metricName].some(
        (item) => !item || item === 'undefined',
      )
    ) {
      throw new Error(
        'Missing required options, make sure to pass all of the required options (articleId, metric, metricName)',
      );
    }

    // Default cookie
    const cookie = {
      httpOnly: true,
      secure: SECURE,
      sameSite: SAME_SITE,
      domain: DOMAIN,
      maxAge: 86400000, // One day In ms
    };
    // Get the user's ip address
    const ipAddress =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;

    // Get uuid from cookies if it was set previously
    const uuid = req.cookies?.[metricName];

    // Create a data object containing the necessary data to update a metric
    const data = { uuid, ipAddress, articleId };
    const metricUUID = await Metrics.updateMetric(model, data);
    return {
      metricUUID,
      cookie,
    };
  }

  // Fetch an article with the specified associated models
  static async fetchArticle(query, allStatuses = false) {
    const status = allStatuses ? {} : { status: Article.APPROVED };
    return await Article.findOne({
      where: { ...status, ...query },
      include: [
        {
          model: User, // Model
          required: true, // forces an inner join
          as: 'author', // Alias name
          attributes: ['id', 'name'], // Columns to include
        },
        { model: Category, attributes: ['id', 'name'] },
        {
          model: Tag,
          attributes: ['id', 'name'],
        },
        { model: Image, attributes: ['id', 'name'] },
      ],
    });
  }

  // Find all of the articles with the necessary relations sorted by data in specific order
  static async getAllArticles(options) {
    // Destructure values from options object
    const { search, orderBy, order, pageSize, offset, status } = options;
    let searchQuery = {};
    if (search) {
      searchQuery = {
        title: {
          [Op.like]: `${search}%`,
        },
      };
    }

    // Should not include deleted rows
    let paranoid = true;
    let articleStatus = status || Article.APPROVED;

    // If status is Trashed include deleted row be setting paranoid to false
    if (status === 'Trashed') {
      paranoid = false;
    }

    // Find and count the articles
    const { rows, count } = await Article.findAndCountAll({
      where: {
        status: articleStatus,
        ...searchQuery,
        thumbnailId: {
          [Op.ne]: null, // Where thumbnailId not equal to null
        },
      },
      paranoid,
      attributes: {
        exclude: ['content'], // Columns to exclude
        // Include a sub query to count views and shares for each article
        include: [
          [
            db.sequelize.literal(
              '(SELECT COUNT(*) FROM Views WHERE Views.articleId = Article.id)',
            ),
            'views',
          ],
          [
            db.sequelize.literal(
              '(SELECT COUNT(*) FROM Shares WHERE Shares.articleId = Article.id)',
            ),
            'shares',
          ],
        ],
      },

      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
          paranoid,
        },
        {
          model: Tag,
          attributes: ['id', 'name'],
          paranoid,
        },
        {
          model: User, // Model
          required: true, // forces an inner join
          as: 'author', // Alias name
          attributes: ['id', 'name'], // Columns to include
          paranoid,
        },
      ],
      offset,
      limit: pageSize,
      order: [[db.sequelize.literal(orderBy), order]],
      distinct: true, // Remove duplicate rows
    });

    return { articles: rows, count };
  }

  static async processHtmlImages(articleId, htmlContent) {
    const dom = new JSDOM(htmlContent);
    const images = [...dom.window.document.querySelectorAll('img')];

    const imageables = [];
    for (const img of images) {
      const capture = img.alt || null;
      const name = img.getAttribute('data-name');

      if (!name) {
        continue;
      }

      // Create the imageable record in the database
      const imageable = await Image.create({
        imageableId: articleId,
        imageableType: Image.ARTICLE,
        name,
        capture,
      });

      // Push image to the array
      imageables.push(imageable);
    }

    let sanitizedHtml = dom.serialize();
    sanitizedHtml = sanitizedHtml.replace(/<\/?html.*?>/g, ''); // Remove <html> and </html>
    sanitizedHtml = sanitizedHtml.replace(/<\/?head.*?>/g, ''); // Remove <head> and </head>
    sanitizedHtml = sanitizedHtml.replace(/<\/?body.*?>/g, ''); // Remove <body> and </body>
    sanitizedHtml = sanitizedHtml.replace(/<p>\s*<\/p>/g, ''); // Remove empty <p> tags

    return { sanitizedHtml, imageables };
  }

  static async deleteArticleTags(oldTags, newTags, transaction) {
    const tagsToRemove = oldTags.filter((tag) => !newTags.includes(tag.name));
    await Promise.all(
      tagsToRemove.map((tag) =>
        softDelete(
          tag.id,
          Tag,
          [{ model: Article, name: 'Articles' }],
          transaction,
        ),
      ),
    );
  }

  static async createArticleTags(tags, articleId, transaction) {
    for (const tagName of tags) {
      // Create a tag
      const [tag] = await Tag.findOrCreate({
        where: {
          name: tagName,
        },
        transaction,
      });

      // Create an article tag which associate articles to tags (many to many relationship)
      await ArticleTag.findOrCreate({
        where: {
          tagId: tag.id,
          articleId,
        },
        transaction,
      });
    }
  }

  static async revalidateNextjsArticle(slug) {
    const revalidationUrl = `${process.env.NEXT_JS_API_URL}/revalidate`;
    try {
      fetch(revalidationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: process.env.REVALIDATION_SECRET,
          slug,
        }),
      });
    } catch (error) {
      console.error(`Revalidation failed: ${error.message}`);
    }
  }
}
