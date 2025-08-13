import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

(async () => {
    try {
        const res = await cloudinary.uploader.upload('sample.png', { folder: 'test' });
        console.log('Upload thành công:', res.secure_url);
    } catch (err) {
        console.error('Lỗi upload:', err);
    }
})();
