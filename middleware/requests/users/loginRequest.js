import Joi from 'joi';

const loginRequest = Joi.object({
  email: Joi.string().email().trim().required(),
  password: Joi.string().required(),
});

const loginRequestMiddleware = (req, res, next) => {
  try {
    const { error } = loginRequest.validate(req.body);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default loginRequestMiddleware;
