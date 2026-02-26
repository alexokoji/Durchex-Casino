const mongoose = require('mongoose');

const ModelSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    coinType: { type: String, required: true }, // BTC, ETH, BNB, etc.
    chain: { type: String, required: true }, // BTC, ETH, BNB, TRON
    tokenType: { type: String, default: 'native' }, // native, erc-20, bep-20, trc-20
    amount: { type: Number, default: 0 },
    depositAddress: { type: String, required: true },
    transactionHash: { type: String, default: '' },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    },
    confirmations: { type: Number, default: 0 },
    requiredConfirmations: { type: Number, default: 1 }, // Different per coin
    confirmedAt: { type: Date, default: null },
    isDemo: { type: Boolean, default: false }, // Track if demo deposit
    expiresAt: { type: Date, default: () => new Date(Date.now() + 86400000) }, // 24 hours
    notes: { type: String, default: '' }
}, { autoIndex: true, timestamps: true });

ModelSchema.set('toObject', { virtuals: true });
ModelSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Deposits', ModelSchema);
