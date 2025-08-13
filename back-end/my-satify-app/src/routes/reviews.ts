import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import Review from '../models/Review';
import Product from '../models/Product';
import Order from '../models/Order';

const router = Router();

// GET /api/reviews/:productId
router.get('/:productId', async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const list = await Review.find({ productId }).sort({ createdAt: -1 }).limit(100);
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
    // Verify purchased
    const hasPurchased = await Order.exists({ user: userId, 'items.product': productId, status: { $ne: 'cancelled' } });
    if (!hasPurchased) return res.status(403).json({ message: 'Bạn cần mua sản phẩm này trước khi đánh giá' });
    const upsert = await Review.findOneAndUpdate(
      { productId, userId },
      { rating, comment: comment || '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const agg = await Review.aggregate([
      { $match: { productId: upsert.productId } },
      { $group: { _id: '$productId', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    if (agg.length > 0) {
      await Product.findByIdAndUpdate(upsert.productId, { ratingAvg: agg[0].avg, ratingCount: agg[0].count });
    }
    res.status(201).json(upsert);
  } catch (err) { next(err); }
});

export default router;
