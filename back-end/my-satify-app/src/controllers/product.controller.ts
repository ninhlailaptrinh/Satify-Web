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
    const stockFilter = (req.query.stock as string) || '';
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
    if (stockFilter === 'out') {
        filter.stock = { $lte: 0 };
    } else if (stockFilter === 'low') {
        filter.stock = { $gt: 0, $lt: 5 };
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
        const category = (req.query.category as string) || '';
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
            ...(category ? [{ $match: { 'product.category': category } }] : []),
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

export const exportProducts = async (req: Request, res: Response) => {
    try {
        const q = (req.query.q as string) || '';
        const category = (req.query.category as string) || '';
        const stockFilter = (req.query.stock as string) || '';
        const filter: any = {};
        if (q) filter.name = new RegExp(q, 'i');
        if (category) filter.category = category;
        if (stockFilter === 'out') filter.stock = { $lte: 0 };
        else if (stockFilter === 'low') filter.stock = { $gt: 0, $lt: 5 };

        const rows = await Product.find(filter).sort({ createdAt: -1 }).limit(5000);
        const header = ['id','name','price','image','stock','category','description','createdAt','updatedAt'];
        const escape = (val: any) => {
            if (val === null || val === undefined) return '';
            const s = String(val).replace(/"/g, '""');
            return `"${s}` + `"`;
        };
        const csvLines = [header.join(',')];
        for (const r of rows as any[]) {
            csvLines.push([
                r._id,
                r.name || '',
                r.price ?? 0,
                r.image || '',
                r.stock ?? 0,
                r.category || '',
                r.description || '',
                new Date(r.createdAt).toISOString(),
                new Date(r.updatedAt).toISOString(),
            ].map(escape).join(','));
        }
        const csv = '\uFEFF' + csvLines.join('\n');
        const filename = `products_${new Date().toISOString().replace(/[:.]/g,'-')}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(csv);
    } catch (err) {
        res.status(500).json({ message: 'Export failed' });
    }
};

export const importProducts = async (req: Request, res: Response) => {
    try {
        const file = (req as any).file as Express.Multer.File | undefined;
        if (!file) return res.status(400).json({ message: 'Missing file' });
        const text = file.buffer.toString('utf-8');
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length === 0) return res.json({ created: 0, updated: 0 });
        const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''));
        const idx = (name: string) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());
        const iName = idx('name');
        if (iName < 0) return res.status(400).json({ message: 'CSV must include name column' });
        const iPrice = idx('price');
        const iImage = idx('image');
        const iStock = idx('stock');
        const iCategory = idx('category');
        const iDescription = idx('description');

        let created = 0, updated = 0;
        for (let li = 1; li < lines.length; li++) {
            const raw = lines[li];
            if (!raw.trim()) continue;
            // naive CSV split - handle simple quoted commas
            const cols = [] as string[];
            let cur = '', inQ = false;
            for (let c of raw) {
                if (c === '"') { inQ = !inQ; continue; }
                if (c === ',' && !inQ) { cols.push(cur); cur = ''; } else { cur += c; }
            }
            cols.push(cur);
            const name = (cols[iName] || '').trim();
            if (!name) continue;
            const doc: any = { name };
            if (iPrice >= 0) doc.price = Number(cols[iPrice]) || 0;
            if (iImage >= 0) doc.image = (cols[iImage] || '').trim();
            if (iStock >= 0) doc.stock = Number(cols[iStock]) || 0;
            if (iCategory >= 0) doc.category = (cols[iCategory] || '').trim() || 'general';
            if (iDescription >= 0) doc.description = (cols[iDescription] || '').trim();

            const existing = await Product.findOne({ name });
            if (existing) {
                await Product.updateOne({ _id: existing._id }, { $set: doc });
                updated++;
            } else {
                await Product.create(doc);
                created++;
            }
        }
        res.json({ created, updated });
    } catch (err) {
        res.status(500).json({ message: 'Import failed' });
    }
};
