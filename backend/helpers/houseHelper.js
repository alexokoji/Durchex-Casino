const models = require('../models/index');

// Admin transaction logging for audit trail
const AdminTransaction = require('../models/AdminTransactionModel');

async function getAdminUser() {
    // Try to find any admin user document
    let admin = await models.adminUserModel.findOne();
    if (!admin) {
        // If none found, log and return null — calling code should handle
        console.warn('houseHelper: No admin user found to record house balance');
        return null;
    }
    return admin;
}

async function creditHouse(amount) {
    try {
        amount = Number(amount) || 0;
        if (amount <= 0) return null;
        const admin = await getAdminUser();
        if (!admin) return null;
        admin.balance = Number(admin.balance || 0) + amount;
        await admin.save();

        // record transaction
        try {
            const tx = await new AdminTransaction({
                adminId: admin._id,
                type: 'credit',
                amount,
                balanceAfter: admin.balance,
                createdAt: new Date()
            }).save();
            return { admin, tx };
        }
        catch (err) {
            console.error('houseHelper.creditHouse tx error:', err.message);
            return { admin };
        }
    }
    catch (err) {
        console.error('houseHelper.creditHouse error:', err.message);
        return null;
    }
}

async function debitHouse(amount) {
    try {
        amount = Number(amount) || 0;
        if (amount <= 0) return null;
        const admin = await getAdminUser();
        if (!admin) return null;
        admin.balance = Number(admin.balance || 0) - amount;
        await admin.save();

        // record transaction
        try {
            const tx = await new AdminTransaction({
                adminId: admin._id,
                type: 'debit',
                amount,
                balanceAfter: admin.balance,
                createdAt: new Date()
            }).save();
            return { admin, tx };
        }
        catch (err) {
            console.error('houseHelper.debitHouse tx error:', err.message);
            return { admin };
        }
    }
    catch (err) {
        console.error('houseHelper.debitHouse error:', err.message);
        return null;
    }
}

module.exports = {
    creditHouse,
    debitHouse
};
