import { Router } from 'express';
import Order from '../models/Order';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();

// POST /api/orders - create order (user)
router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const { items } = req.body as { items: Array<{ product: string; qty: number; price: number; }> };
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Items is required' });
        }
        const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);
        const created = await Order.create({ user: (req as any).user._id, items, total, status: 'created' });
        res.status(201).json(created);
    } catch (err) { next(err); }
});

// GET /api/orders/me - my orders (user)
router.get('/me', authMiddleware, async (req, res, next) => {
    try {
        const list = await Order.find({ user: (req as any).user._id })
            .populate('items.product', 'name image')
            .sort({ createdAt: -1 });
        res.json(list);
    } catch (err) { next(err); }
});

// GET /api/orders - list all (admin) with pagination/search
router.get('/', authMiddleware, requireRole('admin'), async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(100, Number(req.query.limit || 10));
        const q = (req.query.q as string) || '';
        const status = (req.query.status as string) || '';

        const pipeline: any[] = [];
        if (status) pipeline.push({ $match: { status } });
        pipeline.push(
            { $sort: { createdAt: -1 } },
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        );
        if (q) {
            pipeline.push({
                $match: {
                    $or: [
                        { 'user.name': { $regex: q, $options: 'i' } },
                        { 'user.email': { $regex: q, $options: 'i' } },
                        { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: q, options: 'i' } } }
                    ]
                }
            });
        }

        const result = await Order.aggregate([
            ...pipeline,
            {
                $facet: {
                    data: [ { $skip: (page - 1) * limit }, { $limit: limit } ],
                    meta: [ { $count: 'total' } ]
                }
            }
        ]);

        const data = result[0]?.data || [];
        const total = result[0]?.meta?.[0]?.total || 0;
        res.json({ data, meta: { page, limit, total } });
    } catch (err) { next(err); }
});

// PUT /api/orders/:id/status - update status (admin)
router.put('/:id/status', authMiddleware, requireRole('admin'), async (req, res, next) => {
    try {
        const { status } = req.body as { status: string };
        const allowed = ['created', 'paid', 'shipped', 'completed', 'cancelled'];
        if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
        const updated = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!updated) return res.status(404).json({ message: 'Order not found' });
        res.json(updated);
    } catch (err) { next(err); }
});

// GET /api/orders/:id - order detail (owner or admin)
router.get('/:id', authMiddleware, async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product', 'name image')
            .populate('user', 'name email');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        const isAdmin = (req as any).user?.role === 'admin';
        const isOwner = String(order.user?._id || order.user) === String((req as any).user._id);
        if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Forbidden' });
        res.json(order);
    } catch (err) { next(err); }
});

export default router;
