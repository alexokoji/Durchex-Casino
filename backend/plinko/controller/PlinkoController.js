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

        // Use demoBalance if in demo mode, otherwise use regular balance
        const balanceData = userData.demoMode ? (userData.demoBalance || { data: [] }) : userData.balance;
        if (!balanceData.data || balanceData.data.length === 0) {
            return { status: false, message: 'No balance available' };
        }
        // unified chips lookup
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
            SocketManager.requestWargerAmountUpdate({ userId: userId, amount: betAmount, coinType: { coinType: 'CHIPS' } });
            const roundData = await new models.plinkoRoundModel({
                roundNumber: roundNumber,
                userId: userId,
                betAmount: betAmount,
                coinType: 'CHIPS',
                payout: payout,
                rows: rowCount,
                risk: risk,
                serverSeed: serverSeed,
                clientSeed: clientSeed,
                roundDate: new Date()
            }).save();
            const winAmount = Number(betAmount) * (Number(payout) - 1);
            if (winAmount > 0) {
                balanceData.data[currencyIndex].balance = balanceData.data[currencyIndex].balance + winAmount;
                if (userData.demoMode) {
                    await models.userModel.findOneAndUpdate({ _id: data.userId }, { demoBalance: balanceData });
                } else {
                    await models.userModel.findOneAndUpdate({ _id: data.userId }, { balance: balanceData });
                }
                // Debit house for the payout
                try { await houseHelper.debitHouse(winAmount); } catch (err) { console.error('PlinkoController house debit error', err.message); }
            }
            return { status: true, data: userData, roundData: roundData };
        }
    }
    catch (err) {
        console.error({ title: 'PlinkoController => savePlinkoRound', message: err.message });
        return { status: false, message: err.message };
    }
}