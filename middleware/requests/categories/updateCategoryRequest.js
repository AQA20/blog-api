import Joi from 'joi';
import { existsInDatabase } from '../../../utils/joiCustomValidations.js';
import Category from '../../../models/Category.js';

const updateCategoryRequest = Joi.object({
  id: Joi.number()
    .required()
    .external(async (value, helpers) => {
      return existsInDatabase(Category, value, helpers, 'Invalid Category id');
    }),
  name: Joi.string()
    .trim()
    .min(Category.NAME_CH_MIN)
    .max(Category.NAME_CH_MAX)
    .required(),
});

const updateCategoryRequestMiddleware = async (req, res, next) => {
  try {
    const { error } = await updateCategoryRequest.validateAsync(req.params);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default updateCategoryRequestMiddleware;
