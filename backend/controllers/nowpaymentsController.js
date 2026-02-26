const nowpaymentsService = require('../services/nowpaymentsService');
const CryptoPaymentV2Model = require('../models/CryptoPaymentV2Model');
const UnifiedPaymentModel = require('../models/UnifiedPaymentModel');
const UserModel = require('../models/UserModel');
const WithdrawalModel = require('../models/WithdrawalModel');
const houseHelper = require('../helpers/houseHelper');

/**
 * Create USDT payment order via NOWPayments
 * POST /api/v0/payments/usdt/trc20/create
 * Body: { userId, amount, currencyFrom }
 */
exports.createUSDTPayment = async (req, res) => {
    const session = req.session;
    try {
        // Use userId from authenticated middleware if available, fallback to request body
        const userId = req.userId || req.body.userId;
        const { amount, currencyFrom } = req.body;

        if (!userId || !amount || amount <= 0) {
            return res.json({
                status: false,
                message: 'Invalid userId or amount'
            });
        }

        // Verify user exists - use authenticated user if available, otherwise fetch
        const user = req.user || (await UserModel.findById(userId));
        if (!user) {
            return res.json({
                status: false,
                message: 'User not found'
            });
        }

        const payAmount = parseFloat(amount);
        const priceCurrency = currencyFrom || 'USD';
        const payCurrency = 'USDTTRC20'; // NOWPayments uses USDTTRC20 for Tron USDT

        console.log(`📊 Creating NOWPayments order for user ${userId}:`, {
            priceAmount: payAmount,
            priceCurrency,
            payCurrency
        });

        // Call NOWPayments API to create payment FIRST (before saving DB record)
        const ipnCallbackUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/v0/payments/nowpayments/ipn`;
        
        const result = await nowpaymentsService.createPayment({
            price_amount: payAmount,
            price_currency: priceCurrency,
            pay_currency: payCurrency,
            ipn_callback_url: ipnCallbackUrl,
            order_id: `OID-${userId}-${Date.now()}`,
            order_description: `USDT Deposit - User ${userId}`
        });

        if (!result.status) {
            console.error('❌ NOWPayments creation failed:', result.message);
            return res.json({
                status: false,
                message: result.message,
                error: result.error
            });
        }

        const paymentData = result.data;

        // Now save crypto payment record with NOWPayments details
        const cryptoPayment = new CryptoPaymentV2Model({
            userId: userId,
            coinType: 'USDT',
            chain: 'TRC20',
            amount: payAmount,
            status: 'pending',
            isDemo: false,
            depositAddress: paymentData.pay_address, // NOWPayments address
            transactionHash: paymentData.payment_id, // Store payment_id for reference
            nowpaymentsPaymentId: paymentData.payment_id,
            expiresAt: paymentData.expire_at ? new Date(paymentData.expire_at) : new Date(Date.now() + 86400000) // Fallback to 24 hours
        });

        const savedPayment = await cryptoPayment.save();
        console.log(`✅ Crypto payment record created: ${savedPayment._id}`);

        // Create unified payment record
        const unifiedPayment = new UnifiedPaymentModel({
            userId: userId,
            paymentId: `NP-${paymentData.payment_id}`,
            paymentMethod: 'crypto', // Use 'crypto' enum value
            type: 'deposit',
            amountRequested: payAmount,
            currencyCode: priceCurrency,
            status: 'pending',
            cryptoPaymentId: savedPayment._id,
            description: `USDT TRC-20 Deposit via NOWPayments`,
            metadata: {
                nowpaymentsPaymentId: paymentData.payment_id,
                externalPaymentId: paymentData.payment_id,
                payCurrency: payCurrency
            }
        });

        await unifiedPayment.save();
        console.log(`✅ Unified payment record created: ${unifiedPayment._id}`);

        // Generate QR code URL
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(paymentData.pay_address)}&size=300x300`;

        return res.json({
            status: true,
            message: 'USDT payment address generated successfully',
            data: {
                paymentId: savedPayment._id,
                nowpaymentsPaymentId: paymentData.payment_id,
                address: paymentData.pay_address,
                currency: 'USDT',
                chain: 'TRC20',
                amount: payAmount,
                decimals: 6,
                qrCode: qrCodeUrl,
                expireAt: paymentData.expire_at,
                status: 'waiting_for_payment'
            }
        });
    } catch (error) {
        console.error('❌ Create USDT payment error:', error.message);
        return res.json({
            status: false,
            message: 'Failed to create payment',
            error: error.message
        });
    }
};

