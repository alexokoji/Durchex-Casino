const mongoose = require('mongoose');
const { generateSeed } = require('../../helper/mainHelper');
const models = require('../../models/index');
const { payout } = require('../constant');
const { requestBalanceUpdate, requestWargerAmountUpdate } = require('../socket/Manager');
const houseHelper = require('../../helpers/houseHelper');

exports.saveScissorsRound = async (data) => {
    try {
        const userData = await models.userModel.findOne({ _id: data.userId });
        if (!userData) return { status: false, message: 'User not found' };

        const field = userData.demoMode ? 'demoChipsBalance' : 'chipsBalance';
        let current = userData[field] || 0;
        const betNum = Number(data.betAmount) || 0;
        if (current < betNum) {
            return { status: false, message: 'Not enough balance' };
        }

        // deduct bet
        current -= betNum;
        userData[field] = current;
        await models.userModel.findByIdAndUpdate(data.userId, { [field]: current });
        requestWargerAmountUpdate({ userId: data.userId, amount: betNum, coinType: 'CHIPS' });
        try { await houseHelper.creditHouse(betNum); } catch (err) { console.error('scissorsController house credit error', err.message); }

        const roundData = await new models.scissorsRoundModel({
            roundNumber: data.roundNumber,
            userId: data.userId,
            betAmount: betNum,
            coinType: 'CHIPS',
            betNumber: data.playerNumber,
            winNumber: data.dealerNumber,
            roundResult: data.result,
            serverSeed: data.serverSeed,
            clientSeed: data.clientSeed,
            payout: payout,
            roundDate: new Date()
        }).save();

        if (data.result === 'win') {
            const winAmount = betNum * (Number(payout) - 1);
            current += winAmount;
            userData[field] = current;
            await models.userModel.findByIdAndUpdate(data.userId, { [field]: current });
            try { await houseHelper.debitHouse(winAmount); } catch (err) { console.error('scissorsController house debit error', err.message); }
        } else if (data.result === 'lost') {
            // bet already debited above
            try { await houseHelper.creditHouse(betNum); } catch (err) { console.error('scissorsController house credit error', err.message); }
        }

        setTimeout(() => {
            requestBalanceUpdate(userData);
        }, 6000);
        return { status: true, data: userData, roundData: roundData };
    }
    catch (err) {
        console.error({ title: 'scissorsController => saveScissorsRound', message: err.message });
        return { status: false, message: err.message };
    }
}

exports.getHistory = async (data) => {
    try {
        const { userId } = data;
        const historyData = await models.scissorsRoundModel.find({ userId }).sort({ roundDate: '-1' }).limit(5);
        return historyData;
    }
    catch (err) {
        console.error({ title: 'scissorsController => getHistory', message: err.message });
        return { status: false, message: err.message };
    }
}

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
        console.error({ title: 'scissorsController => getSeedData', message: err.message });
        return { status: false, message: err.message };
    }
}