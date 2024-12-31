import Joi from 'joi';

const getTagsRequest = Joi.object({
  orderBy: Joi.string().trim().valid('views', 'shares', 'createdAt'),
  order: Joi.string().trim().valid('DESC', 'ASC'),
  limit: Joi.number().max(16),
  page: Joi.number(),
});

const getTagsRequestMiddleware = (req, res, next) => {
  try {
    const { error } = getTagsRequest.validate(req.query);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default getTagsRequestMiddleware;
