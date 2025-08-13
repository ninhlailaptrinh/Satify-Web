import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
    user?: IUser | null;
    auth?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    if (!token) return res.status(401).json({ message: 'Missing token' });

    try {
        const payload = verifyToken(token) as any;
        const user = await User.findById(payload.sub).select('-password');
        if (!user) return res.status(401).json({ message: 'Invalid token' });
        req.user = user;
        req.auth = payload;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

export const requireRole = (role: 'admin' | 'user') => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
        if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
        next();
    };
};

