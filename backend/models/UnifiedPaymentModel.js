const mongoose = require('mongoose');

const ModelSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    paymentId: { type: String, unique: true, required: true }, // Unified ID
    
    // Payment method
    paymentMethod: { type: String, enum: ['flutterwave', 'crypto'], required: true },
    
    // References to specific payment types
    flutterwaveTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'FlutterwaveTransactions' },
    cryptoPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'CryptoPayments' },
    
    type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
    
    // Amount info (in user's preferred currency for display)
    amountRequested: { type: Number, required: true },
    amountReceived: { type: Number }, // After fees/conversion
    currencyCode: { type: String }, // USD, NGN, BTC, ETH, etc.
    
    // Status
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'], default: 'pending' },
    statusDetails: { type: String },
    
    // Metadata
    description: { type: String },
    metadata: { type: Object, default: {} },
    
    // Timestamps
    initiatedAt: { type: Date, default: new Date() },
    completedAt: { type: Date },
    failedAt: { type: Date }
}, { autoIndex: true, timestamps: true });

ModelSchema.set('toObject', { virtuals: true });
ModelSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('UnifiedPayments', ModelSchema);
