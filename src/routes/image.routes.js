/* src/routes/image.routes.js */
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { imageUpload } from '../middleware/imageUpload.js';
import { uploadImage } from '../controllers/image.controller.js';

const router = express.Router();

router.post('/upload', requireAuth, imageUpload, uploadImage);

export default router; 