import express from 'express';
import ArticleController from '../controllers/ArticleController.js';
import authorized from '../middleware/authorized.js';
import isAdmin from '../middleware/isAdmin.js';
import getArticlesRequest from '../middleware/requests/articles/getArticlesRequest.js';
import getArticleRequest from '../middleware/requests/articles/getArticleRequest.js';
import getSearchSuggestionsRequest from '../middleware/requests/articles/getSearchSuggestionsRequest.js';
import createArticleRequest from '../middleware/requests/articles/createArticleRequest.js';
import updateArticleRequest from '../middleware/requests/articles/updateArticleRequest.js';
import updateArticleStatus from '../middleware/requests/articles/updateArticleStatus.js';
import deleteArticleRequest from '../middleware/requests/articles/deleteArticleRequest.js';
import restoreArticleRequest from '../middleware/requests/articles/restoreArticleRequest.js';
import { handleAsyncApiError } from '../utils/handleErrors.js';

const router = express.Router();

router.get(
  '/articles',
  getArticlesRequest,
  handleAsyncApiError(ArticleController.getArticles),
);

// Get all article slugs
router.get(
  '/article/slugs',
  handleAsyncApiError(ArticleController.getAllArticleSlugs),
);

// Get article
router.get(
  '/article/:value',
  getArticleRequest,
  handleAsyncApiError(ArticleController.getArticle),
);

// Get search suggestions
router.get(
  '/articles/suggestions',
  getSearchSuggestionsRequest,
  handleAsyncApiError(ArticleController.getSearchSuggestions),
);

// Create article
router.post(
  '/article',
  authorized,
  isAdmin,
  createArticleRequest,
  handleAsyncApiError(ArticleController.createArticle),
);

// Update article share
router.put(
  '/article/share/:id',
  handleAsyncApiError(ArticleController.updateShareArticle),
);

// Update article
router.put(
  '/article/:id',
  authorized,
  isAdmin,
  updateArticleRequest,
  handleAsyncApiError(ArticleController.updateArticle),
);

// Update article status
router.put(
  '/article/:id/status',
  authorized,
  isAdmin,
  updateArticleStatus,
  handleAsyncApiError(ArticleController.updateArticleStatus),
);

// Delete article
router.delete(
  '/article/:id',
  authorized,
  isAdmin,
  deleteArticleRequest,
  handleAsyncApiError(ArticleController.deleteArticle),
);

// Restore article
router.put(
  '/article/restore/:id',
  authorized,
  isAdmin,
  restoreArticleRequest,
  handleAsyncApiError(ArticleController.restoreArticle),
);

export default router;
