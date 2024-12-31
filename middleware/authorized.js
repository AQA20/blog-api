import jwt from 'jsonwebtoken';
import ApiError from '../services/ApiError.js';
import UserController from '../controllers/UserController.js';

const refreshAccessToken = async (refreshToken, res) => {
  try {
    // Generate new access token using a valid refresh token and returns decoded
    // user info
    return UserController.generateAccessTokenFromRefresh(res, refreshToken);
  } catch (err) {
    throw new ApiError('Invalid or expired refresh token', 401);
  }
};

const authorized = async (req, res, next) => {
  try {
    // Extract the token from the cookies
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new ApiError('Unauthorized: No refresh token found', 401);
    }

    try {
      const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
      req.user = decodedToken.user;
    } catch {
      req.user = await refreshAccessToken(refreshToken, res);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default authorized;
