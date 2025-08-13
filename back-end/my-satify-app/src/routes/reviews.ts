import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import Review from '../models/Review';

const router = Router();

// GET /api/reviews/:productId
router.get('/:productId', async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const list = await Review.find({ productId }).sort({ createdAt: -1 }).limit(100);
    const stats = await Review.aggregate([
      { $match: { productId: (list[0]?.productId || undefined) ? list[0].productId : undefined } }
    ]);
    res.json({ data: list });
  } catch (err) { next(err); }
});

// POST /api/reviews/:productId
router.post('/:productId', authMiddleware, async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const userId = (req as any).user._id;
    const { rating, comment } = req.body as { rating: number; comment?: string };
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Invalid rating' });
    const upsert = await Review.findOneAndUpdate(
      { productId, userId },
      { rating, comment: comment || '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(upsert);
  } catch (err) { next(err); }
});

export default router;
