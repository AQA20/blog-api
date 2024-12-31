import Joi from 'joi';
import { existsInDatabase } from '../../../utils/joiCustomValidations.js';
import User from '../../../models/User.js';

const deleteUserRequest = Joi.object({
  id: Joi.number()
    .required()
    .external(async (value, helpers) => {
      return existsInDatabase(User, value, helpers, 'Invalid User id');
    }),
});

const deleteUserRequestMiddleware = async (req, res, next) => {
  try {
    const { error } = await deleteUserRequest.validateAsync(req.params);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default deleteUserRequestMiddleware;
