import multer from 'multer';
import { validateImageFile } from '../utils/validations.js';
import ApiError from '../services/ApiError.js';

const storage = multer.memoryStorage();

// Multer file filter function to accept only images with specific extensions
const imageFilter = function (req, file, cb) {
  if (!validateImageFile(file, ['png', 'jpeg', 'jpg', 'webp'])) {
    cb(new ApiError('Not allowed format', 'Not allowed format'), false);
  } else {
    cb(null, true);
  }
};

export default multer({ storage, fileFilter: imageFilter });
