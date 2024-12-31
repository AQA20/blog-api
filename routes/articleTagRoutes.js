import express from 'express';
import ArticleTagController from '../controllers/ArticleTagController.js';
import authorized from '../middleware/authorized.js';
import isAdmin from '../middleware/isAdmin.js';
import updateArticleTagRequest from '../middleware/requests/articleTags/updateArticleTagRequest.js';
import { handleAsyncApiError } from '../utils/handleErrors.js';

const router = express.Router();

// Create article tag
router.post(
  '/article/:articleId/tag/:tagId',
  authorized,
  isAdmin,
  handleAsyncApiError(ArticleTagController.createArticleTag),
);

// Update article tag
router.put(
  '/article/tag/:id',
  authorized,
  isAdmin,
  updateArticleTagRequest,
  handleAsyncApiError(ArticleTagController.updateArticleTag),
);

export default router;
