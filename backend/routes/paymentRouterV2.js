const express = require('express');
const router = express.Router();
const flutterwaveController = require('../controllers/flutterwaveController');
const nowpaymentsController = require('../controllers/nowpaymentsController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware for raw body parsing (for webhook signature verification)
router.use(express.json());

// ==================== FIAT PAYMENT (FLUTTERWAVE) ====================

// Initiate fiat deposit
router.post('/fiat/deposit', flutterwaveController.initiateDeposit);

// Initiate fiat withdrawal
router.post('/fiat/withdraw', flutterwaveController.initiateWithdrawal);

// Flutterwave webhook
router.post('/webhook/flutterwave', flutterwaveController.handleWebhook);

// Get fiat payment status
router.get('/fiat/status/:transactionId', flutterwaveController.getPaymentStatus);

// Get user fiat transactions
router.get('/fiat/transactions/:userId', flutterwaveController.getUserTransactions);

// ==================== CRYPTO PAYMENT (USDT/TRC20 - NOWPayments) ====================

// USDT deposit - Create payment order (Auth Required)
router.post('/usdt/trc20/create', authMiddleware, nowpaymentsController.createUSDTPayment);

// USDT payment status (Auth Required)
router.get('/usdt/:paymentId', authMiddleware, nowpaymentsController.getPaymentStatus);

// USDT transactions (Auth Required)
router.get('/usdt/transactions/:userId', authMiddleware, nowpaymentsController.getUserUSDTTransactions);

// ==================== USDT WITHDRAWAL (Auth Required) ====================

// USDT withdrawal - Initiate withdrawal request
router.post('/usdt/withdraw', authMiddleware, nowpaymentsController.initiateWithdrawal);

// USDT withdrawal status
router.get('/usdt/withdrawal/:withdrawalId', authMiddleware, async (req, res) => {
    try {
        const models = require('../models');
        const { withdrawalId } = req.params;
        
        const withdrawal = await models.withdrawalModel.findById(withdrawalId);
        if (!withdrawal) {
            return res.status(404).json({ status: false, message: 'Withdrawal not found' });
        }
        
        // Verify withdrawal belongs to authenticated user
        if (withdrawal.userId.toString() !== req.userId) {
            return res.status(403).json({ status: false, message: 'Unauthorized' });
        }
        
        return res.json({ status: true, data: withdrawal });
    } catch (error) {
        console.error('❌ Get withdrawal status error:', error.message);
        return res.status(500).json({ status: false, message: 'Failed to get withdrawal status', error: error.message });
    }
});

// USDT withdrawal history
router.get('/usdt/withdrawals/history/:userId', authMiddleware, async (req, res) => {
    try {
        const models = require('../models');
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        // Verify user can only access their own history
        if (userId !== req.userId && req.user.type !== 'admin') {
            return res.status(403).json({ status: false, message: 'Unauthorized' });
        }
        
        const skip = (page - 1) * limit;
        const withdrawals = await models.withdrawalModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await models.withdrawalModel.countDocuments({ userId });
        
        return res.json({
            status: true,
            data: withdrawals,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('❌ Get withdrawal history error:', error.message);
        return res.status(500).json({ status: false, message: 'Failed to get withdrawal history', error: error.message });
    }
});

// NOWPayments IPN Webhook (signature verified, no auth needed)
router.post('/nowpayments/ipn', nowpaymentsController.handleNOWPaymentsIPN);

// ==================== UNIFIED PAYMENT ENDPOINTS ====================

// Get all transactions for user (both fiat and crypto)
router.get('/transactions/:userId', async (req, res) => {
    try {
        const UnifiedPaymentModel = require('../models/UnifiedPaymentModel');
        const { userId } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        const transactions = await UnifiedPaymentModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .populate('flutterwaveTransactionId')
            .populate('cryptoPaymentId');

        const total = await UnifiedPaymentModel.countDocuments({ userId });

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
});

// Get transaction details by unified ID
router.get('/transaction/:transactionId', async (req, res) => {
    try {
        const UnifiedPaymentModel = require('../models/UnifiedPaymentModel');
        const { transactionId } = req.params;

        const transaction = await UnifiedPaymentModel.findById(transactionId)
            .populate('flutterwaveTransactionId')
            .populate('cryptoPaymentId');

        if (!transaction) {
            return res.status(404).json({ status: false, message: 'Transaction not found' });
        }

        res.json({
            status: true,
            data: transaction
        });

    } catch (error) {
        console.error('❌ Get transaction error:', error.message);
        res.status(500).json({ 
            status: false, 
            message: 'Failed to get transaction',
            error: error.message 
        });
    }
});

module.exports = router;
