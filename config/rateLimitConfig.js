import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip for admins
  skip: async (req) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return false;
    }
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (!decoded) return false;
    const user = await User.findOne({ where: { email: decoded.user.email } });
    if (!user) return false;
    const isAdmin = user.isAdmin();
    return isAdmin;
  },
});

export default limiter;
