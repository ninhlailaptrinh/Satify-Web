import { Request, Response } from 'express';
import Product from '../models/Product';

export const listProducts = async (req: Request, res: Response) => {
    const q = (req.query.q as string) || '';
    const category = (req.query.category as string) || '';
    const ids = (req.query.ids as string) || '';
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const sort = (req.query.sort as string) || 'newest';
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

    let sortOpt: any = { createdAt: -1 };
    if (sort === 'price_asc') sortOpt = { price: 1 };
    if (sort === 'price_desc') sortOpt = { price: -1 };
    if (sort === 'newest') sortOpt = { createdAt: -1 };

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
