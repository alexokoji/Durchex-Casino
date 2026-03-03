const axios = require('axios');
const crypto = require('crypto');
const FlutterwaveTransactionModel = require('../models/FlutterwaveTransactionModel');
const UnifiedPaymentModel = require('../models/UnifiedPaymentModel');
const UserModel = require('../models/UserModel');

const FLUTTERWAVE_API_KEY = process.env.FLUTTERWAVE_API_KEY;
// base URL should point to staging unless explicitly set to production/live
const FLUTTERWAVE_BASE_URL = ['production','live'].includes(process.env.FLUTTERWAVE_ENV)
    ? 'https://api.flutterwave.com/v3'
    : 'https://api.staging.flutterwave.com/v3';
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const config = require('../config');

// Initialize Flutterwave payment
exports.initiateDeposit = async (req, res) => {
    try {
        // dump body for troubleshooting (will show up in logs)
        console.log('💡 initiateDeposit called with body:', req.body);

        let { userId, amount, paymentMethod, email } = req.body;
        // currency no longer provided by frontend; use env default
        let currency = process.env.FLUTTERWAVE_DEFAULT_CURRENCY || 'USD';

        // default to flutterwave if caller didn't supply a method
        if (!paymentMethod) paymentMethod = 'flutterwave';

        // ensure userId and numeric amount are present and amount positive
        const parsedAmount = parseFloat(amount);
        if (!userId || isNaN(parsedAmount) || parsedAmount <= 0) {
            console.warn('🚨 invalid deposit request', { userId, amount });
            return res.status(400).json({ 
                status: false, 
                message: 'Missing or invalid fields: userId and amount (>0) are required',
                received: { userId, amount }
            });
        }
        amount = parsedAmount;

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        // If DEMO_MODE is enabled, simulate the deposit flow and credit demo balance
        if (config.DEMO_MODE) {
            const fwTransaction = new FlutterwaveTransactionModel({
                userId,
                transactionRef: `FW-DEMO-${Date.now()}`,
                amount,
                currency,
                type: 'deposit',
                paymentMethod: 'card',  // Default to card
                customerEmail: email || user.email,
                status: 'completed',
                statusDetails: 'Demo deposit credited',
                metadata: {
                    originalPaymentMethod: paymentMethod
                }
            });

            const fwSaved = await fwTransaction.save();

            const unifiedPayment = new UnifiedPaymentModel({
                userId,
                paymentId: `FW-${fwSaved._id}`,
                paymentMethod: 'flutterwave',
                flutterwaveTransactionId: fwSaved._id,
                type: 'deposit',
                amountRequested: amount,
                amountReceived: amount,
                currencyCode: currency,
                status: 'completed',
                completedAt: new Date()
            });

            await unifiedPayment.save();

            // Credit demo balance to user
            if (user) {
                if (!user.demoBalance) user.demoBalance = { data: [] };
                let currencyBalance = user.demoBalance.data.find(b => b.currency === currency);
                if (!currencyBalance) {
                    currencyBalance = { currency: currency, balance: 0 };
                    user.demoBalance.data.push(currencyBalance);
                }
                currencyBalance.balance += parseFloat(amount);
                user.markModified('demoBalance');
                await user.save();
            }

            console.log(`✅ Demo deposit processed: ${currency} ${amount} for user ${userId}`);

            return res.json({
                status: true,
                message: 'Demo payment processed successfully',
                transactionId: fwSaved._id,
                paymentLink: `${APP_BASE_URL}/demo-payment/success` 
            });
        }

        // PRODUCTION MODE: Initialize real Flutterwave payment
        // Create a transaction record first
        const fwTransaction = new FlutterwaveTransactionModel({
            userId,
            transactionRef: `FW-TEMP-${Date.now()}`,  // Temp ref, will be updated
            amount,
            currency,
            type: 'deposit',  // Required: must be 'deposit' or 'withdrawal'
            paymentMethod: 'card',  // Default payment method
            customerEmail: email || user.email,
            status: 'initiated',
            statusDetails: 'Payment initiated',
            metadata: {
                originalPaymentMethod: paymentMethod
            }
        });

        const fwSaved = await fwTransaction.save();
        
        // Update transaction ref with the actual ID
        fwSaved.transactionRef = `FW-${fwSaved._id}`;
        await fwSaved.save();
        
        console.log(`📝 Flutterwave transaction created: ${fwSaved._id}`);

        // Create unified payment record
        const unifiedPayment = new UnifiedPaymentModel({
            userId,
            paymentId: `FW-${fwSaved._id}`,
            paymentMethod: 'flutterwave',
            flutterwaveTransactionId: fwSaved._id,
            type: 'deposit',
            amountRequested: amount,
            currencyCode: currency,
            status: 'pending'
        });

        const unifiedSaved = await unifiedPayment.save();

        // Link the unified payment to the transaction
        fwTransaction.unifiedPaymentId = unifiedSaved._id;
        await fwTransaction.save();

        // Prepare Flutterwave API payload
        const flutterwavePayload = {
            public_key: process.env.FLUTTERWAVE_PUBLIC_KEY,
            tx_ref: `FW-${fwSaved._id}`,
            amount: parseFloat(amount),
            currency: currency,
            payment_options: 'card,mobilemoney,ussd',
            customer: {
                email: email || user.email,
                name: user.username || 'Customer'
            },
            customizations: {
                title: 'PlayZelo Casino Deposit',
                description: `Deposit ${amount} ${currency} to your PlayZelo account`,
                logo: 'https://casino.durchex.com/logo.png'
            },
            redirect_url: `${APP_BASE_URL}/payment/verify?tid=${fwSaved._id}`
        };

        console.log(`📤 Initiating Flutterwave API call for ${currency} ${amount}...`);

        let flutterwaveResponse;
        try {
            flutterwaveResponse = await axios.post(
                `${FLUTTERWAVE_BASE_URL}/payments`,
                flutterwavePayload,
                {
                    headers: {
                        'Authorization': `Bearer ${FLUTTERWAVE_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 8000  // 8 second timeout
                }
            );
            console.log(`✅ Flutterwave API responded successfully`);
        } catch (axiosError) {
            console.error(`❌ Flutterwave API call failed:`, {
                message: axiosError.message,
                code: axiosError.code,
                status: axiosError.response?.status,
                data: axiosError.response?.data
            });

            // Check if it's a network error or auth error - fallback for both
            const isNetworkError = axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ETIMEDOUT' || axiosError.code === 'EHOSTUNREACH';
            const isAuthError = axiosError.response?.data?.message?.includes('authorization') || axiosError.response?.data?.message?.includes('Invalid');
            
            if (isNetworkError || isAuthError) {
                console.warn(`⚠️ FALLBACK: Flutterwave ${isAuthError ? 'auth error' : 'unreachable'}, generating payment link..`);
                
                // Fallback: generate a mostly‑static Flutterwave checkout URL so the
                // user still sees something rather than an internal dead page. this
                // only applies when the external API call fails; ideally this path
                // should never be reached in production when keys are valid.
                fwTransaction.status = 'pending';
                fwTransaction.statusDetails = isAuthError ? 'Pending - Auth error encountered' : 'Pending - Flutterwave unreachable';
                fwTransaction.flutterwaveId = `FW-${fwSaved._id}`;
                fwTransaction.flutterwaveLink = `https://checkout.flutterwave.com/v3/hosted/pay?public_key=${process.env.FLUTTERWAVE_PUBLIC_KEY}&tx_ref=FW-${fwSaved._id}&amount=${amount}&currency=${currency}`;
                await fwTransaction.save();

                return res.json({
                    status: true,
                    message: 'Payment link generated (fallback)',
                    transactionId: fwSaved._id,
                    paymentLink: fwTransaction.flutterwaveLink,
                    fallback: true,
                    note: isAuthError ? 'Please verify your Flutterwave API keys' : 'Flutterwave unreachable'
                });
            }

            fwTransaction.status = 'failed';
            fwTransaction.statusDetails = `Flutterwave API error: ${axiosError.message}`;
            await fwTransaction.save();

            return res.status(503).json({
                status: false,
                message: 'Payment gateway temporarily unavailable. Please try again in a few moments.',
                error: axiosError.message
            });
        }

        // Check if Flutterwave response is successful
        if (!flutterwaveResponse.data || !flutterwaveResponse.data.status || flutterwaveResponse.data.status !== 'success') {
            console.error(`❌ Flutterwave API returned unsuccessful status:`, flutterwaveResponse.data);
            fwTransaction.status = 'failed';
            fwTransaction.statusDetails = flutterwaveResponse.data?.message || 'Flutterwave API error';
            await fwTransaction.save();

            return res.status(400).json({
                status: false,
                message: 'Failed to initialize Flutterwave payment',
                error: flutterwaveResponse.data?.message
            });
        }

        // Update transaction with Flutterwave response
        fwTransaction.flutterwaveId = flutterwaveResponse.data.data?.id;
        fwTransaction.flutterwaveLink = flutterwaveResponse.data.data?.link;
        await fwTransaction.save();

        console.log(`✅ Payment link generated for transaction: ${flutterwaveResponse.data.data?.link}`);

        return res.json({
            status: true,
            message: 'Flutterwave payment initialized successfully',
            transactionId: fwSaved._id,
            paymentLink: flutterwaveResponse.data.data?.link
        });

    } catch (error) {
        console.error('❌ Flutterwave initiate deposit error:', error.message);
        res.status(500).json({ 
            status: false, 
            message: 'Failed to initiate deposit',
            error: error.message 
        });
    }
};

// Verify Flutterwave payment webhook signature
exports.verifyWebhookSignature = (req, body, signature) => {
    const secret = process.env.FLUTTERWAVE_SECRET_HASH;
    const hashedBody = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    
    return hashedBody === signature;
};

// Handle Flutterwave webhook (payment confirmation)
exports.handleWebhook = async (req, res) => {
    try {
        const signature = req.headers['verificationhash'];
        const body = JSON.stringify(req.body);

        // Verify webhook authenticity
        if (!exports.verifyWebhookSignature(req, body, signature)) {
            console.log('❌ Invalid Flutterwave webhook signature');
            return res.status(401).json({ status: false, message: 'Invalid signature' });
        }

        const event = req.body;
        console.log('📦 Flutterwave webhook received:', event.data.status);

        if (event.data.status !== 'successful') {
            console.log('⚠️ Payment not successful:', event.data.status);
            
            // Update transaction as failed
            const fwTransaction = await FlutterwaveTransactionModel.findOne({
                flutterwaveId: event.data.id
            });
            
            if (fwTransaction) {
                fwTransaction.status = 'failed';
                fwTransaction.statusDetails = event.data.status;
                await fwTransaction.save();

                // Update unified payment
                await UnifiedPaymentModel.findByIdAndUpdate(
                    fwTransaction.unifiedPaymentId,
                    { status: 'failed', statusDetails: event.data.status }
                );
            }

            return res.json({ status: true, message: 'Webhook processed' });
        }

        // Payment successful
        const fwTransaction = await FlutterwaveTransactionModel.findOne({
            flutterwaveId: event.data.id
        });

        if (!fwTransaction) {
            console.log('⚠️ Transaction not found:', event.data.id);
            return res.json({ status: true, message: 'Webhook processed' });
        }

        // Update transaction
        fwTransaction.status = 'completed';
        fwTransaction.statusDetails = 'Payment confirmed';
        fwTransaction.webhookData = event;
        fwTransaction.confirmedAt = new Date();
        await fwTransaction.save();

        // Update unified payment
        const unifiedPayment = await UnifiedPaymentModel.findOneAndUpdate(
            { flutterwaveTransactionId: fwTransaction._id },
            { 
                status: 'completed',
                amountReceived: fwTransaction.amount,
                completedAt: new Date()
            }
        );

        // Add funds to user account
        const user = await UserModel.findById(fwTransaction.userId);
        if (user) {
            // Find or initialize balance for currency
            if (!user.demoBalance) user.demoBalance = { data: [] };
            
            let currencyBalance = user.demoBalance.data.find(b => 
                b.currency === fwTransaction.currency
            );
            
            if (!currencyBalance) {
                currencyBalance = { currency: fwTransaction.currency, balance: 0 };
                user.demoBalance.data.push(currencyBalance);
            }

            currencyBalance.balance += fwTransaction.amount;
            
            // Mark as modified for Mongoose
            user.markModified('demoBalance');
            await user.save();

            console.log(`✅ Added ${fwTransaction.amount} ${fwTransaction.currency} to user ${fwTransaction.userId}`);
        }

        res.json({ status: true, message: 'Payment processed successfully' });

    } catch (error) {
        console.error('❌ Flutterwave webhook error:', error.message);
        res.status(500).json({ 
            status: false, 
            message: 'Webhook processing failed',
            error: error.message 
        });
    }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const transaction = await FlutterwaveTransactionModel.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ status: false, message: 'Transaction not found' });
        }

        res.json({
            status: true,
            data: {
                transactionId: transaction._id,
                status: transaction.status,
                amount: transaction.amount,
                currency: transaction.currency,
                createdAt: transaction.createdAt,
                completedAt: transaction.completedAt
            }
        });

    } catch (error) {
        console.error('❌ Get payment status error:', error.message);
        res.status(500).json({ 
            status: false, 
            message: 'Failed to get payment status',
            error: error.message 
        });
    }
};

