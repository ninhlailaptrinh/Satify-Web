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

// GET /api/stats/revenue_daily?days=14 - revenue per day for last N days
router.get('/revenue_daily', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const days = Math.max(1, Math.min(90, Number(req.query.days || 14)));
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    const paidLikeStatuses = ['paid', 'shipped', 'completed'];

    const rows = await Order.aggregate([
      { $match: { status: { $in: paidLikeStatuses }, createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$total' } } },
      { $sort: { _id: 1 } }
    ]);

    const map: Record<string, number> = {};
    for (const r of rows) map[r._id] = r.total;
    const out: Array<{ date: string; total: number }> = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      out.push({ date: key, total: map[key] || 0 });
    }

    res.json({ data: out });
  } catch (err) { next(err); }
});

export default router;
