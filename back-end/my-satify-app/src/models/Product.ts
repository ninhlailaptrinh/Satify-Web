import { Schema, model } from 'mongoose';

const productSchema = new Schema({
    name: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    image: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    category: { type: String, default: 'general' },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
}, { timestamps: true });

export default model('Product', productSchema);
