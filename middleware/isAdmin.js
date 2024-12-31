import ApiError from '../services/ApiError.js';
import User from '../models/User.js';

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user.isAdmin()) {
      throw new ApiError('Unauthorized', 401);
    }
    // Attach is admin property to the user object
    // So we don't retrieve user from database again
    // in next step.
    req.user.isAdmin = user.isAdmin();
    next();
  } catch (error) {
    next(error);
  }
};

export default isAdmin;
