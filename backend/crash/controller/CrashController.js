const models = require('../../models/index');
const SocketManager = require('../manager/SocketManager');
const { generateSeed } = require('../../helper/mainHelper');
const mongoose = require('mongoose');
const { ROUND_STATUS } = require('../constant');
const houseHelper = require('../../helpers/houseHelper');

exports.createCrashRound = async (data) => {
    try {
        const { roundNumber, roundDate, serverSeed, roundStatus } = data;
        const exist = await models.crashRoundModel.findOne({ roundNumber });
        if (exist)
            return { status: false, message: 'Already exist' };

        const response = await new models.crashRoundModel({ roundNumber, roundDate, serverSeed, roundStatus }).save();
        return { status: true, data: response };
    }
    catch (err) {
        console.error({ title: 'CrashController - createCrashRound', message: err.message });
        return { status: false, message: 'Server Error' };
    }
}

exports.updateCrashRound = async (data) => {
    try {
        const { roundNumber, fairResult, roundStatus } = data;
        const exist = await models.crashRoundModel.findOne({ roundNumber });
        if (!exist)
            return { status: false, message: 'Not exist' };

        await models.crashRoundModel.findOneAndUpdate({ roundNumber }, { fairResult, roundStatus });
        return { status: true };
    }
    catch (err) {
        console.error({ title: 'CrashController - updateCrashRound', message: err.message });
        return { status: false, message: 'Server Error' };
    }
}

exports.updatePlayerBalance = async (data, warger = false) => {
    try {
        const { userId, amount } = data;
        if (!userId)
            return { status: false, message: 'Invalid Request' };

        let userData = await models.userModel.findOne({ _id: userId });
        if (!userData)
            return { status: false, message: 'User not found' };

        // Use demoBalance if in demo mode, otherwise use regular balance
        const balanceData = userData.demoMode ? (userData.demoBalance || { data: [] }) : userData.balance;
        const amountNum = Number(amount) || 0;

        // For unified chips system: locate the CHIPS entry
        if (!balanceData.data || balanceData.data.length === 0) {
            return { status: false, message: 'No balance available' };
        }

        // try to find a chips/currency entry; fall back to first slot for backwards compatibility
        let currencyIndex = balanceData.data.findIndex(b => b.coinType === 'CHIPS' || b.currency === 'CHIPS');
        if (currencyIndex === -1) {
            currencyIndex = 0; // use first entry and convert it to CHIPS
            balanceData.data[currencyIndex].coinType = 'CHIPS';
            balanceData.data[currencyIndex].currency = 'CHIPS';
        }
        const entry = balanceData.data[currencyIndex];

        // If positive amount => deduct from user (placing bet)
        if (amountNum > 0) {
            if (entry.balance < amountNum)
                return { status: false, message: 'Not enough balance' };

            if (warger) {
                const coinInfo = balanceData.data[currencyIndex];
                SocketManager.requestWargerAmountUpdate({ userId: userId, amount: amountNum, coinType: coinInfo });
            }

            balanceData.data[currencyIndex].balance = balanceData.data[currencyIndex].balance - amountNum;
            if (userData.demoMode) {
                await models.userModel.findOneAndUpdate({ _id: userId }, { demoBalance: balanceData });
                userData.demoBalance = balanceData;
            } else {
                await models.userModel.findOneAndUpdate({ _id: userId }, { balance: balanceData });
                userData.balance = balanceData;
            }
            SocketManager.requestBalanceUpdate(userData);

            // Credit house with the lost bet
            try { await houseHelper.creditHouse(amountNum); } catch (err) { console.error('CrashController house credit error', err.message); }
        }
        else if (amountNum < 0) {
            // Negative amount => credit user (refund or payout)
            const credit = Math.abs(amountNum);
            balanceData.data[currencyIndex].balance = balanceData.data[currencyIndex].balance + credit;
            if (userData.demoMode) {
                await models.userModel.findOneAndUpdate({ _id: userId }, { demoBalance: balanceData });
                userData.demoBalance = balanceData;
            } else {
                await models.userModel.findOneAndUpdate({ _id: userId }, { balance: balanceData });
                userData.balance = balanceData;
            }
            SocketManager.requestBalanceUpdate(userData);

            // Debit house for the payout/refund
            try { await houseHelper.debitHouse(credit); } catch (err) { console.error('CrashController house debit error', err.message); }
        }

        let clientSeedData = await models.seedModel.findOne({ userId: userId, type: 'client' }).sort({ date: -1 });
        if (!clientSeedData)
            clientSeedData = await new models.seedModel({ userId: mongoose.Types.ObjectId(userId), type: 'client', seed: generateSeed(), date: new Date() }).save();

        return { status: true, data: { userNickName: userData.userNickName, seed: clientSeedData.seed } };
    }
    catch (err) {
        console.error({ title: 'CrashController - updatePlayerBalance', message: err.message });
        return { status: false, message: 'Server Error' };
    }
}

exports.createCrashBetHistory = async (data) => {
    try {
        const { userId, betAmount, /*coinType,*/ roundId, seed } = data;
        const exist = await models.crashBetHistoryModel.findOne({ crashRoundId: roundId, betUserId: userId });
        if (exist)
            return { status: false, message: 'Already saved' };

        const response = await new models.crashBetHistoryModel({
            crashRoundId: roundId,
            betUserId: userId,
            payout: 0,
            betAmount,
            coinType: 'CHIPS',
            seed
        }).save();
        return { status: true, data: response };
    }
    catch (err) {
        console.error({ title: 'CrashController - insertCrashBetHistory', message: err.message });
        return { status: false, message: 'Server Error' };
    }
}

exports.removeCrashBetHistory = async (data) => {
    try {
        const { userId, roundId } = data;
        const exist = await models.crashBetHistoryModel.findOne({ crashRoundId: roundId, betUserId: userId });
        if (!exist)
            return { status: false, message: 'Not exist' };

        await models.crashBetHistoryModel.findOneAndDelete({ crashRoundId: roundId, betUserId: userId });
        return { status: true };
    }
    catch (err) {
        console.error({ title: 'CrashController - removeCrashBetHistory', message: err.message });
        return { status: false, message: 'Server Error' };
    }
}

exports.updateCrashBetHistory = async (data) => {
    try {
        const { userId, roundId, payout } = data;
        const exist = await models.crashBetHistoryModel.findOne({ crashRoundId: roundId, betUserId: userId });
        if (!exist)
            return { status: false, message: 'Not exist' };

        await models.crashBetHistoryModel.findOneAndUpdate({ crashRoundId: roundId, betUserId: userId }, { payout });
        return { status: true };
    }
    catch (err) {
        console.error({ title: 'CrashController - updateCrashBetHistory', message: err.message });
        return { status: false, message: 'Server Error' };
    }
}

exports.getCrashRoundHistory = async () => {
    try {
        const history = await models.crashRoundModel.find({ roundStatus: ROUND_STATUS.FINISHED }).sort({ roundDate: -1 }).limit(5);
        return { status: true, data: history };
    }
    catch (err) {
        console.error({ title: 'CrashController - getCrashRoundHistory', message: err.message });
        return { status: false, message: 'Server Error' };
    }
}