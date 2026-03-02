const mongoose = require('mongoose');
const { generateSeed } = require('../../helper/mainHelper');
const models = require('../../models/index');
const { requestWargerAmountUpdate } = require('../socket/Manager');
const houseHelper = require('../../helpers/houseHelper');

exports.saveDiceRound = async (data) => {
    try {
        const userData = await models.userModel.findOne({ _id: data.userId });
        if (!userData) return { status: false, message: 'User not found' };

        // numeric chips balance field
        const field = userData.demoMode ? 'demoChipsBalance' : 'chipsBalance';
        let current = userData[field] || 0;
        const betNum = Number(data.betAmount) || 0;
        if (current < betNum) {
            return { status: false, message: 'Not enough balance' };
        }

        // record wager - application logic may credit house immediately on loss
        const roundData = await new models.diceRoundModel({
            roundNumber: data.roundNumber,
            userId: data.userId,
            betAmount: betNum,
            coinType: 'CHIPS',
            difficulty: data.difficulty,
            isOver: data.isOver,
            payout: data.payout,
            fairData: data.fairData,
            roundResult: data.roundResult,
            serverSeed: data.serverSeed,
            clientSeed: data.clientSeed,
            roundDate: new Date()
        }).save();

        // update balance depending on outcome
        if (data.roundResult === 'win') {
            const winAmount = betNum * (Number(data.payout) - 1);
            current += winAmount;
            userData[field] = current;
            await models.userModel.findByIdAndUpdate(data.userId, { [field]: current });
            try { await houseHelper.debitHouse(winAmount); } catch (err) { console.error('diceController house debit error', err.message); }
        } else if (data.roundResult === 'lost') {
            current -= betNum;
            userData[field] = current;
            await models.userModel.findByIdAndUpdate(data.userId, { [field]: current });
            try { await houseHelper.creditHouse(betNum); } catch (err) { console.error('diceController house credit error', err.message); }
        }

        // notify front‑end of balance change or wager
        requestWargerAmountUpdate({ userId: data.userId, amount: betNum, coinType: 'CHIPS' });
        return { status: true, data: userData, roundData: roundData };
    }
    catch (err) {
        console.error({ title: 'diceController => saveDiceRound', message: err.message });
        return { status: false, message: err.message };
    }
}

exports.getHistory = async (data) => {
    try {
        const { userId } = data;
        const historyData = await models.diceRoundModel.find({ userId }).sort({ roundDate: '-1' }).limit(5);
        return historyData;
    }
    catch (err) {
        console.error({ title: 'diceController => getHistory', message: err.message });
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
        console.error({ title: 'diceController => getSeedData', message: err.message });
        return { status: false, message: err.message };
    }
}