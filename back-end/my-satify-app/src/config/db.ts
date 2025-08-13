import mongoose from 'mongoose';
import config from './index';

export const connectDB = async () => {
    await mongoose.connect(config.mongoUri);
    console.log('MongoDB connected');
};

