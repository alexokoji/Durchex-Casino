const axios = require('axios');
const models = require('../models');
const SocketManager = require('../socket/Manager');

const TATUM_API_KEY = process.env.TATUM_API_KEY;
const TATUM_BASE_URL = process.env.TATUM_ENV === 'production'
    ? 'https://api.tatum.io/v3'
    : 'https://api-eu1.tatum.io/v3';

const SUPPORTED_COINS = {
    BTC: { displayName: 'Bitcoin', chain: 'BTC', decimals: 8 },
    ETH: { displayName: 'Ethereum', chain: 'ETH', decimals: 18 },
    BNB: { displayName: 'Binance Coin', chain: 'BSC', decimals: 18 },
    TRX: { displayName: 'TRON', chain: 'TRON', decimals: 6 },
    USDT: { displayName: 'Tether', chain: 'ETH', decimals: 6, contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
    USDC: { displayName: 'USD Coin', chain: 'ETH', decimals: 6, contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' }
};

/**
 * Create deposit address for crypto
 */
exports.createDepositAddress = async (req, res) => {
    try {
        const { userId, coinType } = req.body;

        if (!userId || !coinType || !SUPPORTED_COINS[coinType]) {
            return res.json({ status: false, message: 'Invalid coin type' });
        }

        const user = await models.userModel.findById(userId);
        if (!user) {
            return res.json({ status: false, message: 'User not found' });
        }

        const coin = SUPPORTED_COINS[coinType];

        try {
            // Generate address via Tatum
            let endpoint = '';
            let payload = { description: `PlayZelo ${coinType} deposit for user ${userId}` };

            switch (coinType) {
                case 'BTC':
                    endpoint = '/offchain/account';
                    payload.currency = 'BTC';
                    break;
                case 'ETH':
                case 'USDT':
                case 'USDC':
                    endpoint = '/offchain/account';
                    payload.currency = 'ETH';
                    break;
                case 'BNB':
                    endpoint = '/offchain/account';
                    payload.currency = 'BSC';
                    break;
                case 'TRX':
                    endpoint = '/offchain/account';
                    payload.currency = 'TRON';
                    break;
            }

            const accountResponse = await axios.post(
                `${TATUM_BASE_URL}${endpoint}`,
                payload,
                { headers: { 'x-api-key': TATUM_API_KEY } }
            );

            const account = accountResponse.data;

            // Create payment record
            const payment = await new models.cryptoPaymentModel({
                userId,
                coinType,
                chain: coin.chain,
                amount: 0,
                status: 'awaiting_deposit',
                depositAddress: account.xpub || account.address || account.id,
                provider: 'tatum',
                externalResponse: account
            }).save();

            return res.json({
                status: true,
                data: {
                    depositAddress: account.xpub || account.address || account.id,
                    coinType,
                    chain: coin.chain,
                    paymentId: payment._id
                }
            });
        } catch (err) {
            console.error('Tatum address creation error:', err.message);
            return res.json({ status: false, message: 'Failed to generate deposit address' });
        }
    } catch (err) {
        console.error('createDepositAddress error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

/**
 * Crypto deposit webhook handler (for Tatum or manual webhooks)
 */
exports.cryptoWebhook = async (req, res) => {
    try {
        const { txHash, coinType, toAddress, fromAddress, amount, chain, confirmations, blockHeight } = req.body;

        if (!txHash || !coinType || !toAddress || !amount) {
            return res.json({ status: false, message: 'Missing required fields' });
        }

        const coin = SUPPORTED_COINS[coinType];
        if (!coin) {
            return res.json({ status: false, message: 'Unsupported coin' });
        }

        // Find payment by deposit address
        let payment = await models.cryptoPaymentModel.findOne({ 
            depositAddress: toAddress,
            coinType
        });

        if (!payment) {
            // Create new payment record
            payment = await new models.cryptoPaymentModel({
                coinType,
                chain: chain || coin.chain,
                transactionHash: txHash,
                amount,
                status: 'pending_confirmation',
                depositAddress: toAddress,
                fromAddress,
                confirmations: confirmations || 0,
                requiredConfirmations: 6,
                provider: 'webhook',
                externalResponse: req.body
            }).save();
        } else {
            // Update existing payment
            payment.transactionHash = txHash;
            payment.amount = amount;
            payment.fromAddress = fromAddress;
            payment.confirmations = confirmations || 0;
            payment.blockHeight = blockHeight;
            payment.externalResponse = req.body;
            
            // Check confirmation status
            if (confirmations >= payment.requiredConfirmations) {
                payment.status = 'completed';
                payment.confirmedAt = new Date();
            } else {
                payment.status = 'pending_confirmation';
            }
            
            await payment.save();
        }

        // If confirmed, update user balance
        if (payment.status === 'completed' && payment.userId) {
            const user = await models.userModel.findById(payment.userId);
            if (user) {
                const balanceData = user.balance || { data: [] };
                let coinEntry = balanceData.data.find(b => 
                    b.coinType === coinType && b.chain === (chain || coin.chain)
                );

                if (coinEntry) {
                    coinEntry.balance = Number(coinEntry.balance || 0) + amount;
                } else {
                    balanceData.data.push({
                        coinType,
                        balance: amount,
                        chain: chain || coin.chain,
                        type: coinType.includes('USD') ? 'erc-20' : 'native'
                    });
                }

                user.balance = balanceData;
                user.markModified('balance');
                await user.save();
                SocketManager.userDepositSuccess(user);
            }
        }

        return res.json({
            status: true,
            data: {
                paymentId: payment._id,
                status: payment.status,
                confirmations: payment.confirmations
            }
        });
    } catch (err) {
        console.error('cryptoWebhook error:', err.message);
        return res.status(500).json({ status: false, message: 'Server Error' });
    }
};

/**
 * Get deposit address status
 */
exports.getDepositStatus = async (req, res) => {
    try {
        const { paymentId } = req.body;

        if (!paymentId) {
            return res.json({ status: false, message: 'Invalid payment ID' });
        }

        const payment = await models.cryptoPaymentModel.findById(paymentId);
        if (!payment) {
            return res.json({ status: false, message: 'Payment not found' });
        }

        return res.json({
            status: true,
            data: {
                coinType: payment.coinType,
                depositAddress: payment.depositAddress,
                paymentStatus: payment.status,
                amount: payment.amount,
                confirmations: payment.confirmations,
                requiredConfirmations: payment.requiredConfirmations,
                txHash: payment.transactionHash
            }
        });
    } catch (err) {
        console.error('getDepositStatus error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

/**
 * Initiate crypto withdrawal
 */
exports.initiateWithdrawal = async (req, res) => {
    try {
        const { userId, coinType, toAddress, amount } = req.body;

        if (!userId || !coinType || !toAddress || !amount) {
            return res.json({ status: false, message: 'Missing required fields' });
        }

        const coin = SUPPORTED_COINS[coinType];
        if (!coin) {
            return res.json({ status: false, message: 'Unsupported coin' });
        }

        const user = await models.userModel.findById(userId);
        if (!user) {
            return res.json({ status: false, message: 'User not found' });
        }

        // Check balance
        const balanceData = user.balance || { data: [] };
        const coinBalance = balanceData.data.find(b => b.coinType === coinType);
        
        if (!coinBalance || coinBalance.balance < amount) {
            return res.json({ status: false, message: 'Insufficient balance' });
        }

        // Create withdrawal payment record
        const payment = await new models.cryptoPaymentModel({
            userId,
            coinType,
            chain: coin.chain,
            amount,
            status: 'pending_approval',
            toAddress,
            type: 'withdrawal',
            provider: 'manual'
        }).save();

        // Deduct from balance
        coinBalance.balance -= amount;
        user.balance = balanceData;
        user.markModified('balance');
        await user.save();

        return res.json({
            status: true,
            data: {
                paymentId: payment._id,
                status: 'pending_approval',
                amount,
                coinType,
                toAddress
            }
        });
    } catch (err) {
        console.error('initiateWithdrawal error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

/**
 * Process crypto withdrawal (admin/system only)
 */
exports.processWithdrawal = async (req, res) => {
    try {
        const { paymentId, txHash, networkFee } = req.body;

        if (!paymentId) {
            return res.json({ status: false, message: 'Invalid payment ID' });
        }

        const payment = await models.cryptoPaymentModel.findById(paymentId);
        if (!payment || payment.type !== 'withdrawal') {
            return res.json({ status: false, message: 'Invalid withdrawal' });
        }

        // Update payment with tx hash and fees
        payment.transactionHash = txHash;
        payment.networkFee = networkFee || 0;
        payment.status = 'completed';
        payment.confirmedAt = new Date();
        await payment.save();

        return res.json({
            status: true,
            data: {
                paymentId: payment._id,
                status: 'completed',
                txHash
            }
        });
    } catch (err) {
        console.error('processWithdrawal error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

/**
 * Get crypto payment history
 */
exports.getPaymentHistory = async (req, res) => {
    try {
        const { userId, coinType, type, limit = 50, skip = 0 } = req.body;

        if (!userId) {
            return res.json({ status: false, message: 'Invalid request' });
        }

        const query = { userId };
        if (coinType) query.coinType = coinType;
        if (type) query.type = type;

        const payments = await models.cryptoPaymentModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const total = await models.cryptoPaymentModel.countDocuments(query);

        return res.json({
            status: true,
            data: payments,
            pagination: { total, limit, skip }
        });
    } catch (err) {
        console.error('getPaymentHistory error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

/**
 * Get supported coins
 */
exports.getSupportedCoins = async (req, res) => {
    try {
        const coins = Object.entries(SUPPORTED_COINS).map(([key, value]) => ({
            code: key,
            ...value
        }));

        return res.json({
            status: true,
            data: coins
        });
    } catch (err) {
        console.error('getSupportedCoins error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};