/**
 * Handle NOWPayments IPN webhook
 * POST /api/v0/payments/nowpayments/ipn (NO AUTHENTICATION REQUIRED)
 * This endpoint verifies the signature and processes payment confirmations
 */
exports.handleNOWPaymentsIPN = async (req, res) => {
    try {
        console.log('📨 NOWPayments IPN received');

        // Get signature from headers
        const signature = req.headers['x-nowpayments-sig'];
        if (!signature) {
            console.warn('⚠️ Missing X-NOWPAYMENTS-SIG header');
            return res.status(400).json({ status: false, message: 'Missing signature' });
        }

        // Verify signature
        const isValid = nowpaymentsService.verifyIPNSignature(req.body, signature);
        if (!isValid) {
            console.error('❌ IPN signature verification failed');
            return res.status(403).json({ status: false, message: 'Invalid signature' });
        }

        const { payment_id, status, order_id, pay_address, pay_currency, pay_amount } = req.body;

        console.log(`✅ IPN verified. Payment ID: ${payment_id}, Status: ${status}`);

        // Find the crypto payment record (only if payment_id provided)
        let cryptoPayment = null;
        if (payment_id) {
            cryptoPayment = await CryptoPaymentV2Model.findOne({ nowpaymentsPaymentId: payment_id });
        }

        if (!cryptoPayment) {
            console.warn(`⚠️ No crypto payment found for payment_id: ${payment_id}`);

            // Attempt to reconcile payout/withdrawal IPN
            try {
                // NOWPayments may send payout notifications with external_id or payout_id
                const externalId = req.body.external_id || req.body.order_id || req.body.id || req.body.payout_id;

                let withdrawal = null;
                if (externalId) {
                    // Try by external_id (we used withdrawal._id as external_id)
                    withdrawal = await WithdrawalModel.findById(externalId);
                }

                // Fallback: try find by transactionHash / payout id
                if (!withdrawal && (req.body.payout_id || req.body.id || payment_id)) {
                    const txId = req.body.payout_id || req.body.id || payment_id;
                    withdrawal = await WithdrawalModel.findOne({ transactionHash: txId });
                }

                if (withdrawal) {
                    console.log(`📦 Processing payout IPN for withdrawal ${withdrawal._id}`);

                    const wStatus = status || req.body.status || req.body.payout_status;

                    if (wStatus === 'finished' || wStatus === 'confirmed' || wStatus === 'completed') {
                        withdrawal.status = 'confirmed';
                        withdrawal.transactionHash = req.body.payout_id || req.body.id || withdrawal.transactionHash;
                        withdrawal.completedAt = new Date();
                        await withdrawal.save();
                        return res.json({ status: true, message: 'Withdrawal confirmed' });
                    }

                    if (wStatus === 'failed' || wStatus === 'error' || wStatus === 'cancelled') {
                        // Refund user
                        const user = await UserModel.findById(withdrawal.userId);
                        if (user) {
                            const balanceContainer = user.demoMode ? (user.demoBalance || { data: [] }) : (user.balance || { data: [] });
                            let entry = balanceContainer.data.find(b => b.coinType === withdrawal.coinType);
                            if (!entry) {
                                entry = { coinType: withdrawal.coinType, balance: 0 };
                                balanceContainer.data.push(entry);
                            }
                            console.log('Refunding user. Before balance:', entry.balance);
                            entry.balance = Number(entry.balance || 0) + Number(withdrawal.amount || 0);
                            console.log('Refunding user. After balance:', entry.balance);
                            if (user.demoMode) user.demoBalance = balanceContainer; else user.balance = balanceContainer;
                            // record transaction
                            user.cryptoTransactions = user.cryptoTransactions || [];
                            user.cryptoTransactions.push({ type: 'refund', currency: withdrawal.coinType, amount: withdrawal.amount, balance: entry.balance, transactionId: withdrawal._id, status: 'refunded', timestamp: new Date() });
                            await user.save();
                        }

                        withdrawal.status = 'failed';
                        withdrawal.failureReason = req.body.failureReason || req.body.message || 'Payout failed';
                        await withdrawal.save();
                        return res.json({ status: true, message: 'Withdrawal failed and refunded' });
                    }

                    // If status is processing or sending, just acknowledge
                    withdrawal.notes = Object.assign({}, withdrawal.notes || {}, { ipn: req.body });
                    await withdrawal.save();
                    return res.json({ status: true, message: 'Withdrawal IPN processed' });
                }
            } catch (e) {
                console.error('❌ Error while reconciling withdrawal IPN:', e.message);
            }

            return res.json({ status: true, message: 'Payment not found in DB, but IPN verified' });
        }

        console.log(`📦 Processing payment for user ${cryptoPayment.userId}`);

        // Update payment status based on NOWPayments status
        // NOWPayments statuses: waiting, confirming, confirmed, sending, finished, failed, expired
        let shouldCreditUser = false;

        switch (status) {
            case 'confirmed':
                cryptoPayment.status = 'confirmed';
                cryptoPayment.confirmedAt = new Date();
                shouldCreditUser = true;
                console.log('✅ Payment confirmed, will credit user');
                break;

            case 'finished':
                cryptoPayment.status = 'confirmed';
                cryptoPayment.confirmedAt = new Date();
                shouldCreditUser = true;
                console.log('✅ Payment finished, will credit user');
                break;

            case 'sending':
                cryptoPayment.status = 'confirmed';
                shouldCreditUser = true;
                console.log('✅ Payment sending, will credit user');
                break;

            case 'confirming':
                cryptoPayment.status = 'confirming';
                console.log('⏳ Payment confirming, waiting for more confirmations');
                break;

            case 'waiting':
                cryptoPayment.status = 'waiting_for_payment';
                console.log('⏳ Still waiting for payment');
                break;

            case 'failed':
                cryptoPayment.status = 'failed';
                console.log('❌ Payment failed');
                break;

            case 'expired':
                cryptoPayment.status = 'expired';
                console.log('⏰ Payment expired');
                break;

            default:
                console.log(`❓ Unknown payment status: ${status}`);
        }

        // Store raw IPN data
        cryptoPayment.ipnData = req.body;
        cryptoPayment.receivedAmount = pay_amount;

        await cryptoPayment.save();
        console.log(`✅ Crypto payment updated: status=${cryptoPayment.status}`);

        // Update unified payment
        const unifiedPayment = await UnifiedPaymentModel.findById(
            cryptoPayment.unifiedPaymentId
        );

        if (unifiedPayment) {
            if (shouldCreditUser) {
                unifiedPayment.status = 'completed';
                unifiedPayment.amountReceived = pay_amount;
                unifiedPayment.completedAt = new Date();
            } else {
                unifiedPayment.status = 'processing';
            }

            unifiedPayment.externalData = req.body;
            await unifiedPayment.save();
            console.log(`✅ Unified payment updated: ${unifiedPayment._id}`);
        }

        // Credit user balance if payment confirmed
        if (shouldCreditUser && cryptoPayment.userId) {
            const user = await UserModel.findById(cryptoPayment.userId);
            
            if (user) {
                // Initialize currency balance if not exists
                let usdtEntry = user.currencyBalance?.find(b => b.currency === 'USDT');

                if (!usdtEntry) {
                    usdtEntry = { currency: 'USDT', balance: 0 };
                    user.currencyBalance = user.currencyBalance || [];
                    user.currencyBalance.push(usdtEntry);
                }

                // Add received amount to balance
                usdtEntry.balance = Number(usdtEntry.balance || 0) + Number(pay_amount);

                // Record transaction
                if (!user.cryptoTransactions) {
                    user.cryptoTransactions = [];
                }

                user.cryptoTransactions.push({
                    type: 'deposit',
                    currency: 'USDT',
                    amount: pay_amount,
                    balance: usdtEntry.balance,
                    transactionId: payment_id,
                    status: 'completed',
                    timestamp: new Date()
                });

                await user.save();
                console.log(`✅ User balance credited: +${pay_amount} USDT (Payment ID: ${payment_id})`);

                // Record in transaction history
                if (unifiedPayment) {
                    unifiedPayment.completedAt = new Date();
                    await unifiedPayment.save();
                }
            } else {
                console.warn(`⚠️ User not found for payment: ${cryptoPayment.userId}`);
            }
        }

        // Respond to NOWPayments (important: confirm receipt)
        return res.json({ status: true, message: 'IPN processed successfully' });

    } catch (error) {
        console.error('❌ NOWPayments IPN handler error:', error.message);
        return res.status(500).json({
            status: false,
            message: 'IPN processing failed',
            error: error.message
        });
    }
};

