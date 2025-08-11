import rateLimit from 'express-rate-limit';

const skipLimiter = (req) => {
  // Skip if user is admin (based on your auth middleware populating req.user)
  if (req.user?.role === 'admin') return true;
  return false;
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip for admins
  skip: skipLimiter,
});

export default limiter;
