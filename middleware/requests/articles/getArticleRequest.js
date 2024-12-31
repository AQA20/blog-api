import Joi from 'joi';

const getArticleRequest = Joi.object({
  allStatuses: Joi.string().valid('include'),
});

// Middleware function to validate the article creation request
const getArticleRequestMiddleware = (req, res, next) => {
  try {
    // Validate the incoming request query using the validate method.
    const { error } = getArticleRequest.validate(req.query);

    // If validation fails (i.e., there are validation errors), pass the error to the next middleware.
    // This ensures that the error is handled in the appropriate error-handling middleware.
    if (error) {
      return next(error);
    }

    // If validation is successful, proceed to the next middleware or route handler
    next();
  } catch (error) {
    // Catch any unexpected errors and pass them to the next middleware (error handling).
    next(error);
  }
};

export default getArticleRequestMiddleware;
