import { Router } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();

// POST /api/orders - create order (user)
router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const { items } = req.body as { items: Array<{ product: string; qty: number; price?: number; }> };
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Items is required' });
        }
        // Normalize items and compute price from DB to avoid client tampering
        const productIds = Array.from(new Set(items.map(i => i.product)));
        const products = await Product.find({ _id: { $in: productIds } });
        const map = new Map(products.map(p => [String(p._id), p]));

        // Validate stock and build order items with server-side price
        const normalizedItems: Array<{ product: any; qty: number; price: number; }> = [];
        for (const i of items) {
            const p = map.get(String(i.product));
            if (!p) return res.status(400).json({ message: `Product not found: ${i.product}` });
            const qty = Math.max(1, Number(i.qty || 0));
            if ((p as any).stock !== undefined && (p as any).stock < qty) {
                return res.status(400).json({ message: `Sản phẩm '${(p as any).name}' không đủ hàng` });
            }
            normalizedItems.push({ product: p._id, qty, price: (p as any).price });
        }

        const total = normalizedItems.reduce((sum, i) => sum + i.qty * i.price, 0);

        const shippingAddress = (req.body as any).shippingAddress || {};
        const created = await Order.create({ user: (req as any).user._id, items: normalizedItems, total, status: 'created', shippingAddress });

        // Decrement stock after order created
        const bulkOps = normalizedItems.map(i => ({ updateOne: { filter: { _id: i.product }, update: { $inc: { stock: -i.qty } } } }));
        if (bulkOps.length) await Product.bulkWrite(bulkOps);
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
        const fromStr = (req.query.from as string) || '';
        const toStr = (req.query.to as string) || '';

        const pipeline: any[] = [];
        if (status) pipeline.push({ $match: { status } });
        if (fromStr && toStr) {
            const from = new Date(fromStr); from.setHours(0,0,0,0);
            const to = new Date(toStr); to.setHours(23,59,59,999);
            if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
                pipeline.push({ $match: { createdAt: { $gte: from, $lte: to } } });
            }
        }
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
                    meta: [ { $count: 'total' } ],
                    sum: [ { $group: { _id: null, sum: { $sum: '$total' } } } ],
                    byStatus: [ { $group: { _id: '$status', count: { $sum: 1 } } } ]
                }
            }
        ]);

        const data = result[0]?.data || [];
        const total = result[0]?.meta?.[0]?.total || 0;
        const sum = result[0]?.sum?.[0]?.sum || 0;
        const byStatusArr = result[0]?.byStatus || [];
        const byStatus = byStatusArr.reduce((acc: any, cur: any) => { acc[cur._id || 'unknown'] = cur.count || 0; return acc; }, {} as Record<string, number>);
        res.json({ data, meta: { page, limit, total, sum, byStatus } });
    } catch (err) { next(err); }
});

// GET /api/orders/export - export CSV (admin) with same filters as list
router.get('/export', authMiddleware, requireRole('admin'), async (req, res, next) => {
    try {
        const q = (req.query.q as string) || '';
        const status = (req.query.status as string) || '';
        const fromStr = (req.query.from as string) || '';
        const toStr = (req.query.to as string) || '';

        const pipeline: any[] = [];
        if (status) pipeline.push({ $match: { status } });
        if (fromStr && toStr) {
            const from = new Date(fromStr); from.setHours(0,0,0,0);
            const to = new Date(toStr); to.setHours(23,59,59,999);
            if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
                pipeline.push({ $match: { createdAt: { $gte: from, $lte: to } } });
            }
        }
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
        // Safety cap to avoid exporting huge data sets
        pipeline.push({ $limit: 5000 });

        const rows: any[] = await Order.aggregate(pipeline);

        const header = ['id', 'userName', 'userEmail', 'status', 'total', 'itemCount', 'createdAt'];
        const escape = (val: any) => {
            if (val === null || val === undefined) return '';
            const s = String(val).replace(/"/g, '""');
            return `"${s}` + `"`;
        };
        const csvLines = [header.join(',')];
        for (const r of rows) {
            const line = [
                r._id,
                r.user?.name || '',
                r.user?.email || '',
                r.status || '',
                r.total ?? 0,
                Array.isArray(r.items) ? r.items.length : 0,
                new Date(r.createdAt).toISOString(),
            ].map(escape).join(',');
            csvLines.push(line);
        }

        const csv = '\uFEFF' + csvLines.join('\n'); // BOM for Excel
        const filename = `orders_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(csv);
    } catch (err) { next(err); }
});

// PUT /api/orders/:id/status - update status (admin)
router.put('/:id/status', authMiddleware, requireRole('admin'), async (req, res, next) => {
    try {
        const { status, trackingNumber, carrier, estimateDeliveryDate } = req.body as { status: string; trackingNumber?: string; carrier?: string; estimateDeliveryDate?: string };
        const allowed = ['created', 'paid', 'shipped', 'completed', 'cancelled'];
        if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
        const update: any = { status };
        if (trackingNumber !== undefined) update.trackingNumber = trackingNumber;
        if (carrier !== undefined) update.carrier = carrier;
        if (estimateDeliveryDate) update.estimateDeliveryDate = new Date(estimateDeliveryDate);
        if (status === 'shipped') update.shippedAt = new Date();
        if (status === 'completed') update.deliveredAt = new Date();
        const updated = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
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
