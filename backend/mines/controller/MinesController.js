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

        // Use demoBalance if in demo mode, otherwise use regular balance
        const balanceData = userData.demoMode ? (userData.demoBalance || { data: [] }) : userData.balance;
        if (!balanceData.data || balanceData.data.length === 0) {
            return { status: false, message: 'No balance available' };
        }

        // unified chips behaviour: look for CHIPS entry or convert first one
        let currencyIndex = balanceData.data.findIndex(b => b.coinType === 'CHIPS' || b.currency === 'CHIPS');
        if (currencyIndex === -1) {
            currencyIndex = 0;
            balanceData.data[currencyIndex].coinType = 'CHIPS';
            balanceData.data[currencyIndex].currency = 'CHIPS';
        }
        const amountNum = Number(betAmount) || 0;
        // Deducting bet (positive) or crediting (negative)
        if (amountNum > 0) {
            if (balanceData.data[currencyIndex].balance < amountNum) {
                return { status: false, message: 'Not enough balance' };
            }
            if (balanceData.data[currencyIndex].balance >= amountNum) {
                if (betAmount >= 0 || type === 'finish')
                    requestWargerAmountUpdate({ userId: userId, amount: data.betAmount, coinType: { coinType: 'CHIPS' } });
                balanceData.data[currencyIndex].balance = balanceData.data[currencyIndex].balance - amountNum;
                if (userData.demoMode) {
                    await models.userModel.findOneAndUpdate({ _id: userId }, { demoBalance: balanceData });
                } else {
                    await models.userModel.findOneAndUpdate({ _id: userId }, { balance: balanceData });
                }
                // Credit house with lost bet
                try { await houseHelper.creditHouse(amountNum); } catch (err) { console.error('MinesController house credit error', err.message); }
                return { status: true, data: balanceData };
            }
            else
                return { status: false, message: 'Not enough balance' };
        }
        else if (amountNum < 0) {
            // Negative amount => credit user (win/refund)
            const credit = Math.abs(amountNum);
            balanceData.data[currencyIndex].balance = balanceData.data[currencyIndex].balance + credit;
            if (userData.demoMode) {
                await models.userModel.findOneAndUpdate({ _id: userId }, { demoBalance: balanceData });
            } else {
                await models.userModel.findOneAndUpdate({ _id: userId }, { balance: balanceData });
            }
            // Debit house for payout
            try { await houseHelper.debitHouse(credit); } catch (err) { console.error('MinesController house debit error', err.message); }
            return { status: true, data: balanceData };
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