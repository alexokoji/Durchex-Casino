const mongoose = require('mongoose');
const { generateSeed } = require('../../helper/mainHelper');
const models = require('../../models/index');
const { payout } = require('../constant');
const { requestBalanceUpdate, requestWargerAmountUpdate } = require('../socket/Manager');
const houseHelper = require('../../helpers/houseHelper');

exports.saveScissorsRound = async (data) => {
    try {
        const userData = await models.userModel.findOne({ _id: data.userId });
        // Use demoBalance if in demo mode, otherwise use regular balance
        const balanceData = userData.demoMode ? (userData.demoBalance || { data: [] }) : userData.balance;
        if (!balanceData.data || balanceData.data.length === 0) {
            return { status: false, message: 'No balance available' };
        }

        // unified chips lookup/convert
        let currencyIndex = balanceData.data.findIndex(b => b.coinType === 'CHIPS' || b.currency === 'CHIPS');
        if (currencyIndex === -1) {
            currencyIndex = 0;
            balanceData.data[currencyIndex].coinType = 'CHIPS';
            balanceData.data[currencyIndex].currency = 'CHIPS';
        }

        if (balanceData.data[currencyIndex].balance < Number(data.betAmount)) {
            return { status: false, message: 'Not enough balance' };
        }
        else {
            requestWargerAmountUpdate({ userId: data.userId, amount: data.betAmount, coinType: { coinType: 'CHIPS' } });
            const roundData = await new models.scissorsRoundModel({
                roundNumber: data.roundNumber,
                userId: data.userId,
                betAmount: data.betAmount,
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
                const winAmount = Number(data.betAmount) * (Number(payout) - 1);
                balanceData.data[currencyIndex].balance = balanceData.data[currencyIndex].balance + winAmount;
                if (userData.demoMode) {
                    await models.userModel.findOneAndUpdate({ _id: data.userId }, { 'demoBalance': balanceData });
                } else {
                    await models.userModel.findOneAndUpdate({ _id: data.userId }, { 'balance': balanceData });
                }
                // House pays the winning amount
                try { await houseHelper.debitHouse(winAmount); } catch (err) { console.error('scissorsController house debit error', err.message); }
            }
            else if (data.result === 'lost') {
                const lostAmount = Number(data.betAmount);
                balanceData.data[currencyIndex].balance = balanceData.data[currencyIndex].balance - lostAmount;
                if (userData.demoMode) {
                    await models.userModel.findOneAndUpdate({ _id: data.userId }, { 'demoBalance': balanceData });
                } else {
                    await models.userModel.findOneAndUpdate({ _id: data.userId }, { 'balance': balanceData });
                }
                // Credit house with the lost bet
                try { await houseHelper.creditHouse(lostAmount); } catch (err) { console.error('scissorsController house credit error', err.message); }
            }
            setTimeout(() => {
                requestBalanceUpdate(userData);
            }, 6000);
            return { status: true, data: userData, roundData: roundData };
        }
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