import { Router } from 'express';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import crypto from 'crypto';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import config from '../config';
import jwt from 'jsonwebtoken';

const router = Router();

function hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// register
router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password, adminKey } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email taken' });
        const role = adminKey && config.adminBootstrapKey && adminKey === config.adminBootstrapKey ? 'admin' : 'user';
        const user = await User.create({ name, email, password, role });
        res.status(201).json({ id: user._id, email: user.email, name: user.name });
    } catch (err) { next(err); }
});

// login -> issues access token + refresh cookie
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });
        const ok = await user.matchPassword(password);
        if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

        const accessToken = signAccessToken({ sub: user._id, role: user.role });
        const refreshToken = signRefreshToken({ sub: user._id, role: user.role });

        // store refresh token hash
        const tokenHash = hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + (config.refreshTokenExpiresDays * 24 * 60 * 60 * 1000));
        await RefreshToken.create({ user: user._id, tokenHash, expiresAt });

        // set httpOnly cookie
        res.cookie('rft', refreshToken, {
            httpOnly: true,
            secure: config.nodeEnv === 'production',
            sameSite: 'lax',
            maxAge: config.refreshTokenExpiresDays * 24 * 60 * 60 * 1000
        });

        res.json({ accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) { next(err); }
});

// refresh (rotate)
router.post('/refresh', async (req, res, next) => {
    try {
        const token = req.cookies?.rft;
        if (!token) return res.status(401).json({ message: 'No refresh token' });

        let payload: any;
        try { payload = jwt.verify(token, config.jwtSecret) as any; } catch { return res.status(401).json({ message: 'Invalid refresh token' }); }

        const tokenHash = hashToken(token);
        const stored = await RefreshToken.findOne({ user: payload.sub, tokenHash });
        if (!stored) return res.status(401).json({ message: 'Refresh token unknown' });
        if (stored.expiresAt < new Date()) { await RefreshToken.deleteOne({ _id: stored._id }); return res.status(401).json({ message: 'Expired' }); }

        // rotate
        await RefreshToken.deleteOne({ _id: stored._id });
        const newRefresh = signRefreshToken({ sub: payload.sub });
        const newHash = hashToken(newRefresh);
        const expiresAt = new Date(Date.now() + (config.refreshTokenExpiresDays * 24 * 60 * 60 * 1000));
        await RefreshToken.create({ user: payload.sub, tokenHash: newHash, expiresAt });

        const accessToken = signAccessToken({ sub: payload.sub, role: payload.role || 'user' });

        res.cookie('rft', newRefresh, {
            httpOnly: true,
            secure: config.nodeEnv === 'production',
            sameSite: 'lax',
            maxAge: config.refreshTokenExpiresDays * 24 * 60 * 60 * 1000
        });

        res.json({ accessToken });
    } catch (err) { next(err); }
});

// logout
router.post('/logout', async (req, res, next) => {
    try {
        const token = req.cookies?.rft;
        if (token) {
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            await RefreshToken.deleteOne({ tokenHash });
        }
        res.clearCookie('rft');
        res.json({ ok: true });
    } catch (err) { next(err); }
});

export default router;
