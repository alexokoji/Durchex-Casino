const mongoose = require('mongoose');
const config = require('../config');
const models = require('../models/index');
const diceController = require('../dice/controller/DiceController');

async function run() {
  await mongoose.connect(config.DB, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('connected');
  const user = await models.userModel.findOne({ email: 'smoke@demo.test' });
  console.log('user', user && user._id);
  const resp = await diceController.saveDiceRound({
    roundNumber: 9999,
    userId: user._id.toString(),
    betAmount: 5,
    coinType: 'CHIPS',
    difficulty: 1,
    isOver: true,
    payout: 1.5,
    fairData: {},
    roundResult: 'win',
    serverSeed: 'seed',
    clientSeed: 'seed'
  });
  console.log('resp', resp);
  mongoose.disconnect();
}
run().catch(e=>{console.error(e); process.exit(1)})
