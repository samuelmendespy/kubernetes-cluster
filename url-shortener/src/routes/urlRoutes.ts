import { Router } from 'express';
import { generateShortUrl, redirectToLongUrl } from '../controllers/urlController';

const router = Router();

// POST /generate - Generates a shrunken URL
router.post('/generate', generateShortUrl);

// GET /:shortCode - Redirects to the original URL
router.get('/:shortCode', redirectToLongUrl);

export default router;