import Joi from 'joi';

const getSearchSuggestionsRequest = Joi.object({
  search: Joi.string().trim().allow(''),
});

const getSearchSuggestionsRequestMiddleware = (req, res, next) => {
  try {
    const { error } = getSearchSuggestionsRequest.validate(req.query);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default getSearchSuggestionsRequestMiddleware;
