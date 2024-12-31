import User from '../models/User.js';
import S3Client from '../services/S3Client.js';
import resHandler from '../services/ResHandler.js';
import db from '../config/databaseConnection.js';
import ApiError from '../services/ApiError.js';
import jwt from 'jsonwebtoken';
import {
  ACCESS_TOKEN_EXPIRATION_TIME,
  REFRESH_TOKEN_EXPIRATION_TIME,
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_MAX_AGE_MS,
  DOMAIN,
  SECURE,
  SAME_SITE,
} from '../utils/constants.js';

export default class UserController {
  static s3client = new S3Client();

  static async #formatUserRoles(userRoles) {
    return userRoles.map((userRole) => {
      return {
        id: userRole.Role.id,
        name: userRole.Role.name,
        permissions: userRole.Role.Permissions.map((permission) => ({
          id: permission.id,
          name: permission.name,
        })),
      };
    });
  }

  static async login(req, res) {
    // Get user from the requested (It attached to the req in the authenticating middleware)
    const user = req.user;
    let userRoles = await user.getUserRoles();
    userRoles = await UserController.#formatUserRoles(userRoles);
    // Only returns the neccacccary data
    return resHandler(
      201,
      {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        userRoles: userRoles,
      },
      res,
    );
  }

  static generateAccessTokenFromRefresh(res, refreshToken) {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Generate new tokens
    const { accessToken } = UserController.generateAccessTokens(
      decoded.user.id,
      decoded.user.email,
    );

    // Set new access token in HTTP-only cookie
    UserController.setAccessTokenCookie(res, accessToken);

    return decoded.user;
  }

  static async refreshAccessToken(req, res) {
    // Get refresh token from the cookie
    const oldRefreshToken = req.cookies.refreshToken;
    // Check if the refresh token exists
    if (!oldRefreshToken) {
      throw new ApiError('Refresh token not found', 401);
    }
    // Generate new access token using a valid refresh token and returns decoded
    // user info
    const decodedUser = UserController.generateAccessTokenFromRefresh(
      res,
      oldRefreshToken,
    );

    // If the token is valid, refetch user by it's decoded id
    const user = await UserController.#fetchUserById(decodedUser.id);

    // Return the response
    return resHandler(200, user, res);
  }

  static async logout(req, res) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: SECURE,
      sameSite: SAME_SITE,
      domain: DOMAIN,
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: SECURE,
      sameSite: SAME_SITE,
      domain: DOMAIN,
    });
    res.status(200).send('Logged out');
  }

  static async signup(req, res) {
    // Use transaction so if something went wrong it rolls back all database
    // operations, note we're automatically pass transactions to all queries in
    // server/config/databaseConnection.js so we don't need to manually pass it
    // to each query.
    await db.sequelize.transaction(async (t) => {
      const user = await User.create(req.body);
      return resHandler(201, user, res);
    });
  }

  static async profile(req, res) {
    // Get the access token from the cookie
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      throw new ApiError('No access token found', 401);
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

    // If the token is valid, refetch user by it's decoded id
    const user = await UserController.#fetchUserById(decoded.user.id);
    return resHandler(200, user, res);
  }

  static generateAccessTokens(id, email) {
    const accessToken = UserController.generateAccessToken(id, email);
    const refreshToken = UserController.generateRefreshToken(id, email);

    return { accessToken, refreshToken };
  }

  static generateAccessToken(id, email) {
    // Generate a new access token
    return jwt.sign({ user: { id, email } }, process.env.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRATION_TIME,
    });
  }

  static generateRefreshToken(id, email) {
    // Generate a new refresh token
    return jwt.sign(
      {
        user: {
          id,
          email,
        },
        type: 'refresh',
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRATION_TIME },
    );
  }

  static setHttpOnlyTokenCookies(res, accessToken, refreshToken) {
    UserController.setAccessTokenCookie(res, accessToken);
    UserController.setRefreshTokenCookie(res, refreshToken);
  }

  static setAccessTokenCookie(res, accessToken) {
    // Set new access token in HTTP-only cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: SECURE,
      sameSite: SAME_SITE,
      domain: DOMAIN,
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });
  }

  static setRefreshTokenCookie(res, refreshToken) {
    // Set new access token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: SECURE,
      sameSite: SAME_SITE,
      domain: DOMAIN,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });
  }

  static async #fetchUserById(id) {
    const user = await User.findByPk(id);
    let userRoles = await user.getUserRoles();
    userRoles = await UserController.#formatUserRoles(userRoles);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      userRoles: userRoles,
    };
  }
}
