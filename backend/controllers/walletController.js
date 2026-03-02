const models = require('../models');
const tatumController = require('./tatumController');
const chipsConverter = require('../services/chipsConverter');

// fee structure is still kept in case we convert back to fiat for withdrawals
// but chips-based operations don't consult it directly
const FEE_STRUCTURE = {
    USDT: { networkFee: 1, platformFee: 1 },
    ZELO: { networkFee: 0, platformFee: 0 }
};

// temporary helper used until we remove legacy arrays
function filterBalance(bal) {
    if (!bal || !bal.data || !Array.isArray(bal.data)) return bal;
    return { data: bal.data.filter(item => ['USDT','ZELO','CHIPS'].includes(item.coinType)) };
}


// Demo mode functions
// return numeric demo chips balance (for compatibility with existing client)
exports.getDemoBalance = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.json({ status: false, message: 'Invalid Request' });

        const user = await models.userModel.findById(userId);
        if (!user) return res.json({ status: false, message: 'User not found' });

        // ensure numeric field exists (migration may populate later)
        if (typeof user.demoChipsBalance !== 'number') {
            user.demoChipsBalance = 0;
            await user.save();
        }

        res.json({ status: true, data: { chips: user.demoChipsBalance }, demoMode: user.demoMode });
    } catch (err) {
        console.error('getDemoBalance error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

// Toggle between demo and real mode
exports.toggleDemoMode = async (req, res) => {
    try {
        const { userId, demoMode } = req.body;
        if (!userId) return res.json({ status: false, message: 'Invalid Request' });

        const user = await models.userModel.findByIdAndUpdate(
            userId,
            { demoMode: demoMode },
            { new: true }
        );
        if (!user) return res.json({ status: false, message: 'User not found' });

        const chips = demoMode ? user.demoChipsBalance : user.chipsBalance;
        res.json({ status: true, message: `Switched to ${demoMode ? 'demo' : 'real'} mode`, demoMode: user.demoMode, chips });
    } catch (err) {
        console.error('toggleDemoMode error:', err.message);
        return res.json({ status: false, message: 'Server Error' });
    }
};

// Enhanced withdrawal with fee calculation and tracking
exports.processWithdrawal = async (req, res) => {
    try {
        const { userId, coinType, chain, amount, address, tokenType = 'native' } = req.body;

        if (!userId || !amount || !address) {
            return res.json({ status: false, message: 'Missing required fields' });
        }

        const user = await models.userModel.findById(userId);
        if (!user) return res.json({ status: false, message: 'User not found' });

        // convert withdrawal amount (which may be provided in any currency) into chips
        const chipsToDeduct = chipsConverter.toChips(amount, coinType);
        const current = user.demoMode ? user.demoChipsBalance : user.chipsBalance;
        if (current < chipsToDeduct) return res.json({ status: false, message: 'Insufficient balance' });

        // create record (store chips amount)
        const withdrawal = await new models.withdrawalModel({
            userId,
            amount: chipsToDeduct,
            coinType: 'CHIPS',
            chain: '',
            tokenType: 'native',
            networkFee: 0,
            platformFee: 0,
            totalFee: 0,
            finalAmount: chipsToDeduct,
            toAddress: address,
            fromAddress: user.address?.['CHIPS'] || 'internal',
            status: user.demoMode ? 'confirmed' : 'pending',
            isDemo: user.demoMode,
            estimatedArrival: new Date(Date.now() + (user.demoMode ? 0 : 3600000))
        }).save();

        // deduct chips
        if (user.demoMode) {
            user.demoChipsBalance -= chipsToDeduct;
        } else {
            user.chipsBalance -= chipsToDeduct;
        }
        await user.save();

        if (user.demoMode) {
            withdrawal.status = 'confirmed';
            withdrawal.transactionHash = `DEMO-${withdrawal._id}`;
            withdrawal.completedAt = new Date();
            await withdrawal.save();
            return res.json({ status: true, message: '✅ Demo withdrawal successful!', withdrawal, newBalance: user.demoChipsBalance });
        }

        res.json({ status: true, message: 'Withdrawal initiated', withdrawal, newBalance: user.chipsBalance });

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

        if (!userId || !amount) {
            return res.json({ status: false, message: 'Invalid Request' });
        }

        const user = await models.userModel.findById(userId);
        if (!user) {
            return res.json({ status: false, message: 'User not found' });
        }

        console.log('simulateDepositReceived called', { userId, coinType, chain, amount, demoMode: user.demoMode });

        // convert to chips and credit appropriate balance
        const chips = chipsConverter.toChips(amount, coinType);
        if (user.demoMode) {
            user.demoChipsBalance = (user.demoChipsBalance || 0) + chips;
        } else {
            user.chipsBalance = (user.chipsBalance || 0) + chips;
        }
        await user.save();

        // mark any pending deposits as confirmed (legacy behaviour)
        await models.depositModel.updateMany(
            { userId, coinType, status: 'pending' },
            { status: 'confirmed', confirmedAt: new Date(), amount }
        );

        return res.json({
            status: true,
            message: `✅ ${amount} ${coinType} converted to ${chips} chips!`,
            newBalance: { chips: user.demoMode ? user.demoChipsBalance : user.chipsBalance },
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
