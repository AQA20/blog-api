import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import ApiError from '../services/ApiError.js';
import UserController from '../controllers/UserController.js';

// Todo: Implement Rate Limiting to Track Failed Login Attempts using redis
// Route for user login
const auth = async (req, res, next) => {
  try {
    const errorMessage = 'Invalid credentials';
    // Find user by email
    const user = await User.findOne({
      where: { email: req.body.email },
    });
    // Check if user exists
    if (!user) {
      console.error('User not found');
      throw new ApiError(errorMessage, 400);
    }
    // Verify password
    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.dataValues.password,
    );

    // Handle invalid password
    if (!isPasswordValid) {
      console.error('Invalid email or password');
      throw new ApiError(errorMessage, 400);
    }

    // Generate new tokens
    const { accessToken, refreshToken } = UserController.generateAccessTokens(
      user.id,
      user.email,
    );

    // Set accessToken and refreshToken cookies
    UserController.setHttpOnlyTokenCookies(res, accessToken, refreshToken);

    // Store user in req.user
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default auth;
