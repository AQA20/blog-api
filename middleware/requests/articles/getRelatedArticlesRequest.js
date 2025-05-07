import Joi from 'joi';
import Article from '../../../models/Article.js'
import Category from '../../../models/Category.js';
import Tag from '../../../models/Tag.js';
import { existsInDatabase } from '../../../utils/joiCustomValidations.js';

const getRelatedArticleRequest = Joi.object({
  articleId: Joi.number().required().external(async (value, helpers) => {
    return existsInDatabase(Article, value, helpers, 'Invalid Article id');
  }),
  categoryId: Joi.number().required().external(async (value, helpers) => {
    return existsInDatabase(Category, value, helpers, 'Invalid Category id');
  }),
  tagIds: Joi.alternatives().try(
    Joi.number().required().external(async (value, helpers) => {
      return existsInDatabase(Tag, value, helpers, 'Invalid Tag id');
    }),
    Joi.array().items(
      Joi.number().required().external(async (value, helpers) => {
        return existsInDatabase(Tag, value, helpers, 'Invalid Tag id');
      })
    ).optional()
  ).optional(),
});

const getRelatedArticlesRequestMiddleware = async (req, res, next) => {
  try {
    const { categoryId, tagIds } = req.query;
    const articleId = Number(req.params.articleId);

    // If tagIds is provided, normalize it to an array
    let tagIdsArray = [];

    if (tagIds) {
      if (tagIds.includes(',')) {
        // If multiple tagIds are passed (comma-separated), convert to an array
        tagIdsArray = tagIds.split(',').map(Number).filter(n => !isNaN(n));
      } else {
        // If only a single tagId is passed, wrap it in an array
        tagIdsArray = [Number(tagIds)].filter(n => !isNaN(n));
      }
    }

    // Validate the request body
    const dataToValidate = {
      articleId,
      categoryId: Number(categoryId),
      tagIds: tagIdsArray.length ? tagIdsArray : undefined,
    };

    await getRelatedArticleRequest.validateAsync(dataToValidate);
    req.validated = dataToValidate;

    next();
  } catch (error) {
    next(error);
  }
};

export default getRelatedArticlesRequestMiddleware;
