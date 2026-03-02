const mongoose = require('mongoose');
const { generateSeed } = require('../../helper/mainHelper');
const models = require('../../models/index');
const SocketManager = require('../manager/SocketManager');
const houseHelper = require('../../helpers/houseHelper');

exports.getSeedData = async (userId) => {
    try {
        let clientSeedData = await models.seedModel.findOne({ userId: userId, type: 'client' }).sort({ date: -1 });
        if (!clientSeedData) {
            clientSeedData = await new models.seedModel({ userId: mongoose.Types.ObjectId(userId), type: 'client', seed: generateSeed(), date: new Date() }).save();
        }
        let serverSeedData = await models.seedModel.findOne({ type: 'server' }).sort({ date: -1 });
        if (!serverSeedData) {
            serverSeedData = await new models.seedModel({ type: 'server', seed: generateSeed(), date: new Date() }).save();
        }
        return { serverSeedData, clientSeedData };
    }
    catch (err) {
        console.error({ title: 'PlinkoController => getSeedData', message: err.message });
        return { status: false, message: err.message };
    }
}

exports.savePlinkoRound = async (data) => {
    try {
        const { serverSeed, clientSeed, roundNumber, userId, betAmount, rowCount, risk, payout } = data;
        const userData = await models.userModel.findOne({ _id: userId });
        if (!userData) return { status: false, message: 'User not found' };

        const field = userData.demoMode ? 'demoChipsBalance' : 'chipsBalance';
        let current = userData[field] || 0;
        const betNum = Number(betAmount) || 0;
        if (current < betNum) {
            return { status: false, message: 'Not enough balance' };
        }

        // deduct bet and record wager
        current -= betNum;
        userData[field] = current;
        await models.userModel.findByIdAndUpdate(userId, { [field]: current });
        SocketManager.requestWargerAmountUpdate({ userId: userId, amount: betNum, coinType: 'CHIPS' });
        try { await houseHelper.creditHouse(betNum); } catch (err) { console.error('PlinkoController house credit error', err.message); }

        const roundData = await new models.plinkoRoundModel({
            roundNumber: roundNumber,
            userId: userId,
            betAmount: betNum,
            coinType: 'CHIPS',
            payout: payout,
            rows: rowCount,
            risk: risk,
            serverSeed: serverSeed,
            clientSeed: clientSeed,
            roundDate: new Date()
        }).save();

        const winAmount = betNum * (Number(payout) - 1);
        if (winAmount > 0) {
            current += winAmount;
            userData[field] = current;
            await models.userModel.findByIdAndUpdate(userId, { [field]: current });
            try { await houseHelper.debitHouse(winAmount); } catch (err) { console.error('PlinkoController house debit error', err.message); }
        }
        return { status: true, data: userData, roundData: roundData };
    }
    catch (err) {
        console.error({ title: 'PlinkoController => savePlinkoRound', message: err.message });
        return { status: false, message: err.message };
    }
}