import Joi from 'joi';
import Article from '../../../models/Article.js';
import { existsInDatabase } from '../../../utils/joiCustomValidations.js';

const restoreArticleRequest = Joi.object({
  id: Joi.number()
    .required()
    .external(async (value, helpers) => {
      return existsInDatabase(Article, value, helpers, 'Invalid Article id', {
        paranoid: false,
      });
    }),
});

const restoreArticleRequestMiddleware = async (req, res, next) => {
  try {
    const { error } = await restoreArticleRequest.validateAsync(req.params);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default restoreArticleRequestMiddleware;
