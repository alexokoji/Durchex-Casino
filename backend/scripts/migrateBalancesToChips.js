// Script to migrate legacy balance arrays to new numeric chips fields
// Run with: node migrateBalancesToChips.js

const mongoose = require('mongoose');
const config = require('../config');
const models = require('../models');

async function migrate() {
    try {
        // use project's DB config (config.DB)
        const mongoUri = config.DB || process.env.MONGODB_URL;
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');

        const users = await models.userModel.find({});
        console.log(`Found ${users.length} users`);

        for (const u of users) {
            let changed = false;

            // helper to extract chips from a legacy balance object
            function extractChips(obj) {
                if (!obj || !obj.data || !Array.isArray(obj.data)) return 0;
                // look for CHIPS entry or take first currency if none
                const entry = obj.data.find(e => e.coinType === 'CHIPS' || e.currency === 'CHIPS');
                if (entry && typeof entry.balance === 'number') return entry.balance;
                if (obj.data.length > 0 && typeof obj.data[0].balance === 'number') return obj.data[0].balance;
                return 0;
            }

            const legacyBal = extractChips(u.balance);
            const legacyDemo = extractChips(u.demoBalance);

            if (typeof u.chipsBalance !== 'number' || u.chipsBalance === 0) {
                if (legacyBal > 0) {
                    u.chipsBalance = legacyBal;
                    changed = true;
                }
            }
            if (typeof u.demoChipsBalance !== 'number' || u.demoChipsBalance === 0) {
                if (legacyDemo > 0) {
                    u.demoChipsBalance = legacyDemo;
                    changed = true;
                }
            }

            if (changed) {
                await u.save();
                console.log(`Updated user ${u._id} to chips=${u.chipsBalance} demo=${u.demoChipsBalance}`);
            }
        }

        console.log('Migration complete');
        process.exit(0);
    } catch (err) {
        console.error('Migration error', err);
        process.exit(1);
    }
}

migrate();