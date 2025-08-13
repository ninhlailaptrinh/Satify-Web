import { Request, Response } from 'express';
import cloudinary from '../utils/cloudinary';
import fs from 'fs';

export const uploadImage = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Upload buffer tạm sang file (Cloudinary yêu cầu path hoặc stream)
        const tmpPath = `/tmp/${Date.now()}-${req.file.originalname}`;
        fs.writeFileSync(tmpPath, req.file.buffer);

        const result = await cloudinary.uploader.upload(tmpPath, {
            folder: 'satify_uploads', // folder trong Cloudinary
            resource_type: 'image'
        });

        fs.unlinkSync(tmpPath); // xóa file tạm

        return res.status(201).json({
            imageUrl: result.secure_url,
            publicId: result.public_id
        });
    } catch (err) {
        console.error('uploadImage error', err);
        return res.status(500).json({ message: 'Upload failed' });
    }
};
