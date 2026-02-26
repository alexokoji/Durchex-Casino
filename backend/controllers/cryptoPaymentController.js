const axios = require('axios');
const CryptoPaymentV2Model = require('../models/CryptoPaymentV2Model');
const UnifiedPaymentModel = require('../models/UnifiedPaymentModel');
const UserModel = require('../models/UserModel');

const BLOCKONOMICS_API_KEY = process.env.BLOCKONOMICS_API_KEY;
const BLOCKONOMICS_API_URL = process.env.BLOCKONOMICS_API_URL || 'https://www.blockonomics.co/api';

// Supported coins and their chain configs
const COIN_CONFIG = {
    'BTC': { chain: 'BTC', decimals: 8, requiredConfirmations: 2 },
    'ETH': { chain: 'ETH', decimals: 18, requiredConfirmations: 12 },
    'USDT': { chain: 'ETH', decimals: 6, requiredConfirmations: 12, isToken: true },
    'USDC': { chain: 'ETH', decimals: 6, requiredConfirmations: 12, isToken: true },
    'BNB': { chain: 'BSC', decimals: 18, requiredConfirmations: 10 },
    'TRX': { chain: 'TRON', decimals: 6, requiredConfirmations: 20 },
    'BUSD': { chain: 'BSC', decimals: 18, requiredConfirmations: 10, isToken: true }
};

