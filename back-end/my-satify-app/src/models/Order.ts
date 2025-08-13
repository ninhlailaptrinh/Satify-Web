import { Schema, model } from 'mongoose';

const orderSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    items: [{
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        qty: Number,
        price: Number
    }],
    total: Number,
    status: { type: String, default: 'created' },
    shippingAddress: {
        name: String,
        phone: String,
        address: String,
        note: String
    }
}, { timestamps: true });

export default model('Order', orderSchema);
