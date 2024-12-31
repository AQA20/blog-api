import Joi from 'joi';

const signupRequest = Joi.object({
  name: Joi.string().alphanum().min(3).max(60).trim().required(),
  email: Joi.string().email().trim().required(),
  password: Joi.string()
    .min(12)
    .max(64)
    .pattern(
      new RegExp(
        '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d])[A-Za-z\\d\\S]{12,64}$',
      ),
    )
    .required()
    .messages({
      'string.pattern.base':
        'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.',
    }),
  repeat_password: Joi.ref('password'),
}).with('password', 'repeat_password');

const signupRequestMiddleware = (req, res, next) => {
  try {
    const { error } = signupRequest.validate(req.body);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default signupRequestMiddleware;
