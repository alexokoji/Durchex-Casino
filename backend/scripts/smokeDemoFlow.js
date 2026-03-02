/*
 * Smoke test for demo balance flow.
 * Usage: node scripts/smokeDemoFlow.js
 *
 * This script connects to the same MongoDB used by the backend, creates a
 * disposable test user (or reuses it), enables demo mode, simulates a deposit,
 * and then exercises the Crash/Slot controllers to place a bet and credit a
 * payout.  All operations print their results so you can verify the demo
 * balance updates correctly.
 *
 * You can extend this script with additional controllers (dice, plinko, etc.)
 * following the same pattern.  The goal is a lightweight end-to-end sanity
 * check that the backend logic used by the frontend works as expected.
 */

const mongoose = require('mongoose');
// script now lives under backend/scripts, so relative paths are simpler
const config = require('../config');
const models = require('../models/index');
const walletController = require('../controllers/walletController');
const crashController = require('../crash/controller/CrashController');
const slotController = require('../slot/controller/SlotController');

async function main() {
    await mongoose.connect(config.DB, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('🗄️  Connected to database');

    // find or create a test user
    let user = await models.userModel.findOne({ email: 'smoke@demo.test' });
    if (!user) {
        user = await new models.userModel({
            email: 'smoke@demo.test',
            password: 'password',
            userNickName: 'SmokeTester',
            currency: { coinType: 'CHIPS', type: 'chip' },
            balance: { data: [{ coinType: 'CHIPS', balance: 0, chain: '', type: 'native' }] },
            demoMode: true,
            demoBalance: { data: [{ coinType: 'CHIPS', balance: 0, chain: '', type: 'native' }] }
        }).save();
        console.log('➕ Created new demo user', user._id);
    } else {
        console.log('♻️  Reusing existing demo user', user._id);
    }

    // ensure demo mode is enabled
    user.demoMode = true;
    if (!user.demoBalance || !Array.isArray(user.demoBalance.data)) {
        user.demoBalance = { data: [{ coinType: 'CHIPS', balance: 0, chain: '', type: 'native' }] };
    }
    await user.save();

    console.log('🔁 Demo mode is active');

    // simulate deposit via the legacy route handler
    const req = { body: { userId: user._id.toString(), coinType: 'CHIPS', chain: '', amount: 150 } };
    const res = { json: (payload) => { console.log('📥 simulateDepositReceived response:', payload); return payload; } };
    await walletController.simulateDepositReceived(req, res);

    user = await models.userModel.findById(user._id);
    console.log('💰 Demo balance after deposit:', JSON.stringify(user.demoBalance));

    // place a bet of 10 chips using CrashController
    console.log('\n🎲 Running game controller checks');
    const betResp = await crashController.updatePlayerBalance({ userId: user._id.toString(), amount: 10 });
    console.log('➡️  CrashController bet response:', betResp);
    const payoutResp = await crashController.updatePlayerBalance({ userId: user._id.toString(), amount: -25 });
    console.log('⬅️  CrashController payout response:', payoutResp);

    // optional: also run slot controller
    const slotBetResp = await slotController.saveSlotRound({
        serverSeed: 'dummy',
        clientSeed: 'dummy',
        roundNumber: 1,
        userId: user._id.toString(),
        betAmount: 5,
        rewardData: [],
        payout: 2,
        roundResult: {}
    });
    console.log('🎰 SlotController round save response:', slotBetResp);

    user = await models.userModel.findById(user._id);
    console.log('✅ Final demo balance:', JSON.stringify(user.demoBalance));

    mongoose.disconnect();
    console.log('🛑 Test complete; disconnected.');
}

main().catch(err => {
    console.error('🔥 Smoke test failed:', err);
    process.exit(1);
});
