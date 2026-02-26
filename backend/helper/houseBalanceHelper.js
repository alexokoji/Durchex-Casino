const models = require('../models/index');

/**
 * Update house (admin) balance when user loses or wins
 * - On loss: Credit admin balance with bet amount
 * - On win: Debit admin balance with payout amount
 * @param {Object} data - { type: 'loss'|'win', userId, betAmount, payoutAmount, gameType }
 * @returns {Object} - { status, data, message }
 */
exports.updateHouseBalance = async (data) => {
    try {
        const { type, userId, betAmount, payoutAmount, gameType } = data;
        
        if (!type || !userId || !betAmount) {
            return { status: false, message: 'Missing required parameters' };
        }

        let adminUser = await models.adminUserModel.findOne({ type: 'admin' });
        if (!adminUser) {
            console.warn('⚠️ No admin user found, skipping house balance update');
            return { status: false, message: 'Admin user not found' };
        }

        let updateAmount = 0;
        let transactionType = '';

        if (type === 'loss') {
            // User lost: House gains the bet amount
            updateAmount = Number(betAmount);
            transactionType = 'loss_credit';
            adminUser.balance = Number(adminUser.balance) + updateAmount;
        } 
        else if (type === 'win') {
            // User won: House loses the payout amount
            const payout = Number(payoutAmount || (betAmount * 1.5)); // Default 1.5x if not specified
            updateAmount = payout;
            transactionType = 'win_debit';
            adminUser.balance = Number(adminUser.balance) - updateAmount;
            
            // Prevent negative house balance (optional safety check)
            if (adminUser.balance < 0) {
                console.warn(`⚠️ House balance would go negative: ${adminUser.balance}`);
                // You could revert the transaction here if desired
            }
        }

        await adminUser.save();

        // Log transaction for auditing
        console.log(`[HOUSE BALANCE] ${transactionType.toUpperCase()} - Game: ${gameType}, User: ${userId}, Amount: ${updateAmount}, New Balance: ${adminUser.balance}`);

        return { 
            status: true, 
            data: { 
                adminBalance: adminUser.balance, 
                transactionType, 
                amount: updateAmount 
            } 
        };
    } 
    catch (err) {
        console.error({ title: 'houseBalanceHelper => updateHouseBalance', message: err.message });
        return { status: false, message: err.message };
    }
};

/**
 * Get current house balance
 * @returns {Object} - { status, balance, message }
 */
exports.getHouseBalance = async () => {
    try {
        const adminUser = await models.adminUserModel.findOne({ type: 'admin' });
        if (!adminUser) {
            return { status: false, balance: 0, message: 'Admin user not found' };
        }
        return { status: true, balance: adminUser.balance };
    } 
    catch (err) {
        console.error({ title: 'houseBalanceHelper => getHouseBalance', message: err.message });
        return { status: false, balance: 0, message: err.message };
    }
};
