const mongoose = require('mongoose');
const config = require('../config');
const models = require('../models/index');
const flutterWaveController = require('../controllers/flutterWaveController');

/**
 * Test Flutterwave payment integration
 */
async function testFlutterwave() {
  try {
    // ensure front URL is set for redirect payloads (fallback will also be applied server-side)
    process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Connect to database
    await mongoose.connect(config.DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('🗄️  Connected to database');

    // Find or create test user
    // pick an email that satisfies Flutterwave validation (must look like a real address)
  const TEST_EMAIL = 'flutterwave@example.com';

  let user = await models.userModel.findOne({ userEmail: TEST_EMAIL });
    if (!user) {
      user = await models.userModel.create({
        userName: '0xflutterwave',
        userNickName: 'flutterwave',
        userEmail: TEST_EMAIL,
        userPassword: 'test',
        type: 'user',
        demoMode: false,
        demoMode: true,  // Start in demo for testing
        chipsBalance: 1000,
        demoChipsBalance: 5000,
        balance: { data: [{ coinType: 'USDT', balance: 1000, chain: 'ETH', type: 'erc-20' }] },
        demoBalance: { data: [{ coinType: 'USDT', balance: 5000, chain: 'ETH', type: 'erc-20' }] }
      });
      console.log('✅ Created test user:', user._id.toString());
    } else {
      console.log('♻️  Using existing test user:', user._id.toString());
    }

    console.log('\n📋 Test Fleet:');
    console.log('  Real USDT balance:', user.balance?.data?.[0]?.balance || 0);
    console.log('  Demo USDT balance:', user.demoBalance?.data?.[0]?.balance || 0);
    console.log('  TEST_EMAIL value:', TEST_EMAIL);
    console.log('  user.userEmail:', user.userEmail);

    // Test 1: Initialize deposit
    console.log('\n🔄 [Test 1] Initialize deposit...');
    const initReq = {
      body: {
        userId: user._id.toString(),
        amount: 100,
        currency: 'USD',
        paymentMethod: 'card',
        customerEmail: TEST_EMAIL,
        customerPhone: '+1234567890',
        customerName: 'Test User'
      }
    };
    const initRes = { json: (p) => p };
    // run the initialize call with a timeout so we don't hang indefinitely
    let initResult;
    try {
      initResult = await Promise.race([
        flutterWaveController.initializeDeposit(initReq, initRes),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))
      ]);
    } catch (e) {
      console.error('initializeDeposit threw', e.message);
      initResult = { status: false, message: e.message };
    }
    console.log('📤 initializeDeposit response:', JSON.stringify(initResult, null, 2));

    if (!initResult.status) {
      console.log('⚠️  Deposit initialization may have failed (expected if FlutterWave API not reachable)');
    } else {
      console.log('✅ Deposit initialized successfully');
      const paymentLink = initResult.data?.paymentLink;
      const reference = initResult.data?.reference;

      // automatically open the payment gateway URL in the default browser
      if (paymentLink) {
        console.log('🌐 Opening Flutterwave gateway URL in default browser...');
        try {
          const { exec } = require('child_process');
          const opener = process.platform === 'win32'
            ? `start "" "${paymentLink}"`
            : process.platform === 'darwin'
            ? `open "${paymentLink}"`
            : `xdg-open "${paymentLink}"`;
          exec(opener, err => {
            if (err) console.warn('Could not open browser:', err.message);
          });
        } catch (err) {
          console.warn('Error launching browser:', err.message);
        }
      }

      // Test 2: Verify payment (this will likely fail since we don't have a real transaction)
      if (reference) {
        console.log('\n✔️  [Test 2] Verify payment (using reference)...');
        const verifyReq = { body: { reference } };
        const verifyRes = { json: (p) => p };
        const verifyResult = await flutterWaveController.verifyPayment(verifyReq, verifyRes);
        console.log('📤 verifyPayment response:', JSON.stringify(verifyResult, null, 2));
      }
    }

    // Test 3: Get payment history
    console.log('\n📜 [Test 3] Get payment history...');
    const histReq = {
      body: {
        userId: user._id.toString(),
        type: 'deposit',
        limit: 10,
        skip: 0
      }
    };
    let histResult = null;
    const histRes = { 
      json: (p) => { histResult = p; return p; } 
    };
    await flutterWaveController.getPaymentHistory(histReq, histRes);
    if (histResult) {
      console.log('📤 getPaymentHistory response:');
      console.log('  Status:', histResult.status);
      console.log('  Total records:', histResult.pagination?.total);
      if (histResult.data && histResult.data.length > 0) {
        console.log('  Recent record:', {
          reference: histResult.data[0].reference,
          amount: histResult.data[0].amount,
          status: histResult.data[0].status,
          type: histResult.data[0].type
        });
      }
    } else {
      console.log('⚠️  No response from getPaymentHistory');
    }

    // Test 4: Simulate a successful deposit
    console.log('\n💳 [Test 4] Simulate successful payment and verify balance update...');
    const simulatedPayment = await models.flutterWavePaymentModel.create({
      userId: user._id,
      reference: `SIM_${user._id.toString()}_${Date.now()}`,
      type: 'deposit',
      paymentMethod: 'card',
      currency: 'USD',
      amount: 50,
      status: 'pending',
      transactionId: `SIM_TX_${Date.now()}`,
      paymentStatus: 'successful',
      netAmount: 50,
      chargeAmount: 2.5,
      customerEmail: TEST_EMAIL,
      completedAt: new Date()
    });
    console.log('✅ Simulated payment created:', simulatedPayment.reference);

    // Verify payment with simulated transaction
    const verifySimReq = { body: { reference: simulatedPayment.reference } };
    const verifySimRes = { json: (p) => p };
    const verifySimResult = await flutterWaveController.verifyPayment(verifySimReq, verifySimRes);
    console.log('📤 verifyPayment (simulated) response:', JSON.stringify(verifySimResult, null, 2));

    // Check user balance after
    const updatedUser = await models.userModel.findById(user._id);
    console.log('\n✅ User balance after simulated deposit:');
    console.log('  Real USDT balance:', updatedUser.balance?.data?.[0]?.balance || 0);
    console.log('  Demo USDT balance:', updatedUser.demoBalance?.data?.[0]?.balance || 0);
    console.log('  Real Chips balance:', updatedUser.chipsBalance);
    console.log('  Demo Chips balance:', updatedUser.demoChipsBalance);

    // Test 5: Get payment history again
    console.log('\n📜 [Test 5] Get payment history (final check)...');
    const histReq2 = {
      body: {
        userId: user._id.toString(),
        type: 'deposit',
        limit: 10,
        skip: 0
      }
    };
    let histResult2 = null;
    const histRes2 = { 
      json: (p) => { histResult2 = p; return p; }
    };
    await flutterWaveController.getPaymentHistory(histReq2, histRes2);
    if (histResult2) {
      console.log('📤 getPaymentHistory response:');
      console.log('  Status:', histResult2.status);
      console.log('  Total records:', histResult2.pagination?.total);
      if (histResult2.data && histResult2.data.length > 0) {
        console.log('  First 2 recent records:');
        histResult2.data.slice(0, 2).forEach((r, i) => {
          console.log(`    [${i + 1}] ${r.reference} - ${r.type} ${r.currency} ${r.amount} (${r.status})`);
        });
      }
    }

    // Test 6: Withdrawal initialization (check balance validation)
    console.log('\n💸 [Test 6] Test withdrawal (should check balance)...');
    const withdrawReq = {
      body: {
        userId: user._id.toString(),
        amount: 5,  // less than available
        accountNumber: '1234567890',
        accountBank: 'Demo Bank',
        bankCode: '999',
        currency: 'USD',
        narration: 'Test withdrawal'
      }
    };
    const withdrawRes = { json: (p) => p };
    const withdrawResult = await flutterWaveController.initiateWithdrawal(withdrawReq, withdrawRes);
    console.log('📤 initiateWithdrawal response:', JSON.stringify(withdrawResult, null, 2));

    console.log('\n✨ Flutterwave integration tests completed!');
    await mongoose.disconnect();
    console.log('🛑 Disconnected from database');

  } catch (err) {
    console.error('❌ Test error:', err.message);
    process.exit(1);
  }
}

testFlutterwave();
