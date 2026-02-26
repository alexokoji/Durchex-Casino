const mongoose = require('mongoose');

const ModelSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    
    // Crypto specifics
    coinType: { type: String, required: true }, // BTC, ETH, USDT, USDC, BNB, TRX
    chain: { type: String, required: true }, // BTC, ETH, BSC, TRON, POLYGON
    
    // Deposit info
    depositAddress: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    
    // On-chain details
    transactionHash: { type: String, default: '', index: true },
    blockNumber: { type: Number },
    confirmations: { type: Number, default: 0 },
    requiredConfirmations: { type: Number, default: 1 }, // Different per coin
    
    // Status tracking
    status: { type: String, enum: ['pending', 'confirmed', 'failed', 'expired'], default: 'pending' },
    statusDetails: { type: String },
    
    // Timing
    addressGeneratedAt: { type: Date, default: new Date() },
    confirmedAt: { type: Date },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 86400000) }, // 24 hours
    
    // Demo flag
    isDemo: { type: Boolean, default: false },
    
    // Gateway info (Blockonomics - DEPRECATED)
    blockonomicsTransactionId: { type: String },
    
    // Gateway info (NOWPayments)
    nowpaymentsPaymentId: { type: String, index: true },
    ipnData: { type: Object }, // Raw IPN notification data
    receivedAmount: { type: Number, default: 0 },
    
    // Withdrawal flag/ref id for reverse flow
    isWithdrawal: { type: Boolean, default: false },
    
    // Unified payment reference
    unifiedPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'UnifiedPayments' },
    
    notes: { type: String, default: '' }
}, { autoIndex: true, timestamps: true });

// Create index on expiresAt for auto-deletion after 7 days
ModelSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 604800 }); // 7 days

ModelSchema.set('toObject', { virtuals: true });
ModelSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('CryptoPaymentsV2', ModelSchema);
