const mongoose = require('mongoose');

const ModelSchema = mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'admin_users' },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    source: { type: String, default: '' },
    referenceId: { type: String, default: '' },
    balanceAfter: { type: Number, default: 0 },
    meta: { type: Object, default: {} },
    createdAt: { type: Date, default: new Date() }
}, { autoIndex: true });

ModelSchema.set('toObject', { virtuals: true });
ModelSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('AdminTransactions', ModelSchema);
