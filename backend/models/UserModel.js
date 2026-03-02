const mongoose = require('mongoose');

const balanceObject = {
    data: [
        // only stablecoin USDT and platform token ZELO are kept
        { coinType: 'USDT', balance: 0, chain: 'ETH', type: 'erc-20' },
        { coinType: 'USDT', balance: 0, chain: 'BNB', type: 'bep-20' },
        { coinType: 'USDT', balance: 0, chain: 'TRON', type: 'trc-20' },
        { coinType: 'ZELO', balance: 0, chain: '', type: '' }
    ]
}

const ModelSchema = mongoose.Schema({
    userName: { type: String },
    userAvatar: { type: String, default: 'avatar1.png' },
    userLevel: { type: Number, default: '0' },
    userEmail: { type: String },
    userPassword: { type: String },
    userToken: { type: String },
    loginType: { type: String, enum: ['Google', 'Wallet', 'Email', 'Apple'], default: 'Email' },
    userNickName: { type: String, required: [true, 'Please input userNickName'] },
    type: { type: String, enum: ['user', 'admin'], default: 'user' },
    // new unified chips balances (numeric) ➜ replaces the old object arrays
    chipsBalance: { type: Number, default: 0 },
    demoChipsBalance: { type: Number, default: 0 },

    // legacy fields kept temporarily for migration; can be removed later
    balance: { type: Object, default: balanceObject },
    demoBalance: { type: Object, default: balanceObject }, // Demo mode balance (1000 of each token)
    demoMode: { type: Boolean, default: true }, // Users start in demo mode
    address: { type: Object },
    currency: { type: Object, default: { coinType: 'USDT', type: 'trc-20' } },
    profileSet: { type: Boolean, default: false },
    campaignCode: { type: String, default: '' },
}, { autoIndex: true, timestamps: true });

ModelSchema.set('toObject', { virtuals: true });
ModelSchema.set('toJSON', { virtuals: true });

ModelSchema.methods.updateToken = function (token) {
    this.token = token;
    return this.save();
}

module.exports = mongoose.model('Users', ModelSchema);