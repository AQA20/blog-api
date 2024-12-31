import Joi from 'joi';

const imageRequest = Joi.object({
  type: Joi.string().trim().valid('USER', 'ARTICLE').required(),
  capture: Joi.string().trim(),
});

const imageRequestMiddleware = (req, res, next) => {
  try {
    const { error } = imageRequest.validate(req.query);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};
export default imageRequestMiddleware;
