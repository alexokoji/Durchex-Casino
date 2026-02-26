// IPN payout test harness
// Usage: node ipn_payout_test.js

const mongoose = require('mongoose');
const path = require('path');
try { require('dotenv').config({ path: path.resolve(__dirname, '.env') }); } catch (e) {}

const MONGODB = process.env.MONGODB_URL || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/casino-local';

async function main() {
  console.log('Connecting to', MONGODB);
  await mongoose.connect(MONGODB, { useNewUrlParser: true, useUnifiedTopology: true });

  const models = require('./models');
  const nowpaymentsController = require('./controllers/nowpaymentsController');
  const nowpaymentsService = require('./services/nowpaymentsService');

  // Mock signature verification to always return true
  nowpaymentsService.verifyIPNSignature = () => true;

  // Create user and simulate post-deduction balance (1000 - 10 = 990)
  const user = await new models.userModel({
    userName: 'ipn-test', userNickName: 'ipn-test', userEmail: `ipn-${Date.now()}@local`, userPassword: 'test', demoMode: false,
    balance: { data: [ { coinType: 'USDT', balance: 990, chain: 'TRON', type: 'trc-20' } ] }
  }).save();

  // Create withdrawal in processing state
  const withdrawal = await new models.withdrawalModel({
    userId: user._id,
    coinType: 'USDT', chain: 'TRC20', tokenType: 'native', amount: 10,
    networkFee: 0, platformFee: 0, totalFee: 0, finalAmount: 10,
    toAddress: 'TTESTADDR', fromAddress: 'unknown', status: 'processing', isDemo: false
  }).save();

  // Build fake IPN for success
  const ipnSuccess = {
    id: `payout-${Date.now()}`,
    payout_id: `payout-${Date.now()}`,
    external_id: withdrawal._id.toString(),
    status: 'finished'
  };

  const req = { body: ipnSuccess, headers: { 'x-nowpayments-sig': 'mock' } };
  const res = { status(code) { this._status = code; return this; }, json(obj) { console.log('IPN success response:', obj); return obj; } };

  console.log('\n-- Sending SUCCESS IPN --');
  await nowpaymentsController.handleNOWPaymentsIPN(req, res);

  const w1 = await models.withdrawalModel.findById(withdrawal._id);
  const u1 = await models.userModel.findById(user._id);
  console.log('Withdrawal after SUCCESS IPN:', w1.status, 'completedAt:', w1.completedAt);
  console.log('User balance after SUCCESS IPN:', JSON.stringify(u1.balance, null, 2));

  // Now simulate failure: create new user/withdrawal
  const user2 = await new models.userModel({
    userName: 'ipn-test2', userNickName: 'ipn-test2', userEmail: `ipn2-${Date.now()}@local`, userPassword: 'test', demoMode: false,
    balance: { data: [ { coinType: 'USDT', balance: 990, chain: 'TRON', type: 'trc-20' } ] }
  }).save();

  const withdrawal2 = await new models.withdrawalModel({
    userId: user2._id,
    coinType: 'USDT', chain: 'TRC20', tokenType: 'native', amount: 10,
    networkFee: 0, platformFee: 0, totalFee: 0, finalAmount: 10,
    toAddress: 'TTESTADDR', fromAddress: 'unknown', status: 'processing', isDemo: false
  }).save();

  const ipnFail = {
    id: `payout-${Date.now()}-fail`,
    payout_id: `payout-${Date.now()}-fail`,
    external_id: withdrawal2._id.toString(),
    status: 'failed',
    message: 'Insufficient funds on provider'
  };

  const req2 = { body: ipnFail, headers: { 'x-nowpayments-sig': 'mock' } };
  const res2 = { status(code) { this._status = code; return this; }, json(obj) { console.log('IPN fail response:', obj); return obj; } };

  console.log('\n-- Sending FAILED IPN --');
  await nowpaymentsController.handleNOWPaymentsIPN(req2, res2);

  const w2 = await models.withdrawalModel.findById(withdrawal2._id);
  const u2 = await models.userModel.findById(user2._id);
  console.log('Withdrawal after FAILED IPN:', w2.status, 'failureReason:', w2.failureReason);
  console.log('User balance after FAILED IPN (should be refunded to 1000):', JSON.stringify(u2.balance, null, 2));

  await mongoose.disconnect();
  console.log('\nIPN payout tests complete.');
}

main().catch(err => { console.error('IPN test failed:', err.message || err); process.exit(1); });
