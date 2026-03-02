const mongoose = require('mongoose');
const config = require('../config');
const models = require('../models/index');
const walletController = require('../controllers/walletController');

async function run() {
  await mongoose.connect(config.DB, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('connected');
  const user = await models.userModel.findOne({ email: 'smoke@demo.test' });
  if (!user) return console.log('no user');
  console.log('user', user._id.toString(), 'demoMode currently', user.demoMode, 'demoChips', user.demoChipsBalance);

  // toggle off
  let req = { body: { userId: user._id.toString(), demoMode: false } };
  let res = { json: (p) => { console.log('toggle off response', p); return p; } };
  await walletController.toggleDemoMode(req, res);

  // fetch demo balance
  req = { body: { userId: user._id.toString() } };
  res = { json: (p) => { console.log('getDemoBalance:', p); return p; } };
  await walletController.getDemoBalance(req, res);

  // toggle on
  req = { body: { userId: user._id.toString(), demoMode: true } };
  res = { json: (p) => { console.log('toggle on response', p); return p; } };
  await walletController.toggleDemoMode(req, res);

  // fetch demo balance
  req = { body: { userId: user._id.toString() } };
  res = { json: (p) => { console.log('getDemoBalance after on:', p); return p; } };
  await walletController.getDemoBalance(req, res);

  mongoose.disconnect();
}
run().catch(e=>{console.error(e); process.exit(1)})