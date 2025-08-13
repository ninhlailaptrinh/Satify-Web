import { Router } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();

// GET /api/users/me
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    res.json((req as any).user);
  } catch (err) { next(err); }
});

// PUT /api/users/me
router.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById((req as any).user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (req.body.name) user.name = req.body.name;
    if (req.body.password) {
      const currentPassword: string | undefined = req.body.currentPassword;
      if (!currentPassword) return res.status(400).json({ message: 'Current password required' });
      const ok = await (user as any).matchPassword(currentPassword);
      if (!ok) return res.status(401).json({ message: 'Current password incorrect' });
      user.password = req.body.password; // will be hashed in pre-save
    }
    await user.save();
    const safe = await User.findById(user._id).select('-password');
    res.json(safe);
  } catch (err) { next(err); }
});

// GET wishlist
router.get('/me/wishlist', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById((req as any).user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ ids: user.wishlist || [] });
  } catch (err) { next(err); }
});

// PUT wishlist (replace)
router.put('/me/wishlist', authMiddleware, async (req, res, next) => {
  try {
    const { ids } = req.body as { ids: string[] };
    const user = await User.findById((req as any).user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.wishlist = Array.isArray(ids) ? ids : [];
    await user.save();
    res.json({ ids: user.wishlist });
  } catch (err) { next(err); }
});

// PUBLIC: Get wishlist by user id (share link)
router.get('/:id/wishlist_public', async (req, res, next) => {
  try {
    const { token } = req.query as { token?: string };
    const user = await User.findById(req.params.id).select('wishlist wishlistShareToken wishlistShareExpiresAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const ok = user.wishlistShareToken && token === user.wishlistShareToken && (!user.wishlistShareExpiresAt || user.wishlistShareExpiresAt > new Date());
    if (!ok) return res.status(403).json({ message: 'Link hết hạn hoặc không hợp lệ' });
    res.json({ ids: (user as any).wishlist || [] });
  } catch (err) { next(err); }
});

// POST: generate share token (auth)
router.post('/me/wishlist_share', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById((req as any).user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const ttlMinutes = Math.max(5, Math.min(7 * 24 * 60, Number(req.body.ttlMinutes || 60))); // 5 minutes to 7 days
    user.wishlistShareToken = crypto.randomBytes(12).toString('hex');
    user.wishlistShareExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    await user.save();
    res.json({ token: user.wishlistShareToken, expiresAt: user.wishlistShareExpiresAt });
  } catch (err) { next(err); }
});

// DELETE: revoke share token
router.delete('/me/wishlist_share', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById((req as any).user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.wishlistShareToken = '';
    user.wishlistShareExpiresAt = null as any;
    await user.save();
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// GET /api/users (admin) with pagination/search
router.get('/', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Number(req.query.limit || 10));
    const q = (req.query.q as string) || '';
    const role = (req.query.role as string) || '';

    const filter: any = {};
    if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
    if (role) filter.role = role;

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter)
    ]);

    res.json({ data: users, meta: { page, limit, total } });
  } catch (err) { next(err); }
});

// GET /api/users/export (admin) - export CSV with current filters
router.get('/export', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const q = (req.query.q as string) || '';
    const role = (req.query.role as string) || '';

    const filter: any = {};
    if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
    if (role) filter.role = role;

    const rows = await User.find(filter).sort({ createdAt: -1 }).limit(5000);

    const header = ['id', 'name', 'email', 'role', 'createdAt'];
    const escape = (val: any) => {
      if (val === null || val === undefined) return '';
      const s = String(val).replace(/"/g, '""');
      return `"${s}` + `"`;
    };
    const csvLines = [header.join(',')];
    for (const r of rows) {
      const line = [
        r._id,
        r.name || '',
        r.email || '',
        r.role || 'user',
        new Date((r as any).createdAt).toISOString(),
      ].map(escape).join(',');
      csvLines.push(line);
    }

    const csv = '\uFEFF' + csvLines.join('\n');
    const filename = `users_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);
  } catch (err) { next(err); }
});

// PUT /api/users/:id/role (admin)
router.put('/:id/role', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const { role } = req.body as { role: 'user' | 'admin' };
    const updated = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(updated);
  } catch (err) { next(err); }
});

export default router;
