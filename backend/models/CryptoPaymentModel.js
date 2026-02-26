const mongoose = require('mongoose');

const CryptoPaymentSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    transactionHash: { type: String, unique: true, sparse: true },
    type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
    coinType: { type: String, required: true }, // BTC, ETH, BNB, TRX, USDT, USDC, etc.
    chain: { type: String, required: true }, // BTC, ETH, BNB, TRON, etc.
    tokenType: { type: String, enum: ['native', 'erc-20', 'bep-20', 'trc-20'], default: 'native' },
    amount: { type: Number, required: true },
    networkFee: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    totalFee: { type: Number, default: 0 },
    finalAmount: { type: Number },
    fromAddress: { type: String },
    toAddress: { type: String },
    status: { type: String, enum: ['pending', 'confirmed', 'failed', 'rejected'], default: 'pending' },
    confirmations: { type: Number, default: 0 },
    requiredConfirmations: { type: Number, default: 1 },
    blockNumber: { type: Number },
    errorMessage: { type: String },
    provider: { type: String, enum: ['tatum', 'manual', 'webhook'], default: 'tatum' },
    paymentId: { type: String }, // Reference to FlutterWave or other payment record
    externalResponse: { type: Object, default: {} },
    isDemo: { type: Boolean, default: false },
    completedAt: { type: Date },
    createdAt: { type: Date, default: new Date() }
}, { autoIndex: true, timestamps: true });

CryptoPaymentSchema.set('toObject', { virtuals: true });
CryptoPaymentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('CryptoPayments', CryptoPaymentSchema);
