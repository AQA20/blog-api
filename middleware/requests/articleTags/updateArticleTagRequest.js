import Joi from 'joi';
import { existsInDatabase } from '../../../utils/joiCustomValidations.js';
import Article from '../../../models/Article.js';
import Tag from '../../../models/Tag.js';

const updateArticleTagRequest = Joi.object({
  articleId: Joi.number().external(async (value, helpers) => {
    if (!value) return;
    return existsInDatabase(Article, value, helpers, 'Invalid articleId');
  }),
  tagId: Joi.number().external(async (value, helpers) => {
    if (!value) return;
    return existsInDatabase(Tag, value, helpers, 'Invalid tagId');
  }),
});

const updateArticleTagRequestMiddleware = async (req, res, next) => {
  try {
    const { error } = await updateArticleTagRequest.validateAsync(req.body);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default updateArticleTagRequestMiddleware;