/**
 * Get payment status
 * GET /api/v0/payments/usdt/{paymentId}
 */
exports.getPaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;

        if (!paymentId) {
            return res.json({
                status: false,
                message: 'Payment ID is required'
            });
        }

        // Find crypto payment
        const cryptoPayment = await CryptoPaymentV2Model.findById(paymentId);
        if (!cryptoPayment) {
            return res.json({
                status: false,
                message: 'Payment not found'
            });
        }

        // If payment is pending, try to get latest status from NOWPayments
        if (cryptoPayment.nowpaymentsPaymentId && 
            (cryptoPayment.status === 'pending' || cryptoPayment.status === 'waiting_for_payment' || cryptoPayment.status === 'confirming')) {
            
            const statusResult = await nowpaymentsService.getPaymentStatus(cryptoPayment.nowpaymentsPaymentId);
            
            if (statusResult.status && statusResult.data) {
                const npStatus = statusResult.data;
                
                // Update local status if changed
                if (npStatus.status !== cryptoPayment.status) {
                    console.log(`🔄 Updating payment status from ${cryptoPayment.status} to ${npStatus.status}`);
                    cryptoPayment.status = npStatus.status;
                    
                    if (npStatus.status === 'confirmed' || npStatus.status === 'finished') {
                        cryptoPayment.confirmedAt = new Date();
                    }
                    
                    await cryptoPayment.save();
                }
            }
        }

        return res.json({
            status: true,
            data: {
                paymentId: cryptoPayment._id,
                nowpaymentsPaymentId: cryptoPayment.nowpaymentsPaymentId,
                status: cryptoPayment.status,
                amount: cryptoPayment.amount,
                currency: cryptoPayment.coinType,
                chain: cryptoPayment.chain,
                address: cryptoPayment.depositAddress,
                createdAt: cryptoPayment.createdAt,
                expiresAt: cryptoPayment.expiresAt,
                confirmedAt: cryptoPayment.confirmedAt,
                receivedAmount: cryptoPayment.receivedAmount
            }
        });
    } catch (error) {
        console.error('❌ Get payment status error:', error.message);
        return res.json({
            status: false,
            message: 'Failed to get payment status',
            error: error.message
        });
    }
};

