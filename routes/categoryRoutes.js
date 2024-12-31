import express from 'express';
import CategoryController from '../controllers/CategoryController.js';
import authorized from '../middleware/authorized.js';
import isAdmin from '../middleware/isAdmin.js';
import createCategoryRequest from '../middleware/requests/categories/createCategoryRequest.js';
import { handleAsyncApiError } from '../utils/handleErrors.js';

const router = express.Router();

// Get category
router.get(
  '/category/:value',
  handleAsyncApiError(CategoryController.getCategory),
);

// Get categories
router.get(
  '/categories',
  handleAsyncApiError(CategoryController.getCategories),
);

// Get category with articles
router.get(
  '/category/:id/articles',
  handleAsyncApiError(CategoryController.getCategoryWithArticles),
);

// Get categories with articles
router.get(
  '/categories/articles',
  handleAsyncApiError(CategoryController.getCategoriesWithArticles),
);

// Create category
router.post(
  '/category/:name',
  authorized,
  isAdmin,
  createCategoryRequest,
  handleAsyncApiError(CategoryController.createCategory),
);

// Delete category
router.delete(
  '/category/:id',
  authorized,
  isAdmin,
  createCategoryRequest,
  handleAsyncApiError(CategoryController.deleteCategory),
);

export default router;
