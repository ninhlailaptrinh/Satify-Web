import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import User from '../models/User';
import Product from '../models/Product';
import Order from '../models/Order';

const router = Router();

// GET /api/stats - admin overview
router.get('/', authMiddleware, requireRole('admin'), async (_req, res, next) => {
  try {
    const [usersTotal, productsTotal, ordersTotal] = await Promise.all([
      User.countDocuments({}),
      Product.countDocuments({}),
      Order.countDocuments({}),
    ]);

    const ordersByStatusAgg = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const ordersByStatus = ordersByStatusAgg.reduce<Record<string, number>>((acc, cur) => {
      acc[String(cur._id || 'unknown')] = cur.count || 0;
      return acc;
    }, {});

    const paidLikeStatuses = ['paid', 'shipped', 'completed'];

    const [revenueTotalAgg, revenueLast30dAgg] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $in: paidLikeStatuses } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { status: { $in: paidLikeStatuses }, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    const revenueTotal = revenueTotalAgg?.[0]?.total || 0;
    const revenueLast30d = revenueLast30dAgg?.[0]?.total || 0;

    res.json({
      users: { total: usersTotal },
      products: { total: productsTotal },
      orders: { total: ordersTotal, byStatus: ordersByStatus },
      revenue: { total: revenueTotal, last30d: revenueLast30d },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
