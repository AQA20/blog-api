import Joi from 'joi';
import DOMPurify from 'isomorphic-dompurify';
import { validateWordsLength } from '../../../utils/validations.js';
import { existsInDatabase } from '../../../utils/joiCustomValidations.js';
import Image from '../../../models/Image.js';
import Category from '../../../models/Category.js';
import Article from '../../../models/Article.js';

// Custom validation function to count the number of words
const wordsCount = (value, helpers) => {
  if (!validateWordsLength(value, Article.CT_WD_MIN, Article.CT_WD_MAX)) {
    return helpers.error(
      'Article content must be minimum of 300 words and max of 5000 words',
    );
  }
  return value;
};

// .custom() is designed for synchronous operations while .validateAsync() is used
// for asynchronous operations
const updateArticleRequest = Joi.object({
  title: Joi.string()
    .trim()
    .min(Article.TITLE_CHAR_MIN)
    .max(Article.TITLE_CHAR_MAX),
  description: Joi.string()
    .trim()
    .min(Article.DES_CHAR_MIN)
    .max(Article.DES_CHAR_MAX),
  // Used custom here as the operation is synchronous
  content: Joi.string()
    .custom(wordsCount)
    .custom((value) => {
      return DOMPurify.sanitize(value); // Sanitize HTML content
    }),
  // Used external here as the operation is asynchronous
  categoryId: Joi.number().external(async (value, helpers) => {
    if (!value) return;
    return existsInDatabase(Category, value, helpers, 'Invalid categoryId');
  }),
  // Used external here as the operation is asynchronous
  thumbnailId: Joi.number().external(async (value, helpers) => {
    if (!value) return;
    return existsInDatabase(Image, value, helpers, 'Invalid thumbnailId');
  }),
  tags: Joi.array().items(Joi.string().trim()).min(1).max(5),
});

const updateArticleRequestMiddleware = async (req, res, next) => {
  try {
    const { error } = await updateArticleRequest.validateAsync(req.body, {
      abortEarly: false,
    });
    if (error) {
      return next(error);
    }

    if (req.body.content) {
      // Replace empty p tags with br
      req.body.content = req.body.content.replace(/<p>\s*<\/p>/g, '');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default updateArticleRequestMiddleware;
