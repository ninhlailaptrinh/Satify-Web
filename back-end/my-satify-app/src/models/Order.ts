import { Schema, model } from 'mongoose';

const orderSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    items: [{
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        qty: Number,
        price: Number
    }],
    total: Number,
    status: { type: String, default: 'created' }
}, { timestamps: true });

export default model('Order', orderSchema);