// Generate deposit address using Blockonomics
exports.generateDepositAddress = async (req, res) => {
    try {
        const { userId, coinType, isDemo } = req.body;

        if (!userId || !coinType) {
            return res.status(400).json({ 
                status: false, 
                message: 'Missing required fields: userId, coinType' 
            });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        const config = COIN_CONFIG[coinType];
        if (!config) {
            return res.status(400).json({ 
                status: false, 
                message: `Unsupported coin type: ${coinType}` 
            });
        }

        // If demo mode, generate a mock address
        if (isDemo) {
            const mockAddress = `DEMO_${coinType}_${userId}_${Date.now()}`;
            
            const cryptoPayment = new CryptoPaymentV2Model({
                userId,
                coinType,
                chain: config.chain,
                depositAddress: mockAddress,
                amount: 0,
                status: 'pending',
                isDemo: true,
                requiredConfirmations: config.requiredConfirmations
            });

            const saved = await cryptoPayment.save();

            return res.json({
                status: true,
                message: 'Demo deposit address generated',
                data: {
                    depositAddress: mockAddress,
                    coinType,
                    chain: config.chain,
                    amount: 0,
                    status: 'pending',
                    isDemo: true,
                    expiresAt: saved.expiresAt
                }
            });
        }

        // Generate real address using Blockonomics API
        try {
            // Blockonomics uses a simple invoice/payment request system
            // We generate a unique address for each payment
            const invoiceData = {
                currency: config.currency,
                satoshis: 0, // Will be set when user specifies amount
                note: `PlayZelo Casino - User ${userId}`,
                notifyUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v0/payments/webhook/blockonomics`
            };

            // For now, we'll just generate a placeholder address and request one via API on first deposit
            const depositAddress = `blockonomics_${coinType}_${userId}_${Date.now()}`;

            // Create crypto payment record
            const cryptoPayment = new CryptoPaymentV2Model({
                userId,
                coinType,
                chain: config.chain,
                depositAddress,
                amount: 0,
                status: 'pending',
                isDemo: false,
                requiredConfirmations: config.requiredConfirmations,
                blockonomicsTransactionId: `pending_${Date.now()}`
            });

            const saved = await cryptoPayment.save();

            // Create unified payment record
            const unifiedPayment = new UnifiedPaymentModel({
                userId,
                paymentId: `CRYPTO-${saved._id}`,
                paymentMethod: 'crypto',
                cryptoPaymentId: saved._id,
                type: 'deposit',
                amountRequested: 0,
                currencyCode: coinType,
                status: 'pending'
            });

            await unifiedPayment.save();

            res.json({
                status: true,
                message: 'Deposit address generated successfully',
                data: {
                    paymentId: saved._id,
                    depositAddress,
                    coinType,
                    chain: config.chain,
                    amount: 0,
                    status: 'pending',
                    requiredConfirmations: config.requiredConfirmations,
                    expiresAt: saved.expiresAt
                }
            });

        } catch (error) {
            console.error('❌ Blockonomics API error:', error.response?.data || error.message);
            const remoteMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message;
            return res.status(500).json({
                status: false,
                message: 'Failed to generate deposit address',
                error: remoteMessage
            });
        }

    } catch (error) {
        console.error('❌ Generate deposit address error:', error.message);
        res.status(500).json({ 
            status: false, 
            message: 'Failed to generate deposit address',
            error: error.message 
        });
    }
};

// Get deposit address status
exports.getDepositAddressStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const cryptoPayment = await CryptoPaymentV2Model.findById(paymentId);
        if (!cryptoPayment) {
            return res.status(404).json({ status: false, message: 'Payment not found' });
        }

        // If still pending and not confirmed within 24 hours, mark as expired
        if (cryptoPayment.status === 'pending' && cryptoPayment.expiresAt < new Date()) {
            cryptoPayment.status = 'expired';
            await cryptoPayment.save();
        }

        res.json({
            status: true,
            data: {
                paymentId: cryptoPayment._id,
                depositAddress: cryptoPayment.depositAddress,
                coinType: cryptoPayment.coinType,
                chain: cryptoPayment.chain,
                amount: cryptoPayment.amount,
                confirmations: cryptoPayment.confirmations,
                requiredConfirmations: cryptoPayment.requiredConfirmations,
                status: cryptoPayment.status,
                transactionHash: cryptoPayment.transactionHash,
                confirmedAt: cryptoPayment.confirmedAt,
                isDemo: cryptoPayment.isDemo
            }
        });

    } catch (error) {
        console.error('❌ Get deposit address status error:', error.message);
        res.status(500).json({ 
            status: false, 
            message: 'Failed to get deposit address status',
            error: error.message 
        });
    }
};

// Handle crypto webhook (from Blockonomics)
exports.handleBlockonomicsWebhook = async (req, res) => {
    try {
        const { txId, blockHash, currency } = req.body;

        console.log(`📦 Crypto webhook received: ${currency} - ${txId}`);

        // Find the crypto payment by transaction hash
        const cryptoPayment = await CryptoPaymentV2Model.findOne({
            transactionHash: txId,
            status: 'pending'
        });

        if (!cryptoPayment) {
            console.log('⚠️ Crypto payment not found or already processed:', txId);
            return res.json({ status: true, message: 'Webhook processed' });
        }

        // Update with block info
        cryptoPayment.blockNumber = blockHash;
        cryptoPayment.confirmations = (req.body.confirmations || 1);
        
        // Check if confirmed
        if (cryptoPayment.confirmations >= cryptoPayment.requiredConfirmations) {
            cryptoPayment.status = 'confirmed';
            cryptoPayment.confirmedAt = new Date();

            await cryptoPayment.save();

            // Update unified payment
            await UnifiedPaymentModel.findByIdAndUpdate(
                cryptoPayment.unifiedPaymentId,
                { 
                    status: 'completed',
                    amountReceived: cryptoPayment.amount,
                    completedAt: new Date()
                }
            );

            // Add funds to user account
            const user = await UserModel.findById(cryptoPayment.userId);
            if (user) {
                if (!user.demoBalance) user.demoBalance = { data: [] };
                
                let currencyBalance = user.demoBalance.data.find(b => 
                    b.currency === cryptoPayment.coinType
                );
                
                if (!currencyBalance) {
                    currencyBalance = { currency: cryptoPayment.coinType, balance: 0 };
                    user.demoBalance.data.push(currencyBalance);
                }

                currencyBalance.balance += cryptoPayment.amount;
                user.markModified('demoBalance');
                await user.save();

                console.log(`✅ Added ${cryptoPayment.amount} ${cryptoPayment.coinType} to user ${cryptoPayment.userId}`);
            }
        } else {
            await cryptoPayment.save();
            console.log(`⏳ Confirmations: ${cryptoPayment.confirmations}/${cryptoPayment.requiredConfirmations}`);
        }

        res.json({ status: true, message: 'Webhook processed successfully' });

    } catch (error) {
        console.error('❌ Crypto webhook error:', error.message);
        res.status(500).json({ 
            status: false, 
            message: 'Webhook processing failed',
            error: error.message 
        });
    }
};

// Simulate crypto deposit (for demo/testing)
exports.simulateCryptoDeposit = async (req, res) => {
    try {
        const { userId, coinType, chain, amount } = req.body;

        if (!userId || !coinType || !chain || !amount) {
            return res.status(400).json({ 
                status: false, 
                message: 'Missing required fields: userId, coinType, chain, amount' 
            });
        }

        // Find or create deposit for simulation
        let cryptoPayment = await CryptoPaymentV2Model.findOne({
            userId,
            coinType,
            chain,
            isDemo: true,
            status: 'pending'
        });

        if (!cryptoPayment) {
            cryptoPayment = new CryptoPaymentV2Model({
                userId,
                coinType,
                chain,
                depositAddress: `DEMO_${coinType}_${userId}`,
                amount,
                isDemo: true,
                status: 'pending',
                requiredConfirmations: 1
            });
        } else {
            cryptoPayment.amount = amount;
        }

        cryptoPayment.transactionHash = `DEMO_TX_${Date.now()}`;
        cryptoPayment.confirmations = cryptoPayment.requiredConfirmations;
        cryptoPayment.status = 'confirmed';
        cryptoPayment.confirmedAt = new Date();

        const saved = await cryptoPayment.save();

        // Update unified payment
        let unifiedPayment = await UnifiedPaymentModel.findOne({
            cryptoPaymentId: saved._id
        });

        if (!unifiedPayment) {
            unifiedPayment = new UnifiedPaymentModel({
                userId,
                paymentId: `CRYPTO-${saved._id}`,
                paymentMethod: 'crypto',
                cryptoPaymentId: saved._id,
                type: 'deposit',
                amountRequested: amount,
                currencyCode: coinType,
                status: 'completed',
                completedAt: new Date()
            });
        } else {
            unifiedPayment.amountReceived = amount;
            unifiedPayment.status = 'completed';
            unifiedPayment.completedAt = new Date();
        }

        await unifiedPayment.save();

        // Add funds to user
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        if (!user.demoBalance) user.demoBalance = { data: [] };

        let currencyBalance = user.demoBalance.data.find(b => b.currency === coinType);
        if (!currencyBalance) {
            currencyBalance = { currency: coinType, balance: 0 };
            user.demoBalance.data.push(currencyBalance);
        }

        currencyBalance.balance += amount;
        user.markModified('demoBalance');
        await user.save();

        res.json({
            status: true,
            message: `✅ ${amount} ${coinType} deposited successfully!`,
            data: {
                paymentId: saved._id,
                amount,
                coinType,
                chain,
                status: 'confirmed',
                transactionHash: saved.transactionHash,
                newBalance: currencyBalance.balance
            }
        });

    } catch (error) {
        console.error('❌ Simulate crypto deposit error:', error.message);
        res.status(500).json({ 
            status: false, 
            message: 'Failed to simulate deposit',
            error: error.message 
        });
    }
};

// List user crypto transactions
exports.getUserCryptoTransactions = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        const transactions = await CryptoPaymentV2Model.find({ userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await CryptoPaymentV2Model.countDocuments({ userId });

        res.json({
            status: true,
            data: transactions,
            pagination: { total, limit: parseInt(limit), skip: parseInt(skip) }
        });

    } catch (error) {
        console.error('❌ Get user crypto transactions error:', error.message);
        res.status(500).json({ 
            status: false, 
            message: 'Failed to get transactions',
            error: error.message 
        });
    }
};

// ==================== BLOCKONOMICS (DEPRECATED - Replaced by NOWPayments) ====================
// All Blockonomics integration has been replaced with NOWPayments
// Legacy exports removed - use nowpaymentsController instead