/**
 * Initiate withdrawal (placeholder for future implementation)
 * This can be used for crypto withdrawals via NOWPayments
 */
exports.initiateWithdrawal = async (req, res) => {
    try {
        // Use authenticated user from middleware, override with req.userId
        const userId = req.userId || req.body.userId;
        const { amount, currency, address } = req.body;

        if (!userId || !amount || !currency || !address) {
            return res.json({
                status: false,
                message: 'Missing required fields: amount, currency, address'
            });
        }
        // Use authenticated user from middleware if available, otherwise fetch from DB
        let user = req.user || (await UserModel.findById(userId));
        if (!user) {
            return res.json({ status: false, message: 'User not found' });
        }

        // Fees omitted here - platform may subtract fees before creating finalAmount
        const finalAmount = Number(amount);

        // Atomically decrement user's balance entry using positional operator
        // Match any balance.data element with sufficient funds
        const userAfterDec = await UserModel.findOneAndUpdate(
            { _id: userId, 'balance.data': { $elemMatch: { coinType: currency, balance: { $gte: finalAmount } } } },
            { $inc: { 'balance.data.$.balance': -finalAmount } },
            { new: true }
        );

        if (!userAfterDec) {
            return res.json({ status: false, message: 'Insufficient balance' });
        }

        // Create withdrawal record with status 'pending'
        let withdrawal = await new WithdrawalModel({
            userId,
            coinType: currency,
            chain: 'TRC20',
            tokenType: 'native',
            amount: finalAmount,
            networkFee: 0,
            platformFee: 0,
            totalFee: 0,
            finalAmount,
            toAddress: address,
            fromAddress: userAfterDec.address?.[currency] || 'unknown',
            status: 'pending',
            isDemo: userAfterDec.demoMode
        }).save();

        // If demo mode, confirm and return
        if (user.demoMode) {
            withdrawal.status = 'confirmed';
            withdrawal.transactionHash = `DEMO-${withdrawal._id}`;
            withdrawal.completedAt = new Date();
            await withdrawal.save();
            return res.json({ status: true, message: 'Demo withdrawal completed', withdrawal });
        }

        // Now call NOWPayments to create payout (outside transaction)
        const payoutResult = await nowpaymentsService.createPayout({
            currency: `${currency}TRC20`,
            amount: finalAmount,
            address,
            external_id: withdrawal._id.toString()
        });

        if (!payoutResult.status) {
            // Refund user on failure
            try {
                // Add amount back
                const userDoc = await UserModel.findById(userId);
                const balanceCont = userDoc.demoMode ? (userDoc.demoBalance || { data: [] }) : (userDoc.balance || { data: [] });
                let entry = balanceCont.data.find(b => b.coinType === currency && (b.chain === 'TRON' || b.type === 'trc-20' || b.chain === 'TRC20' || b.type === 'native'));
                if (!entry) { entry = { coinType: currency, balance: 0, chain: 'TRON', type: 'trc-20' }; balanceCont.data.push(entry); }
                entry.balance = Number(entry.balance || 0) + finalAmount;
                if (userDoc.demoMode) userDoc.demoBalance = balanceCont; else userDoc.balance = balanceCont;
                await userDoc.save();
            } catch (refundErr) {
                console.error('❌ Failed to refund user after payout failure:', refundErr.message || refundErr);
            }

            withdrawal.status = 'failed';
            withdrawal.failureReason = payoutResult.message || 'Payout initiation failed';
            try { withdrawal.notes = JSON.stringify({ nowpayments_error: payoutResult.error || payoutResult.message }); } catch (e) { withdrawal.notes = String(payoutResult.error || payoutResult.message); }
            await withdrawal.save();

            return res.json({ status: false, message: 'Payout initiation failed', error: payoutResult.error });
        }

        // Update withdrawal with external payout info
        withdrawal.status = 'processing';
        withdrawal.transactionHash = payoutResult.data?.id || payoutResult.data?.payout_id || '';
        try { withdrawal.notes = JSON.stringify({ nowpayments: payoutResult.data }); } catch (e) { withdrawal.notes = String(payoutResult.data || ''); }

        // Debit house for payout (house pays the user) and attach admin tx
        try {
            const houseRes = await houseHelper.debitHouse(finalAmount);
            if (houseRes && houseRes.tx) {
                const n = JSON.parse(withdrawal.notes || '{}');
                n.adminTx = houseRes.tx._id;
                withdrawal.notes = JSON.stringify(n);
            }
        } catch (e) {
            console.error('❌ Failed to debit house for payout:', e.message || e);
        }

        await withdrawal.save();

        return res.json({ status: true, message: 'Withdrawal initiated', withdrawal });
    } catch (error) {
        console.error('❌ Initiate withdrawal error:', error.message);
        return res.json({
            status: false,
            message: 'Failed to initiate withdrawal',
            error: error.message
        });
    }
};

/**
 * Get user's USDT transactions (deposits and withdrawals)
 * GET /api/v0/payments/usdt/transactions/{userId}
 */
exports.getUserUSDTTransactions = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Verify user can only access their own transactions (unless admin)
        if (userId !== req.userId && req.user.type !== 'admin') {
            return res.status(403).json({ status: false, message: 'Unauthorized' });
        }

        const skip = (page - 1) * limit;

        const transactions = await CryptoPaymentV2Model.find({
            userId: userId,
            coinType: 'USDT'
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await CryptoPaymentV2Model.countDocuments({
            userId: userId,
            coinType: 'USDT'
        });

        return res.json({
            status: true,
            data: transactions,
            pagination: {
                total: total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('❌ Get user USDT transactions error:', error.message);
        return res.json({
            status: false,
            message: 'Failed to get transactions',
            error: error.message
        });
    }
};

module.exports = exports;
