import express from 'express';

import ImageController from '../controllers/ImageController.js';
import authorized from '../middleware/authorized.js';
import uploadImage from '../middleware/multerImageUpload.js';
import uploadImageRequest from '../middleware/requests/uploadImageRequest.js';
import imageRequest from '../middleware/requests/images/imageRequest.js';
import isAdmin from '../middleware/isAdmin.js';
import { handleAsyncApiError } from '../utils/handleErrors.js';

const router = express.Router();

// Get Image url
router.get('/image/:id', handleAsyncApiError(ImageController.getImageUrl));

// Upload Image
router.post(
  '/image/upload',
  authorized,
  isAdmin,
  uploadImage.single('file'),
  uploadImageRequest,
  handleAsyncApiError(ImageController.uploadImage),
);

// Upload Imageable
router.post(
  '/image/:imageableId',
  authorized,
  isAdmin,
  uploadImage.single('file'),
  uploadImageRequest,
  imageRequest,
  handleAsyncApiError(ImageController.uploadImageable),
);

// Update user profile picture
router.put(
  '/image/user',
  authorized,
  isAdmin,
  uploadImage.single('file'),
  uploadImageRequest,
  handleAsyncApiError(ImageController.updateUserImg),
);

// Delete Imageable
router.delete(
  '/image/:imageableId',
  authorized,
  isAdmin,
  handleAsyncApiError(ImageController.deleteImage),
);

// Delete Image and Imageable Permenanetally
router.delete(
  '/image/permanent-delete/:name',
  authorized,
  isAdmin,
  handleAsyncApiError(ImageController.deleteImagePermenanetally),
);

export default router;
