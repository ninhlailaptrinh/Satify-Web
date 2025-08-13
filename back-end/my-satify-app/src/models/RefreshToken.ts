import { Schema, model } from 'mongoose';

const refreshTokenSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default model('RefreshToken', refreshTokenSchema);
