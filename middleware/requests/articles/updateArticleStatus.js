import Joi from 'joi';

const updateArticleStatus = Joi.object({
  status: Joi.string()
    .trim()
    .valid('Approved', 'Pending', 'Rejected', 'Trashed')
    .required(),
});

const updateArticleRequestMiddleware = (req, res, next) => {
  try {
    const { error } = updateArticleStatus.validate(req.body);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default updateArticleRequestMiddleware;
