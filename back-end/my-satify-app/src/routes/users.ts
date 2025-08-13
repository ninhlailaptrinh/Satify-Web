import { Router } from 'express';
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
