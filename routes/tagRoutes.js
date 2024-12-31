import express from 'express';
import TagController from '../controllers/TagController.js';
import authorized from '../middleware/authorized.js';
import isAdmin from '../middleware/isAdmin.js';
import createTagRequest from '../middleware/requests/tags/createTagRequest.js';
import getTagsRequest from '../middleware/requests/tags/getTagsRequest.js';
import getTagArticlesRequest from '../middleware/requests/tags/getTagArticlesRequest.js';
import deleteTagRequest from '../middleware/requests/tags/deleteTagRequest.js';
import updateTagRequest from '../middleware/requests/tags/updateTagRequest.js';
import { handleAsyncApiError } from '../utils/handleErrors.js';

const router = express.Router();

// Get Tags
router.get('/tags', getTagsRequest, handleAsyncApiError(TagController.getTags));

// Get Tag
router.get('/tag/:value', handleAsyncApiError(TagController.getTag));

// Get Tag with article
router.get(
  '/tag/:name/articles',
  getTagArticlesRequest,
  handleAsyncApiError(TagController.getTagWithArticles),
);

// Create a Tag
router.post(
  '/tag/:name',
  authorized,
  isAdmin,
  createTagRequest,
  handleAsyncApiError(TagController.createTag),
);

// Update a Tag
router.put(
  '/tag/:tagId/:name',
  authorized,
  isAdmin,
  updateTagRequest,
  handleAsyncApiError(TagController.createTag),
);

// Delete a Tag
router.delete(
  '/tag/:id',
  authorized,
  isAdmin,
  deleteTagRequest,
  handleAsyncApiError(TagController.deleteTag),
);

export default router;
