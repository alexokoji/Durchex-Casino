#!/usr/bin/env node
require('dotenv').config({ path: __dirname + '/../.env' });
const config = require('../config');
const models = require('../models');

async function main() {
  try {
    await models.mongoose.connect(config.DB, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const timestamp = Date.now();
    const email = `test_user_${timestamp}@example.com`;
    const nick = `testuser_${timestamp}`;

    const user = new models.userModel({
      userName: nick,
      userEmail: email,
      userPassword: '',
      userToken: '',
      loginType: 'Email',
      userNickName: nick,
      type: 'user',
      address: {},
      profileSet: false
    });

    const saved = await user.save();
    console.log('Created test user with id:', saved._id.toString());
    console.log('Use this id for non-demo generate-address requests');

    await models.mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Failed to create test user:', err.message);
    process.exit(1);
  }
}

main();
