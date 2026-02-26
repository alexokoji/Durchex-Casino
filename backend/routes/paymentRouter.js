const express = require('express');
const router = express.Router();
const flutterWaveController = require('../controllers/flutterWaveController');
const paymentController = require('../controllers/paymentController');
const cryptoController = require('../controllers/cryptoController');
const walletController = require('../controllers/walletController');

// ==================== FLUTTERWAVE ROUTES ====================

/**
 * POST /api/v0/payment/flutterwave/initialize
 * Initialize Flutterwave deposit payment
 */
router.post('/flutterwave/initialize', flutterWaveController.initializeDeposit);

/**
 * POST /api/v0/payment/flutterwave/verify
 * Verify Flutterwave payment completion
 */
router.post('/flutterwave/verify', flutterWaveController.verifyPayment);

/**
 * POST /api/v0/payment/flutterwave/webhook
 * Flutterwave webhook for automatic payment updates
 */
router.post('/flutterwave/webhook', flutterWaveController.flutterWaveWebhook);

/**
 * POST /api/v0/payment/flutterwave/withdraw
 * Initiate Flutterwave withdrawal (bank transfer)
 */
router.post('/flutterwave/withdraw', flutterWaveController.initiateWithdrawal);

/**
 * POST /api/v0/payment/flutterwave/history
 * Get Flutterwave payment history
 */
router.post('/flutterwave/history', flutterWaveController.getPaymentHistory);

// ==================== CRYPTO ROUTES (UNIFIED) ====================

/**
 * POST /api/v0/payment/crypto/address
 * Create crypto deposit address
 */
router.post('/crypto/address', paymentController.createDepositAddress);

/**
 * POST /api/v0/payment/crypto/webhook
 * Crypto webhook handler (from exchange or block listener)
 */
router.post('/crypto/webhook', paymentController.cryptoWebhook);

/**
 * POST /api/v0/payment/crypto/status
 * Get crypto deposit status and confirmation count
 */
router.post('/crypto/status', paymentController.getDepositStatus);

/**
 * POST /api/v0/payment/crypto/withdraw
 * Initiate crypto withdrawal
 */
router.post('/crypto/withdraw', paymentController.initiateWithdrawal);

/**
 * POST /api/v0/payment/crypto/process-withdrawal
 * Process pending crypto withdrawal (admin only)
 */
router.post('/crypto/process-withdrawal', paymentController.processWithdrawal);

/**
 * POST /api/v0/payment/crypto/history
 * Get crypto payment history
 */
router.post('/crypto/history', paymentController.getPaymentHistory);

/**
 * GET /api/v0/payment/crypto/supported
 * Get list of supported cryptocurrencies
 */
router.get('/crypto/supported', paymentController.getSupportedCoins);

// ==================== BACKWARD COMPATIBILITY ROUTES ====================

// Legacy crypto controller routes - kept for backward compatibility
router.post('/webhook-handler', cryptoController.tatumWebhook);
router.post('/deposit-address', cryptoController.getDepositAddressFromAccount);
router.post('/get-balance', cryptoController.getBalanceFromAccount);
router.post('/withdraw', cryptoController.withdrawFromAccount);
router.post('/btc-withdraw', cryptoController.withdrawBTCFromAccount);
router.post('/eth-withdraw', cryptoController.withdrawETHFromAccount);
router.post('/tron-withdraw', cryptoController.withdrawTRONFromAccount);
router.post('/get-daily-reward', cryptoController.getDailyReward);
router.post('/getCurrencies', cryptoController.getCurrencies);
router.post('/getExchangeRate', cryptoController.getExchangeRate);
router.post('/swapCoin', cryptoController.swapCoin);

// Legacy wallet demo routes - kept for backward compatibility
router.post('/demo/balance', walletController.getDemoBalance);
router.post('/demo/toggle', walletController.toggleDemoMode);
router.post('/demo/simulate-deposit', walletController.simulateDepositReceived);

// Legacy withdrawal routes - kept for backward compatibility
router.post('/withdrawal/process', walletController.processWithdrawal);
router.post('/withdrawal/history', walletController.getWithdrawalHistory);
router.post('/withdrawal/status', walletController.getWithdrawalStatus);

// Legacy deposit routes - kept for backward compatibility
router.post('/deposit/get-address', walletController.getOrCreateDepositAddress);
router.post('/deposit/history', walletController.getDepositHistory);

module.exports = router;