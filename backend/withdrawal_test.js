// Local withdrawal test harness
// Usage: node withdrawal_test.js

const mongoose = require('mongoose');
const path = require('path');

// Try load dotenv from backend/.env if present
try { require('dotenv').config({ path: path.resolve(__dirname, '.env') }); } catch (e) {}

const MONGODB = process.env.MONGODB_URL || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/casino-local';

async function main() {
  console.log('Connecting to', MONGODB);
  await mongoose.connect(MONGODB, { useNewUrlParser: true, useUnifiedTopology: true });

  const models = require('./models');
  const nowpaymentsService = require('./services/nowpaymentsService');

  // Mock createPayout to avoid external network call
  nowpaymentsService.createPayout = async (params) => {
    console.log('Mocked createPayout called with', params);
    return { status: true, data: { id: `MOCK-PAYOUT-${Date.now()}`, external_id: params.external_id } };
  };

  const nowpaymentsController = require('./controllers/nowpaymentsController');

  // Create a fresh test user to avoid conflicting pre-existing documents
  const uniqueEmail = `withdrawal-test-${Date.now()}@local`;
  const user = await new models.userModel({
    userName: 'withdrawal-test',
    userNickName: 'withdrawal-test',
    userEmail: uniqueEmail,
    userPassword: 'test',
    demoMode: false,
    balance: { data: [ { coinType: 'USDT', balance: 1000, chain: 'TRON', type: 'trc-20' } ] }
  }).save();
  console.log('Created fresh test user', user._id.toString());

  // Prepare fake req/res
  const req = { body: { userId: user._id.toString(), amount: 10, currency: 'USDT', address: 'TTESTADDRESS123' } };
  let captured = null;
  const res = {
    status(code) { this._status = code; return this; },
    json(obj) { captured = obj; console.log('Controller response:', JSON.stringify(obj, null, 2)); return obj; }
  };

  console.log('\nInvoking initiateWithdrawal...');
  await nowpaymentsController.initiateWithdrawal(req, res);

  // Fetch latest withdrawal
  const withdrawal = await models.withdrawalModel.findOne({ userId: user._id }).sort({ createdAt: -1 });
  console.log('\nLatest withdrawal record:', withdrawal ? withdrawal.toObject() : 'none');

  // Fetch user balance
  const freshUser = await models.userModel.findById(user._id);
  console.log('\nUser balance after withdrawal:', JSON.stringify(freshUser.balance, null, 2));

  await mongoose.disconnect();
  console.log('\nTest complete.');
}

main().catch(err => {
  console.error('Test failed:', err.message || err);
  process.exit(1);
});
