const models = require('../models');
const tatumController = require('./tatumController');

// Fee structure for different coins
const FEE_STRUCTURE = {
    BTC: { networkFee: 0.00005, platformFee: 0.001 }, // 0.001 BTC = 1% platform fee min
    ETH: { networkFee: 0.001, platformFee: 0.1 }, // 0.1 ETH gas + platform
    BNB: { networkFee: 0.005, platformFee: 0.05 },
    TRX: { networkFee: 1, platformFee: 1 },
    USDT: { networkFee: 1, platformFee: 1 }, // 1 USDT for all stablecoins
    USDC: { networkFee: 1, platformFee: 1 },
    ZELO: { networkFee: 0, platformFee: 0 } // No fees for platform token
};

// Demo mode functions
exports.getDemoBalance = async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.json({ status: false, message: 'Invalid Request' });
        }

        const user = await models.userModel.findById(userId);
        if (!user) {
            return res.json({ status: false, message: 'User not found' });
        }

        // Initialize demo balance if not exists
        if (!user.demoBalance || !user.demoBalance.data) {
            const demoBal = {
                data: [
                    { coinType: 'BTC', balance: 1000, chain: 'BTC', type: 'native' },
                    { coinType: 'ETH', balance: 1000, chain: 'ETH', type: 'native' },
                    { coinType: 'BNB', balance: 1000, chain: 'BNB', type: 'native' },
                    { coinType: 'TRX', balance: 1000, chain: 'TRON', type: 'native' },
                    { coinType: 'USDT', balance: 1000, chain: 'ETH', type: 'erc-20' },
                    { coinType: 'USDT', balance: 1000, chain: 'BNB', type: 'bep-20' },
                    { coinType: 'USDT', balance: 1000, chain: 'TRON', type: 'trc-20' },
                    { coinType: 'USDC', balance: 1000, chain: 'ETH', type: 'erc-20' },
                    { coinType: 'USDC', balance: 1000, chain: 'BNB', type: 'bep-20' },
                    { coinType: 'USDC', balance: 1000, chain: 'TRON', type: 'trc-20' },
                    { coinType: 'ZELO', balance: 1000, chain: '', type: '' }
                ]
            };
            user.demoBalance = demoBal;
            await user.save();
        }

        res.json({ status: true, data: user.demoBalance, demoMode: user.demoMode });
    } catch (err) {
        console.error('getDemoBalance error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

// Toggle between demo and real mode
exports.toggleDemoMode = async (req, res) => {
    try {
        const { userId, demoMode } = req.body;
        
        if (!userId) {
            return res.json({ status: false, message: 'Invalid Request' });
        }

        const user = await models.userModel.findByIdAndUpdate(
            userId,
            { demoMode: demoMode },
            { new: true }
        );

        if (!user) {
            return res.json({ status: false, message: 'User not found' });
        }

        const balanceData = demoMode ? user.demoBalance : user.balance;
        res.json({ 
            status: true, 
            message: `Switched to ${demoMode ? 'demo' : 'real'} mode`,
            demoMode: user.demoMode,
            balance: balanceData
        });
    } catch (err) {
        console.error('toggleDemoMode error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

// Enhanced withdrawal with fee calculation and tracking
exports.processWithdrawal = async (req, res) => {
    try {
        const { userId, coinType, chain, amount, address, tokenType = 'native' } = req.body;

        if (!userId || !coinType || !amount || !address) {
            return res.json({ status: false, message: 'Missing required fields' });
        }

        const user = await models.userModel.findById(userId);
        if (!user) {
            return res.json({ status: false, message: 'User not found' });
        }

        // Get fee structure
        const fees = FEE_STRUCTURE[coinType] || { networkFee: 0.001, platformFee: 0.1 };
        const totalFee = fees.networkFee + (amount * 0.01); // 1% of amount or min platform fee
        const finalAmount = amount - totalFee;

        // Get current balance
        const balanceData = user.demoMode ? user.demoBalance : user.balance;
        const currencyBalance = balanceData.data.find(b => 
            b.coinType === coinType && b.type === tokenType
        );

        if (!currencyBalance || currencyBalance.balance < amount) {
            return res.json({ status: false, message: 'Insufficient balance' });
        }

        // Create withdrawal record
        const withdrawal = await new models.withdrawalModel({
            userId,
            coinType,
            chain: chain || coinType,
            tokenType,
            amount,
            networkFee: fees.networkFee,
            platformFee: totalFee - fees.networkFee,
            totalFee,
            finalAmount,
            toAddress: address,
            fromAddress: user.address?.[coinType] || 'unknown',
            status: user.demoMode ? 'confirmed' : 'pending',
            isDemo: user.demoMode,
            estimatedArrival: new Date(Date.now() + (user.demoMode ? 0 : 3600000))
        }).save();

        // Update user balance
        currencyBalance.balance -= amount;
        if (user.demoMode) {
            user.demoBalance = balanceData;
        } else {
            user.balance = balanceData;
        }
        await user.save();

        // If demo mode, instantly confirm
        if (user.demoMode) {
            withdrawal.status = 'confirmed';
            withdrawal.transactionHash = `DEMO-${withdrawal._id}`;
            withdrawal.completedAt = new Date();
            await withdrawal.save();
            
            return res.json({
                status: true,
                message: '✅ Demo withdrawal successful!',
                withdrawal,
                newBalance: currencyBalance.balance
            });
        }

        // For real mode, initiate actual withdrawal
        // This would call the existing withdrawal methods
        res.json({
            status: true,
            message: 'Withdrawal initiated',
            withdrawal,
            newBalance: currencyBalance.balance,
            feeBreakdown: {
                networkFee: fees.networkFee,
                platformFee: totalFee - fees.networkFee,
                totalFee,
                finalAmount
            }
        });

    } catch (err) {
        console.error('processWithdrawal error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

// Get withdrawal history
exports.getWithdrawalHistory = async (req, res) => {
    try {
        const { userId, limit = 50, skip = 0 } = req.body;

        if (!userId) {
            return res.json({ status: false, message: 'Invalid Request' });
        }

        const withdrawals = await models.withdrawalModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const total = await models.withdrawalModel.countDocuments({ userId });

        res.json({
            status: true,
            data: withdrawals,
            pagination: { total, limit, skip }
        });

    } catch (err) {
        console.error('getWithdrawalHistory error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

// Get withdrawal details
exports.getWithdrawalStatus = async (req, res) => {
    try {
        const { withdrawalId } = req.body;

        if (!withdrawalId) {
            return res.json({ status: false, message: 'Invalid Request' });
        }

        const withdrawal = await models.withdrawalModel.findById(withdrawalId);
        if (!withdrawal) {
            return res.json({ status: false, message: 'Withdrawal not found' });
        }

        res.json({
            status: true,
            data: withdrawal
        });

    } catch (err) {
        console.error('getWithdrawalStatus error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

// Enhanced deposit with tracking
exports.getOrCreateDepositAddress = async (req, res) => {
    try {
        const { userId, coinType, chain, tokenType = 'native' } = req.body;

        if (!userId || !coinType) {
            return res.json({ status: false, message: 'Invalid Request' });
        }

        // Check if deposit address already exists
        let depositRecord = await models.depositModel.findOne({
            userId,
            coinType,
            chain: chain || coinType,
            status: 'pending'
        });

        if (depositRecord && !depositRecord.isExpired) {
            return res.json({ 
                status: true, 
                data: {
                    depositAddress: depositRecord.depositAddress,
                    coinType: depositRecord.coinType,
                    chain: depositRecord.chain,
                    status: depositRecord.status,
                    createdAt: depositRecord.createdAt
                }
            });
        }

        // Create new deposit address
        const address = `DEMO-${coinType}-${userId}-${Date.now()}`; // Simplified for demo
        
        depositRecord = await new models.depositModel({
            userId,
            coinType,
            chain: chain || coinType,
            tokenType,
            depositAddress: address,
            status: 'pending',
            requiredConfirmations: 1
        }).save();

        res.json({
            status: true,
            data: {
                depositAddress: depositRecord.depositAddress,
                coinType: depositRecord.coinType,
                chain: depositRecord.chain,
                status: depositRecord.status,
                createdAt: depositRecord.createdAt,
                expiresAt: depositRecord.expiresAt
            }
        });

    } catch (err) {
        console.error('getOrCreateDepositAddress error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

// Simulate deposit received (for testing)
exports.simulateDepositReceived = async (req, res) => {
    try {
        const { userId, coinType, chain, amount } = req.body;

        if (!userId || !coinType || !amount) {
            return res.json({ status: false, message: 'Invalid Request' });
        }

        const user = await models.userModel.findById(userId);
        if (!user) {
            return res.json({ status: false, message: 'User not found' });
        }
        // Debug logs for troubleshooting
        console.log('simulateDepositReceived called', { userId, coinType, chain, amount, demoMode: user.demoMode });

        // Pick correct balance container (demo or real)
        const balanceData = user.demoMode ? (user.demoBalance || { data: [] }) : (user.balance || { data: [] });
        console.log('beforeBalanceData', JSON.stringify(balanceData));

        let currency = balanceData.data.find(b => b.coinType === coinType && (chain ? b.chain === chain : true));

        if (currency) {
            currency.balance = Number(currency.balance || 0) + Number(amount);
        } else {
            const newEntry = { coinType, balance: Number(amount), chain: chain || '', type: 'native' };
            balanceData.data.push(newEntry);
            currency = newEntry;
        }

        if (user.demoMode) {
            user.demoBalance = balanceData;
            user.markModified('demoBalance');
        } else {
            user.balance = balanceData;
            user.markModified('balance');
        }

        await user.save();
        console.log('afterBalanceData', JSON.stringify(user.demoMode ? user.demoBalance : user.balance));

        // Mark deposit records as confirmed
        await models.depositModel.updateMany(
            { userId, coinType, status: 'pending' },
            { status: 'confirmed', confirmedAt: new Date(), amount }
        );

        return res.json({
            status: true,
            message: `✅ ${amount} ${coinType} deposited successfully!`,
            newBalance: balanceData,
            demoMode: user.demoMode
        });

    } catch (err) {
        console.error('simulateDepositReceived error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

// Get deposit history
exports.getDepositHistory = async (req, res) => {
    try {
        const { userId, limit = 50, skip = 0 } = req.body;

        if (!userId) {
            return res.json({ status: false, message: 'Invalid Request' });
        }

        const deposits = await models.depositModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const total = await models.depositModel.countDocuments({ userId });

        res.json({
            status: true,
            data: deposits,
            pagination: { total, limit, skip }
        });

    } catch (err) {
        console.error('getDepositHistory error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

module.exports = exports;
