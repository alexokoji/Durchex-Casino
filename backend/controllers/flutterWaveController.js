const axios = require('axios');
const crypto = require('crypto');
const models = require('../models');
const SocketManager = require('../socket/Manager');

// treat both 'production' and 'live' as the same (live key uses 'live' in .env)
// using v3 endpoint since even v4 keys are currently accepted there
const FLUTTERWAVE_BASE_URL = ['production','live'].includes(process.env.FLUTTERWAVE_ENV)
    ? 'https://api.flutterwave.com/v3'
    : 'https://api.staging.flutterwave.com/v3';

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY;

/**
 * Initialize Flutterwave deposit
 */
exports.initializeDeposit = async (req, res) => {
    try {
        const { userId, amount, currency, paymentMethod, customerEmail, customerPhone, customerName } = req.body;

        if (!userId || !amount || !currency || !paymentMethod) {
            return res.json({ status: false, message: 'Missing required fields' });
        }

        const user = await models.userModel.findById(userId);
        if (!user) {
            return res.json({ status: false, message: 'User not found' });
        }

        // Create payment record
        const txRef = `TX_${userId}_${Date.now()}`;
        const payment = await new models.flutterWavePaymentModel({
            userId,
            reference: txRef,
            type: 'deposit',
            paymentMethod,
            currency,
            amount,
            status: 'pending',
            customerEmail,
            customerPhone,
            customerName
        }).save();

        // Initiate Flutterwave payment
        const payloadData = {
            tx_ref: txRef,
            amount,
            currency,
            payment_options: paymentMethod,
            redirect_url: `${process.env.FRONTEND_URL}/payment/callback`,
            customer: {
                email: customerEmail,
                phonenumber: customerPhone,
                name: customerName
            },
            customizations: {
                title: 'PlayZelo Casino Deposit',
                description: `Deposit ${amount} ${currency}`
            },
            meta: {
                userId: userId.toString(),
                paymentId: payment._id.toString()
            }
        };

        // initialize payment - v4 still requires secret key for this endpoint
        const response = await axios.post(
            `${FLUTTERWAVE_BASE_URL}/payments`,
            payloadData,
            { headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` } }
        );

        if (response.data.status === 'success') {
            return res.json({
                status: true,
                data: {
                    paymentLink: response.data.data.link,
                    reference: txRef,
                    paymentId: payment._id,
                    authorizationUrl: response.data.data.authorization_url
                }
            });
        } else {
            await models.flutterWavePaymentModel.findByIdAndUpdate(payment._id, { 
                status: 'failed',
                errorMessage: response.data.message 
            });
            return res.json({ status: false, message: 'Failed to initialize payment' });
        }
    } catch (err) {
        console.error('initializeDeposit error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

/**
 * Verify Flutterwave payment
 */
exports.verifyPayment = async (req, res) => {
    try {
        const { reference } = req.body;

        if (!reference) {
            return res.json({ status: false, message: 'Missing reference' });
        }

        // verification and other sensitive calls require the secret key
        const response = await axios.get(
            `${FLUTTERWAVE_BASE_URL}/transactions/verify_by_reference?tx_ref=${reference}`,
            { headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` } }
        );

        if (response.data.status === 'success') {
            const txData = response.data.data;
            
            // Update payment record
            const payment = await models.flutterWavePaymentModel.findOne({ reference });
            
            if (payment) {
                payment.transactionId = txData.id;
                payment.status = txData.status === 'successful' ? 'completed' : 'failed';
                payment.paymentStatus = txData.status;
                payment.chargeAmount = txData.charge || 0;
                payment.netAmount = txData.amount - (txData.charge || 0);
                payment.flutterResponse = txData;
                payment.completedAt = txData.status === 'successful' ? new Date() : null;
                await payment.save();

                // Update user balance if successful
                if (txData.status === 'successful') {
                    const user = await models.userModel.findById(payment.userId);
                    if (user) {
                        // Convert to user's display currency (assume USDT for now)
                        const balanceData = user.balance || { data: [] };
                        const usdtEntry = balanceData.data.find(b => b.coinType === 'USDT');
                        
                        if (usdtEntry) {
                            usdtEntry.balance = Number(usdtEntry.balance || 0) + payment.netAmount;
                        } else {
                            balanceData.data.push({ 
                                coinType: 'USDT', 
                                balance: payment.netAmount, 
                                chain: 'ETH', 
                                type: 'erc-20' 
                            });
                        }
                        
                        user.balance = balanceData;
                        await user.save();
                        SocketManager.userDepositSuccess(user);
                    }
                }

                return res.json({
                    status: true,
                    data: {
                        paymentStatus: payment.status,
                        amount: payment.netAmount,
                        reference: payment.reference
                    }
                });
            } else {
                return res.json({ status: false, message: 'Payment record not found' });
            }
        } else {
            return res.json({ status: false, message: 'Payment verification failed' });
        }
    } catch (err) {
        console.error('verifyPayment error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

/**
 * Flutterwave webhook handler
 */
exports.flutterWaveWebhook = async (req, res) => {
    try {
        const secretHash = req.headers['verificationhash'];
        
        // Verify webhook signature
        const hash = crypto
            .createHmac('sha256', FLUTTERWAVE_SECRET_KEY)
            .update(JSON.stringify(req.body))
            .digest('base64');

        if (hash !== secretHash) {
            console.error('Invalid webhook signature');
            return res.status(401).json({ status: false, message: 'Invalid signature' });
        }

        const { data, event } = req.body;

        if (event === 'charge.completed') {
            // Update payment record
            const payment = await models.flutterWavePaymentModel.findOne({ 
                transactionId: data.id 
            });

            if (payment && data.status === 'successful') {
                payment.status = 'completed';
                payment.paymentStatus = data.status;
                payment.completedAt = new Date();
                payment.flutterResponse = data;
                await payment.save();

                // Update user balance
                const user = await models.userModel.findById(payment.userId);
                if (user) {
                    const balanceData = user.balance || { data: [] };
                    const usdtEntry = balanceData.data.find(b => b.coinType === 'USDT');
                    
                    if (usdtEntry) {
                        usdtEntry.balance = Number(usdtEntry.balance || 0) + payment.netAmount;
                    } else {
                        balanceData.data.push({ 
                            coinType: 'USDT', 
                            balance: payment.netAmount, 
                            chain: 'ETH', 
                            type: 'erc-20' 
                        });
                    }
                    
                    user.balance = balanceData;
                    await user.save();
                    SocketManager.userDepositSuccess(user);
                }
            }
        }

        res.json({ status: true });
    } catch (err) {
        console.error('flutterWaveWebhook error:', err.message);
        res.status(500).json({ status: false, message: 'Server Error' });
    }
};

/**
 * Initiate Flutterwave withdrawal
 */
exports.initiateWithdrawal = async (req, res) => {
    try {
        const { userId, amount, accountNumber, accountBank, bankCode, currency, narration } = req.body;

        if (!userId || !amount || !accountNumber || !bankCode) {
            return res.json({ status: false, message: 'Missing required fields' });
        }

        const user = await models.userModel.findById(userId);
        if (!user) {
            return res.json({ status: false, message: 'User not found' });
        }

        // Check balance
        const balanceData = user.balance || { data: [] };
        const usdtEntry = balanceData.data.find(b => b.coinType === 'USDT');
        
        if (!usdtEntry || usdtEntry.balance < amount) {
            return res.json({ status: false, message: 'Insufficient balance' });
        }

        // Create withdrawal record
        const reference = `WD_${userId}_${Date.now()}`;
        const withdrawal = await new models.flutterWavePaymentModel({
            userId,
            reference,
            type: 'withdrawal',
            paymentMethod: 'bank',
            currency,
            amount,
            status: 'pending',
            metadata: {
                accountNumber,
                bankCode,
                accountBank,
                narration
            }
        }).save();

        // Initiate Flutterwave transfer
        const transferPayload = {
            account_number: accountNumber,
            account_bank: bankCode,
            amount,
            narration: narration || 'PlayZelo Withdrawal',
            currency,
            reference
        };

        // transfers must also use the secret key (path unchanged in v4)
        const response = await axios.post(
            `${FLUTTERWAVE_BASE_URL}/transfers`,
            transferPayload,
            { headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` } }
        );

        if (response.data.status === 'success') {
            // Deduct from balance
            usdtEntry.balance -= amount;
            user.balance = balanceData;
            await user.save();

            return res.json({
                status: true,
                data: {
                    transferId: response.data.data.id,
                    reference,
                    status: 'initiated'
                }
            });
        } else {
            withdrawal.status = 'failed';
            withdrawal.errorMessage = response.data.message;
            await withdrawal.save();
            return res.json({ status: false, message: 'Failed to initiate withdrawal' });
        }
    } catch (err) {
        console.error('initiateWithdrawal error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

/**
 * Get payment history
 */
exports.getPaymentHistory = async (req, res) => {
    try {
        const { userId, type, limit = 50, skip = 0 } = req.body;

        if (!userId) {
            return res.json({ status: false, message: 'Invalid Request' });
        }

        const query = { userId };
        if (type) query.type = type;

        const payments = await models.flutterWavePaymentModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const total = await models.flutterWavePaymentModel.countDocuments(query);

        res.json({
            status: true,
            data: payments,
            pagination: { total, limit, skip }
        });
    } catch (err) {
        console.error('getPaymentHistory error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};
