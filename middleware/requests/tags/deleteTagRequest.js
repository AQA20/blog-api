import Joi from 'joi';
import { existsInDatabase } from '../../../utils/joiCustomValidations.js';
import Tag from '../../../models/Tag.js';

const deleteTagRequest = Joi.object({
  id: Joi.number()
    .required()
    .external(async (value, helpers) => {
      return existsInDatabase(Tag, value, helpers, 'Invalid Tag id');
    }),
});

const deleteTagRequestMiddleware = async (req, res, next) => {
  try {
    const { error } = await deleteTagRequest.validateAsync(req.params);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default deleteTagRequestMiddleware;
