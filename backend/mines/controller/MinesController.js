const models = require('../../models/index');
const mongoose = require('mongoose');
const { generateSeed } = require('../../helper/mainHelper');
const { requestWargerAmountUpdate } = require('../socket/Manager');
const houseHelper = require('../../helpers/houseHelper');

exports.updateMyBalance = async (data) => {
    try {
        const { userId, betAmount, type } = data;
        let userData = await models.userModel.findOne({ _id: userId });
        if (!userData)
            return { status: false, message: 'User not found' };

        const field = userData.demoMode ? 'demoChipsBalance' : 'chipsBalance';
        let current = userData[field] || 0;
        const amountNum = Number(betAmount) || 0;

        if (amountNum > 0) {
            if (current < amountNum) {
                return { status: false, message: 'Not enough balance' };
            }
            // send wager update when placing or finishing a bet
            if (betAmount >= 0 || type === 'finish') {
                requestWargerAmountUpdate({ userId: userId, amount: amountNum, coinType: 'CHIPS' });
            }
            current -= amountNum;
            userData[field] = current;
            await models.userModel.findByIdAndUpdate(userId, { [field]: current });
            try { await houseHelper.creditHouse(amountNum); } catch (err) { console.error('MinesController house credit error', err.message); }
            return { status: true, data: { chips: current } };
        }
        else if (amountNum < 0) {
            const credit = Math.abs(amountNum);
            current += credit;
            userData[field] = current;
            await models.userModel.findByIdAndUpdate(userId, { [field]: current });
            try { await houseHelper.debitHouse(credit); } catch (err) { console.error('MinesController house debit error', err.message); }
            return { status: true, data: { chips: current } };
        }
        else {
            return { status: true, data: { chips: current } };
        }
    }
    catch (err) {
        console.error({ title: 'MinesController => updateMyBalance', message: err.message });
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
        console.error({ title: 'MinesController => getSeedData', message: err.message });
        return { status: false, message: err.message };
    }
}

exports.saveMinesRound = async (roundData) => {
    try {
        const result = await models.minesRoundModel({
            roundNumber: roundData.roundNumber,
            roundResult: roundData.roundResult,
            roundDate: roundData.roundDate,
            minesCount: roundData.minesCount,
            userId: mongoose.Types.ObjectId(roundData.userId),
            betAmount: roundData.betAmount,
            coinType: roundData.coinType,
            payout: roundData.currentPayout,
            clientSeed: roundData.clientSeed,
            serverSeed: roundData.serverSeed,
            resultBoard: roundData.resultBoard.toString(),
            selectBoard: roundData.selectBoard.toString()
        }).save();
        return { status: true, data: result };
    }
    catch (err) {
        console.error({ title: 'MinesController => saveMinesRound', message: err.message });
        return { status: false, message: err.message };
    }
}