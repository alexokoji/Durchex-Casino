// Fiat (Flutterwave) deposit & withdrawal test harness
// Usage: node fiat_flow_test.js

const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');

// load environment if available
try { require('dotenv').config({ path: path.resolve(__dirname, '.env') }); } catch (e) {}

const MONGODB = process.env.MONGODB_URL || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/casino-local';

async function main() {
  console.log('Connecting to', MONGODB);
  await mongoose.connect(MONGODB, { useNewUrlParser: true, useUnifiedTopology: true });

  const models = require('./models');
  const flutterWaveController = require('./controllers/flutterWaveController');
  const axios = require('axios');

  // Log environment variables for debugging
  console.log('\nEnvironment config:');
  console.log('- FLUTTERWAVE_ENV:', process.env.FLUTTERWAVE_ENV);
  console.log('- FLUTTERWAVE_API_KEY:', process.env.FLUTTERWAVE_API_KEY ? '***set***' : 'NOT SET');
  console.log('- FLUTTERWAVE_SECRET_KEY:', process.env.FLUTTERWAVE_SECRET_KEY ? '***set***' : 'NOT SET');
  console.log('- FLUTTERWAVE_SECRET_HASH:', process.env.FLUTTERWAVE_SECRET_HASH ? '***set***' : 'NOT SET');
  console.log('');
  // optionally stub axios calls; real network used if REAL_MODE env var is truthy
  let originalPost, originalGet;
  if (!process.env.REAL_MODE) {
    console.log('=== axios requests will be intercepted with mock responses ===');
    originalPost = axios.post;
    originalGet = axios.get;
    axios.post = async (url, data, opts) => {
      console.log('== axios.post intercepted', url);
      if (url.includes('/payments')) {
        // simulate create payment
        return { data: { status: 'success', data: { link: 'http://fake-link', authorization_url: 'http://fake-auth-url' } } };
      }
      if (url.includes('/transfers')) {
        return { data: { status: 'success', data: { id: `MOCK-TRANSFER-${Date.now()}` } } };
      }
      return originalPost(url, data, opts);
    };
    axios.get = async (url, opts) => {
      console.log('== axios.get intercepted', url);
      if (url.includes('/transactions/verify_by_reference')) {
        // return a successful transaction for the reference
        const tx_ref = url.split('=')[1];
        return { data: { status: 'success', data: { id: `MOCKTX-${Date.now()}`, status: 'successful', amount: 100, charge: 2 } } };
      }
      return originalGet(url, opts);
    };
  } else {
    console.log('=== REAL_MODE enabled: axios will perform actual network calls ===');
    // Wrap axios to log detailed error responses
    originalPost = axios.post;
    axios.post = async (url, data, opts) => {
      try {
        console.log('→ POST', url.substring(url.lastIndexOf('/') + 1));
        return await originalPost(url, data, opts);
      } catch (err) {
        console.error('❌ POST failed:', err.response?.status, '-', err.response?.statusText);
        console.error('   Response data:', JSON.stringify(err.response?.data || err.message, null, 2));
        throw err;
      }
    };
  }

  // create fresh user
  const uniqueEmail = `fiat-test-${Date.now()}@local`;
  const user = await new models.userModel({
    userName: 'fiat-test',
    userNickName: 'fiat-test',
    userEmail: uniqueEmail,
    userPassword: 'test',
    demoMode: false,
    balance: { data: [ { coinType: 'USDT', balance: 0, chain: 'TRON', type: 'trc-20' } ] }
  }).save();
  console.log('Created test user', user._id.toString());

  // deposit initialization
  const depositReq = { body: {
    userId: user._id.toString(),
    amount: 100,
    currency: 'NGN',
    paymentMethod: 'card',
    customerEmail: uniqueEmail,
    customerPhone: '08000000000',
    customerName: 'Fiat Tester'
  } };
  let depositResPayload = null;
  const depositRes = {
    json(obj) { depositResPayload = obj; console.log('initializeDeposit response', obj); return obj; }
  };
  console.log('\n-- Calling initializeDeposit --');
  await flutterWaveController.initializeDeposit(depositReq, depositRes);

  // if we have a reference we can invoke verifyPayment (demo or mocked)
  if (depositResPayload?.data?.reference) {
    const verifyReq = { body: { reference: depositResPayload.data.reference } };
    const verifyRes = { json(obj) { console.log('verifyPayment response', obj); return obj; } };
    console.log('\n-- Calling verifyPayment --');
    try {
      await flutterWaveController.verifyPayment(verifyReq, verifyRes);
    } catch (e) { console.error('verifyPayment exception', e.message); }
  }

  // simulate webhook from flutterwave 'charge.completed'
  const webhookBody = {
    event: 'charge.completed',
    data: {
      id: `MOCKFLW-${Date.now()}`,
      tx_ref: depositResPayload.data.reference,
      status: 'successful',
      amount: depositReq.body.amount,
      charge: 0
    }
  };
  // the environment variable naming differs between setups; try both
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLUTTERWAVE_SECRET_HASH;
  if (!secretKey) {
    throw new Error('Missing flutterwave secret key/hash in environment');
  }
  const secretHash = crypto
    .createHmac('sha256', secretKey)
    .update(JSON.stringify(webhookBody))
    .digest('base64');
  const webhookReq = { body: webhookBody, headers: { verificationhash: secretHash } };
  const webhookRes = { status(code) { this._status = code; return this; }, json(obj) { console.log('webhook response', obj); return obj; } };
  console.log('\n-- Sending webhook --');
  await flutterWaveController.flutterWaveWebhook(webhookReq, webhookRes);

  // check updated balance
  const u1 = await models.userModel.findById(user._id);
  console.log('Balance after deposit (should 100):', JSON.stringify(u1.balance, null, 2));

  // withdrawal test
  const withdrawReq = { body: {
    userId: user._id.toString(),
    amount: 50,
    accountNumber: '1234567890',
    accountBank: 'Test Bank',
    bankCode: 'TESTCODE',
    currency: 'NGN',
    narration: 'Withdrawal test'
  } };
  let withdrawResPayload = null;
  const withdrawRes = { json(obj) { withdrawResPayload = obj; console.log('initiateWithdrawal response', obj); return obj; } };
  console.log('\n-- Calling initiateWithdrawal --');
  await flutterWaveController.initiateWithdrawal(withdrawReq, withdrawRes);

  const u2 = await models.userModel.findById(user._id);
  console.log('Balance after withdrawal (should 50):', JSON.stringify(u2.balance, null, 2));

  // list payments
  const historyReq = { body: { userId: user._id.toString() } };
  const historyRes = { json(obj) { console.log('payment history', JSON.stringify(obj, null, 2)); return obj; } };
  await flutterWaveController.getPaymentHistory(historyReq, historyRes);

  await mongoose.disconnect();
  console.log('\nFiat flow test complete.');
}

main().catch(err => { console.error('Fiat flow test failed:', err); process.exit(1); });
