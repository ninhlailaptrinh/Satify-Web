import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from './config';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import errorHandler from './middlewares/errorHandler';
import uploadRoutes from './routes/upload';
import ordersRoutes from './routes/orders';
import usersRoutes from './routes/users';
import reviewsRoutes from './routes/reviews';
import statsRoutes from './routes/stats';
import vnpayRoutes from './routes/payments.vnpay';

const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const explicitAllowedOrigins = new Set<string>([
      ...(config.frontendOrigins || []),
      config.frontendOrigin,
    ].filter(Boolean) as string[]);

    if (explicitAllowedOrigins.has(origin)) {
      return callback(null, true);
    }

    // Allow Vercel preview and production domains
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60 * 1000, max: 200 }));
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/payments/vnpay', vnpayRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.get('/health', (_, res) => res.json({ ok: true }));

app.use(errorHandler);

export default app;
