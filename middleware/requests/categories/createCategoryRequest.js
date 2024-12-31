import Joi from 'joi';
import Category from '../../../models/Category.js';

const createCategoryRequest = Joi.object({
  name: Joi.string()
    .trim()
    .min(Category.NAME_CH_MIN)
    .max(Category.NAME_CH_MAX)
    .required(),
});

const createCategoryRequestMiddleware = (req, res, next) => {
  try {
    const { error } = createCategoryRequest.validate(req.params);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default createCategoryRequestMiddleware;