// List user transactions
exports.getUserTransactions = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        const transactions = await FlutterwaveTransactionModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await FlutterwaveTransactionModel.countDocuments({ userId });

        res.json({
            status: true,
            data: transactions,
            pagination: { total, limit: parseInt(limit), skip: parseInt(skip) }
        });

    } catch (error) {
        console.error('❌ Get user transactions error:', error.message);
        res.status(500).json({ 
            status: false, 
            message: 'Failed to get transactions',
            error: error.message 
        });
    }
};

// Initiate Fiat Withdrawal
exports.initiateWithdrawal = async (req, res) => {
    try {
        const { userId, amount, currency, bankName, accountNumber, accountHolder, email, isDemo } = req.body;

        if (!userId || !amount || !currency || !bankName || !accountNumber || !accountHolder) {
            return res.status(400).json({ 
                status: false, 
                message: 'Missing required fields: userId, amount, currency, bankName, accountNumber, accountHolder' 
            });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        // Check if user has sufficient balance
        if (user.balance < amount) {
            return res.status(400).json({ 
                status: false, 
                message: `Insufficient balance. Available: ${user.balance}, Required: ${amount}` 
            });
        }

        // If DEMO_MODE is enabled, simulate the withdrawal
        if (config.DEMO_MODE || isDemo) {
            // Deduct from demo balance instead of real balance
            if (user.demoBalance < amount) {
                return res.status(400).json({ 
                    status: false, 
                    message: `Insufficient demo balance. Available: ${user.demoBalance}, Required: ${amount}` 
                });
            }

            user.demoBalance -= amount;
            await user.save();

            const fwTransaction = new FlutterwaveTransactionModel({
                userId,
                amount,
                currency,
                type: 'withdrawal',
                bankName,
                accountNumber,
                accountHolder,
                customerEmail: email || user.email,
                status: 'completed',
                statusDetails: 'Demo withdrawal processed'
            });

            const fwSaved = await fwTransaction.save();

            const unifiedPayment = new UnifiedPaymentModel({
                userId,
                paymentId: `FW-WITHDRAW-${fwSaved._id}`,
                paymentMethod: 'flutterwave_withdrawal',
                flutterwaveTransactionId: fwSaved._id,
                amount,
                currency,
                type: 'withdrawal',
                status: 'completed',
                completedAt: new Date()
            });

            await unifiedPayment.save();

            console.log(`✅ Demo withdrawal processed for user ${userId}: ${amount} ${currency}`);

            return res.status(200).json({
                status: true,
                message: '✅ Demo withdrawal processed successfully',
                data: {
                    transactionId: fwSaved._id,
                    amount,
                    currency,
                    status: 'completed'
                }
            });
        }

        // Production: Call Flutterwave Transfer API
        try {
            // Flutterwave Transfers API for payouts
            const transferData = {
                account_bank: accountNumber, // Would need to map to Flutterwave bank codes
                account_number: accountNumber,
                amount: parseInt(amount * 100), // Amount in cents
                narration: `Withdrawal to ${accountHolder}`,
                currency: currency,
                reference: `WITHDRAW-${userId}-${Date.now()}`
            };

            const flutterwaveResponse = await axios.post(
                `${FLUTTERWAVE_BASE_URL}/transfers`,
                transferData,
                {
                    headers: {
                        Authorization: `Bearer ${FLUTTERWAVE_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!flutterwaveResponse.data.status === 'success') {
                return res.status(400).json({ 
                    status: false, 
                    message: 'Flutterwave withdrawal initiation failed',
                    details: flutterwaveResponse.data.message
                });
            }

            // Deduct from user balance
            user.balance -= amount;
            await user.save();

            // Store transaction
            const fwTransaction = new FlutterwaveTransactionModel({
                userId,
                amount,
                currency,
                type: 'withdrawal',
                bankName,
                accountNumber,
                accountHolder,
                customerEmail: email || user.email,
                flutterwaveTransferId: flutterwaveResponse.data.data.id,
                status: 'processing',
                statusDetails: 'Withdrawal initiated, pending bank processing'
            });

            const fwSaved = await fwTransaction.save();

            const unifiedPayment = new UnifiedPaymentModel({
                userId,
                paymentId: `FW-WITHDRAW-${fwSaved._id}`,
                paymentMethod: 'flutterwave_withdrawal',
                flutterwaveTransactionId: fwSaved._id,
                amount,
                currency,
                type: 'withdrawal',
                status: 'processing',
                initiatedAt: new Date()
            });

            await unifiedPayment.save();

            console.log(`✅ Fiat withdrawal initiated for user ${userId}: ${amount} ${currency}`);

            return res.status(200).json({
                status: true,
                message: '✅ Withdrawal initiated successfully. Please check your bank account within 1-3 business days.',
                data: {
                    transactionId: fwSaved._id,
                    flutterwaveTransferId: flutterwaveResponse.data.data.id,
                    amount,
                    currency,
                    status: 'processing'
                }
            });

        } catch (flutterwaveError) {
            console.error('❌ Flutterwave transfer error:', flutterwaveError.message);
            
            // Log the error but return generic message for security
            return res.status(400).json({
                status: false,
                message: 'Withdrawal initiation failed. Please ensure all bank details are correct.',
                details: flutterwaveError?.response?.data?.message || flutterwaveError.message
            });
        }

    } catch (error) {
        console.error('❌ Initiate withdrawal error:', error.message);
        res.status(500).json({ 
            status: false, 
            message: 'Withdrawal initiation failed',
            error: error.message 
        });
    }
};
