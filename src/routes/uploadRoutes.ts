import { Router } from 'express';

import * as uploadController from '../controllers/uploadController';
import authMiddleware from '../middlewares/auth-middleware';

const router = Router();

router.get('/multipart-id', authMiddleware, uploadController.initiateMultipart);
router.get('/multipart-url', authMiddleware, uploadController.processMultipart);

router.post('/video', authMiddleware, uploadController.completeMultipart);
router.put('/video', authMiddleware, uploadController.saveVideo);

router.put('/thumbnail', authMiddleware, uploadController.uploadThumbnail);
router.delete('/thumbnail', authMiddleware, uploadController.deleteThumbnail);

export default router;
