const mongoose = require('mongoose');

const FlutterWavePaymentSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    transactionId: { type: String, unique: true, sparse: true }, // Flutterwave tx_id
    reference: { type: String, unique: true }, // Flutterwave reference
    type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
    paymentMethod: { type: String, enum: ['card', 'bank', 'mobile_money', 'ussd'], required: true },
    currency: { type: String, required: true }, // NGN, USD, GHS, etc.
    amount: { type: Number, required: true },
    chargeAmount: { type: Number, default: 0 }, // Flutterwave charge
    netAmount: { type: Number }, // Amount after fees
    status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
    paymentStatus: { type: String }, // Flutterwave payment status
    customerEmail: { type: String },
    customerPhone: { type: String },
    customerName: { type: String },
    metadata: { type: Object, default: {} },
    flutterResponse: { type: Object, default: {} }, // Full Flutterwave response
    errorMessage: { type: String },
    retryCount: { type: Number, default: 0 },
    completedAt: { type: Date },
    createdAt: { type: Date, default: new Date() }
}, { autoIndex: true, timestamps: true });

FlutterWavePaymentSchema.set('toObject', { virtuals: true });
FlutterWavePaymentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('FlutterWavePayments', FlutterWavePaymentSchema);
