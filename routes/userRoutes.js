import express from 'express';
import auth from '../middleware/auth.js';
import UserController from '../controllers/UserController.js';
import loginRequest from '../middleware/requests/users/loginRequest.js';
import signupRequest from '../middleware/requests/users/signupRequest.js';
import { handleAsyncApiError } from '../utils/handleErrors.js';

const router = express.Router();

// User signup route
router.post(
  '/signup',
  signupRequest,
  handleAsyncApiError(UserController.signup),
);

// Refresh access token
router.post(
  '/token/refresh',
  handleAsyncApiError(UserController.refreshAccessToken),
);

// Get user profile
router.get('/profile', handleAsyncApiError(UserController.profile));

// User login route
router.post(
  '/login',
  loginRequest,
  auth,
  handleAsyncApiError(UserController.login),
);

// User logout route
router.post('/logout', handleAsyncApiError(UserController.logout));

export default router;
