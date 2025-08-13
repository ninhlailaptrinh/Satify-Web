import { Router } from 'express';
import { upload } from '../middlewares/upload.middleware';
import { uploadImage } from '../controllers/upload.controller';
import { authMiddleware } from '../middlewares/auth'; // optional, if you want auth

const router = Router();

// if you want only authenticated users can upload, add authMiddleware
// router.post('/', authMiddleware, upload.single('image'), uploadImage);

router.post('/', upload.single('image'), uploadImage);

export default router;
