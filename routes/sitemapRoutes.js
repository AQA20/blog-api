import express from 'express';

import { handleAsyncApiError } from '../utils/handleErrors.js';
import SitemapController from '../controllers/SitemapController.js';

const router = express.Router();

// Get sitemap
router.get('/sitemap.xml', handleAsyncApiError(SitemapController.getSitemap));

export default router;
