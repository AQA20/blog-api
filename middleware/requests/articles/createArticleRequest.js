import Joi from 'joi';
import DOMPurify from 'isomorphic-dompurify';
import { validateWordsLength } from '../../../utils/validations.js';
import { existsInDatabase } from '../../../utils/joiCustomValidations.js';
import Category from '../../../models/Category.js';
import Article from '../../../models/Article.js';

// Custom validation function to count the number of words
const wordsCount = (value, helpers) => {
  if (!validateWordsLength(value, Article.CT_WD_MIN, Article.CT_WD_MAX)) {
    return helpers.error(
      'Article content must be minimum of 140 words and max of 5000 words',
    );
  }
  return value;
};

const createArticleRequest = Joi.object({
  title: Joi.string()
    .trim()
    .min(Article.TITLE_CHAR_MIN)
    .max(Article.TITLE_CHAR_MAX)
    .required(),
  description: Joi.string()
    .trim()
    .min(Article.DES_CHAR_MIN)
    .max(Article.DES_CHAR_MAX)
    .required(),
  content: Joi.string()
    .custom(wordsCount)
    .custom((value) => {
      return DOMPurify.sanitize(value); // Sanitize HTML content
    }),
  categoryId: Joi.number()
    .required()
    .external(async (value, helpers) => {
      if (!value) return;
      return existsInDatabase(Category, value, helpers, 'Invalid categoryId');
    }),
});

// Middleware function to validate the article creation request
const createArticleRequestMiddleware = async (req, res, next) => {
  try {
    // Validate the incoming request body using the validateAsync method.
    // This method is used because the validation logic might involve asynchronous operations.
    const { error } = await createArticleRequest.validateAsync(req.body);

    // If validation fails (i.e., there are validation errors), pass the error to the next middleware.
    // This ensures that the error is handled in the appropriate error-handling middleware.
    if (error) {
      return next(error);
    }

    // Replace empty p tags with br
    req.body.content = req.body.content.replace(/<p>\s*<\/p>/g, '');

    // If validation is successful, proceed to the next middleware or route handler
    next();
  } catch (error) {
    // Catch any unexpected errors and pass them to the next middleware (error handling).
    next(error);
  }
};

export default createArticleRequestMiddleware;
