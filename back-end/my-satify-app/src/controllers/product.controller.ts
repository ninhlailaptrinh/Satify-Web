import { Request, Response } from 'express';
import Product from '../models/Product';
import Order from '../models/Order';

export const listProducts = async (req: Request, res: Response) => {
    const q = (req.query.q as string) || '';
    const category = (req.query.category as string) || '';
    const ids = (req.query.ids as string) || '';
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const sort = (req.query.sort as string) || 'newest';
    const minRating = req.query.minRating ? Number(req.query.minRating) : undefined;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Number(req.query.limit || 12));

    const filter: any = {};
    if (q) filter.name = new RegExp(q, 'i');
    if (category) filter.category = category;
    if (ids) {
        const idList = ids.split(',').map(s => s.trim()).filter(Boolean);
        if (idList.length > 0) filter._id = { $in: idList };
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) filter.price.$gte = minPrice;
        if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }
    if (minRating !== undefined) {
        filter.ratingAvg = { $gte: minRating };
    }

    let sortOpt: any = { createdAt: -1 };
    if (sort === 'price_asc') sortOpt = { price: 1 };
    if (sort === 'price_desc') sortOpt = { price: -1 };
    if (sort === 'newest') sortOpt = { createdAt: -1 };
    if (sort === 'rating_desc') sortOpt = { ratingAvg: -1, ratingCount: -1, createdAt: -1 };

    const items = await Product.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort(sortOpt);
    const total = await Product.countDocuments(filter);
    res.json({ data: items, meta: { page, limit, total } });
};

export const createProduct = async (req: Request, res: Response) => {
    const created = await Product.create(req.body);
    res.status(201).json(created);
};

export const deleteProduct = async (req: Request, res: Response) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
};

export const suggestProducts = async (req: Request, res: Response) => {
    try {
        const q = (req.query.q as string) || '';
        if (!q || q.length < 2) return res.json({ data: [] });
        const regex = new RegExp(q, 'i');
        const names: string[] = await Product.distinct('name', { name: regex });
        res.json({ data: names.slice(0, 10) });
    } catch (err) {
        res.json({ data: [] });
    }
};

export const bestSellers = async (req: Request, res: Response) => {
    try {
        const limit = Math.min(50, Math.max(1, Number(req.query.limit || 8)));
        const paidLikeStatuses = ['paid', 'shipped', 'completed'];
        const result = await Order.aggregate([
            { $match: { status: { $in: paidLikeStatuses } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    qty: { $sum: '$items.qty' },
                    revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } }
                }
            },
            { $sort: { qty: -1 } },
            { $limit: limit },
            { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            '$product',
                            { qtySold: '$qty', revenue: '$revenue' }
                        ]
                    }
                }
            }
        ]);
        res.json({ data: result });
    } catch (err) {
        res.status(500).json({ message: 'Failed to compute best sellers' });
    }
};
