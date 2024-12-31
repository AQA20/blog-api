import Joi from 'joi';
import Tag from '../../../models/Tag.js';

const createTagRequest = Joi.object({
  name: Joi.string()
    .trim()
    .min(Tag.NAME_CH_MIN)
    .max(Tag.NAME_CH_MAX)
    .required(),
});

const createTagRequestMiddleware = (req, res, next) => {
  try {
    const { error } = createTagRequest.validate(req.params);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default createTagRequestMiddleware;
