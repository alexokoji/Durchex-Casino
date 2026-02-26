const mongoose = require('mongoose');

const ModelSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    transactionRef: { type: String, unique: true, required: true }, // Flutterwave reference
    flutterwaveId: { type: String }, // Flutterwave transaction ID
    amount: { type: Number, required: true }, // Amount in customer's currency
    currency: { type: String, required: true }, // e.g., USD, NGN, GHS
    type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
    paymentMethod: { type: String, enum: ['card', 'bank_transfer', 'mobile_money', 'ussd'], default: 'card' },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'initiated'], default: 'pending' },
    statusDetails: { type: String }, // Details about current status
    
    // Customer details
    customerEmail: { type: String },
    customerName: { type: String },
    customerPhone: { type: String },
    
    // Bank/Withdrawal info
    recipientBankCode: { type: String }, // For withdrawals
    recipientAccountNumber: { type: String }, // For withdrawals
    recipientAccountName: { type: String }, // For withdrawals
    bankInfo: { type: Object, default: {} }, // Bank transfer details
    
    // Payment details
    redirectUrl: { type: String },
    paymentLink: { type: String },
    
    // Metadata
    description: { type: String },
    metadata: { type: Object, default: {} },
    
    // Unified payment reference
    unifiedPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'UnifiedPayments' },
    
    // Timestamps
    initiatedAt: { type: Date, default: new Date() },
    completedAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String },
    confirmedAt: { type: Date },    
    // Webhook response
    webhookData: { type: Object, default: {} }
}, { autoIndex: true, timestamps: true });

ModelSchema.set('toObject', { virtuals: true });
ModelSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('FlutterwaveTransactions', ModelSchema);