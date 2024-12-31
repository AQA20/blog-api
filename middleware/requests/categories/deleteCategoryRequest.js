import Joi from 'joi';
import { existsInDatabase } from '../../../utils/joiCustomValidations.js';
import Category from '../../../models/Category.js';

const deleteCategoryRequest = Joi.object({
  id: Joi.number()
    .required()
    .external(async (value, helpers) => {
      return existsInDatabase(Category, value, helpers, 'Invalid Category id');
    }),
});

const deleteCategoryRequestMiddleware = async (req, res, next) => {
  try {
    const { error } = await deleteCategoryRequest.validateAsync(req.params);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default deleteCategoryRequestMiddleware;
