const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const config = require('../config');
const models = require('../models');

const createUser = async () => {
  try {
    await models.mongoose.connect(config.DB, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const demoBalance = {
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

    const saveData = {
      userName: `testuser_${Date.now()}`,
      userNickName: `TestUser`,
      userEmail: `test+${Date.now()}@example.com`,
      userToken: `TESTTOKEN_${Date.now()}`,
      demoMode: true,
      demoBalance,
      balance: { data: demoBalance.data.map(d => ({ ...d, balance: 0 })) }
    };

    const user = await new models.userModel(saveData).save();
    console.log('Created test user:', user._id.toString());
    console.log('You can use this userId to simulate deposits and test the UI.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating test user:', err);
    process.exit(1);
  }
};

createUser();
