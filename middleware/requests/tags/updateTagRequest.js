import Joi from 'joi';
import { existsInDatabase } from '../../../utils/joiCustomValidations.js';
import Tag from '../../../models/Tag.js';

const updateTagRequest = Joi.object({
  id: Joi.number()
    .required()
    .external(async (value, helpers) => {
      return existsInDatabase(Tag, value, helpers, 'Invalid Tag id');
    }),
  name: Joi.string()
    .trim()
    .min(Tag.NAME_CH_MIN)
    .max(Tag.NAME_CH_MAX)
    .required(),
});

const updateTagRequestMiddleware = async (req, res, next) => {
  try {
    const { error } = await updateTagRequest.validateAsync(req.params);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default updateTagRequestMiddleware;
