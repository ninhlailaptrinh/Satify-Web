import { Router } from 'express';
import Product from '../models/Product';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { listProducts, createProduct, deleteProduct, suggestProducts, bestSellers } from '../controllers/product.controller';

const router = Router();

// GET /api/products (supports q, page, limit)
router.get('/', async (req, res, next) => {
    try {
        await listProducts(req, res);
    } catch (err) { next(err); }
});

// GET /api/products/suggest?q=...
router.get('/suggest', async (req, res, next) => {
    try { await suggestProducts(req, res); } catch (err) { next(err); }
});

// GET /api/products/best_sellers?limit=8
router.get('/best_sellers', async (req, res, next) => {
    try { await bestSellers(req, res); } catch (err) { next(err); }
});

// POST /api/products  (admin)
router.post('/', authMiddleware, requireRole('admin'), async (req, res, next) => {
    try {
        await createProduct(req, res);
    } catch (err) { next(err); }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) { next(err); }
});

// PUT /api/products/:id (admin)
router.put('/:id', authMiddleware, requireRole('admin'), async (req, res, next) => {
    try {
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Product not found' });
        res.json(updated);
    } catch (err) { next(err); }
});

// DELETE /api/products/:id (admin)
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res, next) => {
    try {
        await deleteProduct(req, res);
    } catch (err) { next(err); }
});

export default router;
