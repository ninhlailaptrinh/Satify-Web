import { Schema, model } from 'mongoose';

const couponSchema = new Schema({
  code: { type: String, unique: true, index: true },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  expiresAt: { type: Date },
  maxUsage: { type: Number, default: 0 },
  usedCount: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default model('Coupon', couponSchema);
