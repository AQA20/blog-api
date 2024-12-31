import Joi from 'joi';

const getTagArticlesRequest = Joi.object({
  orderBy: Joi.string().trim().valid('views', 'shares', 'createdAt'),
  order: Joi.string().trim().valid('DESC', 'ASC'),
  page: Joi.number(),
});

const getTagArticlesRequestMiddleware = (req, res, next) => {
  try {
    const { error } = getTagArticlesRequest.validate(req.query);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default getTagArticlesRequestMiddleware;
