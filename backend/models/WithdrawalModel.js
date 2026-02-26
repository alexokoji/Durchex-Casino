const mongoose = require('mongoose');

const ModelSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    coinType: { type: String, required: true }, // BTC, ETH, BNB, etc.
    chain: { type: String, required: true }, // BTC, ETH, BNB, TRON
    tokenType: { type: String, default: 'native' }, // native, erc-20, bep-20, trc-20
    amount: { type: Number, required: true },
    networkFee: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    totalFee: { type: Number, required: true },
    finalAmount: { type: Number, required: true }, // amount after fees
    toAddress: { type: String, required: true },
    fromAddress: { type: String, required: true },
    transactionHash: { type: String, default: '' },
    status: { 
        type: String, 
        enum: ['pending', 'processing', 'confirmed', 'failed', 'cancelled'], 
        default: 'pending' 
    },
    confirmations: { type: Number, default: 0 },
    estimatedArrival: { type: Date, default: () => new Date(Date.now() + 3600000) }, // 1 hour default
    completedAt: { type: Date, default: null },
    failureReason: { type: String, default: '' },
    isDemo: { type: Boolean, default: false }, // Track if demo withdrawal
    notes: { type: String, default: '' }
}, { autoIndex: true, timestamps: true });

ModelSchema.set('toObject', { virtuals: true });
ModelSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Withdrawals', ModelSchema);
