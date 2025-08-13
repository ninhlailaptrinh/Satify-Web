import dotenv from 'dotenv';
dotenv.config();

export default {
    port: Number(process.env.PORT || 5000),
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/satify_dev',
    jwtSecret: process.env.JWT_SECRET || 'dev_secret',
    accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES || '15m',
    refreshTokenExpiresDays: Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30),
    frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    frontendOrigins: (process.env.FRONTEND_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
    nodeEnv: process.env.NODE_ENV || 'development',
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
    adminBootstrapKey: process.env.ADMIN_BOOTSTRAP_KEY || ''
};

