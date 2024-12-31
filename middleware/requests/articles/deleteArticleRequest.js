import Joi from 'joi';
import Article from '../../../models/Article.js';
import { existsInDatabase } from '../../../utils/joiCustomValidations.js';

const deleteArticleRequest = Joi.object({
  id: Joi.number()
    .required()
    .external(async (value, helpers) => {
      return existsInDatabase(Article, value, helpers, 'Invalid Article id');
    }),
});

const deleteArticleRequestMiddleware = async (req, res, next) => {
  try {
    const { error } = await deleteArticleRequest.validateAsync(req.params);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default deleteArticleRequestMiddleware;
