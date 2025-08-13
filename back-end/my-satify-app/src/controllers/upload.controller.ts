import { Request, Response } from 'express';
import cloudinary from '../utils/cloudinary';
import { Readable } from 'stream';

export const uploadImage = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Upload trực tiếp từ buffer bằng stream
        const result: any = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'satify_uploads', resource_type: 'image' },
                (err, res) => {
                    if (err) return reject(err);
                    resolve(res);
                }
            );
            Readable.from(req.file!.buffer).pipe(stream);
        });

        return res.status(201).json({
            imageUrl: result.secure_url,
            publicId: result.public_id
        });
    } catch (err: any) {
        console.error('uploadImage error', err);
        const message = err?.message || 'Upload failed';
        return res.status(500).json({ message });
    }
};
