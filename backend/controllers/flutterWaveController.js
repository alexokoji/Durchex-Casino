const axios = require('axios');
const crypto = require('crypto');
const models = require('../models');
const SocketManager = require('../socket/Manager');
const chipsConverter = require('../services/chipsConverter');

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
        let { userId, amount, currency, paymentMethod, customerEmail, customerPhone, customerName } = req.body;

        // Use env defaults for currency if not provided
        if (!currency) currency = process.env.FLUTTERWAVE_DEFAULT_CURRENCY || 'USD';
        // paymentMethod is not sent by frontend anymore; we'll ignore it and always use a valid option
        paymentMethod = 'card'; // default payment_options value used by Flutterwave


        // Parse amount and validate
        const parsedAmount = parseFloat(amount);
        if (!userId || isNaN(parsedAmount) || parsedAmount <= 0) {
            console.warn('🚨 invalid deposit request', { userId, amount });
            return res.json({ status: false, message: 'Missing required fields: userId and amount (>0) are required', received: { userId, amount } });
        }
        amount = parsedAmount;

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
        // ensure we have a usable frontend URL; fall back to localhost if unset or malformed
        let frontUrl = process.env.FRONTEND_URL;
        if (!frontUrl || typeof frontUrl !== 'string' || !/^https?:\/\//.test(frontUrl)) {
            console.warn('FRONTEND_URL not set or invalid; defaulting to http://localhost:3000');
            frontUrl = 'http://localhost:3000';
        }

        // ensure the customer has a valid email; use user email as fallback
        let email = customerEmail;
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            console.warn('Invalid or missing customerEmail; falling back to user email');
            email = user.userEmail || user.userEmail || `user-${userId}@casino.durchex.com`;
        }

        const payloadData = {
            tx_ref: txRef,
            amount,
            currency,
            payment_options: 'card,mobilemoney,ussd', // always send a valid option list
            redirect_url: `${frontUrl}/payment/callback`,
            customer: {
                email,
                phonenumber: customerPhone,
                name: customerName || user.userName || user.userNickName || 'Customer'
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

        // log payload for debugging (should help diagnose missing parameters)
        console.debug('Initializing Flutterwave with payload:', JSON.stringify(payloadData, null, 2));

        // initialize payment - single request with error logging
        let response;
        try {
            response = await axios.post(
                `${FLUTTERWAVE_BASE_URL}/payments`,
                payloadData,
                { headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` } }
            );
        } catch (axiosErr) {
            console.error('Axios error calling Flutterwave:', axiosErr.response?.status, axiosErr.response?.data);
            return res.json({ status: false, message: 'Failed to contact Flutterwave', detail: axiosErr.response?.data });
        }

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

        // look up existing payment record early - useful for simulated tests or
        // to short-circuit if we've already applied the update
        const payment = await models.flutterWavePaymentModel.findOne({ reference });

        if (!payment) {
            return res.json({ status: false, message: 'Payment record not found' });
        }

        // if this is a simulated/test record or already marked successful we
        // can skip the external call altogether and just apply the local logic
        if (reference.startsWith('SIM_') || payment.paymentStatus === 'successful') {
            console.debug('Skipping external verification for simulated/known payment:', reference);
            // reuse the same update logic below
            const txData = {
                id: payment.transactionId || null,
                status: 'successful',
                charge: payment.chargeAmount || 0,
                amount: payment.netAmount || payment.amount || 0
            };

            // mark as completed and update user
            payment.status = 'completed';
            payment.paymentStatus = 'successful';
            payment.completedAt = new Date();
            await payment.save();

            const user = await models.userModel.findById(payment.userId);
            if (user) {
                const chips = chipsConverter.toChips(payment.netAmount, 'USDT');
                if (user.demoMode) {
                    user.demoChipsBalance = (user.demoChipsBalance || 0) + chips;
                } else {
                    user.chipsBalance = (user.chipsBalance || 0) + chips;
                }

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

            return res.json({
                status: true,
                data: {
                    paymentStatus: payment.status,
                    amount: payment.netAmount,
                    reference: payment.reference
                }
            });
        }

        // verification and other sensitive calls require the secret key
        const response = await axios.get(
            `${FLUTTERWAVE_BASE_URL}/transactions/verify_by_reference?tx_ref=${reference}`,
            { headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` } }
        );

        if (response.data.status === 'success') {
            const txData = response.data.data;

            // Update payment record
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
                    // Convert USDT to chips and credit appropriate balance
                    const chips = chipsConverter.toChips(payment.netAmount, 'USDT');
                    if (user.demoMode) {
                        user.demoChipsBalance = (user.demoChipsBalance || 0) + chips;
                    } else {
                        user.chipsBalance = (user.chipsBalance || 0) + chips;
                    }
                    
                    // Also update legacy balance for backward compatibility
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
            return res.json({ status: false, message: 'Payment verification failed' });
        }
    } catch (err) {
        // log entire response when available for easier debugging
        console.error('verifyPayment error:', err.response?.status, err.response?.data || err.message);
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
                    // Convert USDT to chips
                    const chips = chipsConverter.toChips(payment.netAmount, 'USDT');
                    if (user.demoMode) {
                        user.demoChipsBalance = (user.demoChipsBalance || 0) + chips;
                    } else {
                        user.chipsBalance = (user.chipsBalance || 0) + chips;
                    }
                    
                    // Also update legacy balance
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
