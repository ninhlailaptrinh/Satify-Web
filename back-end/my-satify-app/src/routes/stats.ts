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
    const paidLikeStatuses = ['paid', 'shipped', 'completed'];
    const fromStr = (req.query.from as string) || '';
    const toStr = (req.query.to as string) || '';

    let start: Date;
    let end: Date;
    let days: number;

    if (fromStr && toStr) {
      const f = new Date(fromStr);
      const t = new Date(toStr);
      if (isNaN(f.getTime()) || isNaN(t.getTime())) return res.status(400).json({ message: 'Invalid from/to' });
      start = new Date(f);
      start.setHours(0, 0, 0, 0);
      end = new Date(t);
      end.setHours(23, 59, 59, 999);
      // cap at 180 days
      const capEnd = new Date(start);
      capEnd.setDate(start.getDate() + 179);
      if (end > capEnd) end = capEnd;
      days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
    } else {
      days = Math.max(1, Math.min(180, Number(req.query.days || 14)));
      start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (days - 1));
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }

    const rows = await Order.aggregate([
      { $match: { status: { $in: paidLikeStatuses }, createdAt: { $gte: start, $lte: end } } },
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
