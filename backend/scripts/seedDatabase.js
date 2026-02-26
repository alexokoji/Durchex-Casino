const mongoose = require('mongoose');
require('dotenv').config({ path: `${__dirname}/../.env` });

// Import models
const UserModel = require('../models/UserModel');
const CryptoPaymentV2Model = require('../models/CryptoPaymentV2Model');
const FlutterwaveTransactionModel = require('../models/FlutterwaveTransactionModel');

const MONGO_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/durchex-casino';

console.log('🌱 Starting database seeding...');
console.log('📍 Connecting to MongoDB...');

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected Successfully!');
    return true;
  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed:');
    console.error(`   Error: ${error.message}\n`);
    return false;
  }
};

const seedDatabase = async () => {
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  try {
    console.log('\n🧹 Clearing existing test data...');
    await UserModel.deleteMany({ username: { $in: ['testuser1', 'testuser2'] } });
    console.log('✅ Cleared users');

    console.log('\n👥 Creating test users...');

    // Test User 1
    const user1 = new UserModel({
      username: 'testuser1',
      userNickName: 'TestUser1',
      email: 'testuser1@durchex.com',
      password: 'testpass123',
      walletAddress: '0x1234567890123456789012345678901234567890',
      isVerified: true,
      status: 'active',
      demoMode: true,
      demoBalance: {
        data: [
          { currency: 'USD', balance: 1000 },
          { currency: 'BTC', balance: 0.05 },
          { currency: 'ETH', balance: 1.5 },
          { currency: 'USDT', balance: 5000 },
        ],
      },
    });
    await user1.save();
    console.log(`   ✅ Created user: testuser1 (ID: ${user1._id})`);

    // Test User 2
    const user2 = new UserModel({
      username: 'testuser2',
      userNickName: 'TestUser2',
      email: 'testuser2@durchex.com',
      password: 'testpass456',
      walletAddress: '0x0987654321098765432109876543210987654321',
      isVerified: true,
      status: 'active',
      demoMode: true,
      demoBalance: {
        data: [
          { currency: 'USD', balance: 5000 },
          { currency: 'BTC', balance: 0.2 },
          { currency: 'ETH', balance: 5 },
          { currency: 'USDT', balance: 50000 },
        ],
      },
    });
    await user2.save();
    console.log(`   ✅ Created user: testuser2 (ID: ${user2._id})`);

    console.log('\n💰 Creating test transactions...');

    // Crypto Deposit 1
    const crypto1 = new CryptoPaymentV2Model({
      userId: user1._id,
      coinType: 'BTC',
      chain: 'BTC',
      depositAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      amount: 0.05,
      transactionHash: '1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a',
      confirmations: 6,
      requiredConfirmations: 3,
      status: 'confirmed',
    });
    await crypto1.save();
    console.log(`   ✅ Created crypto deposit: BTC 0.05`);

    // Crypto Deposit 2
    const crypto2 = new CryptoPaymentV2Model({
      userId: user2._id,
      coinType: 'ETH',
      chain: 'ETH',
      depositAddress: '0x742d35Cc6634C0532925a3b844Bc024e7CeD2778',
      amount: 2,
      transactionHash: '2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b',
      confirmations: 12,
      requiredConfirmations: 12,
      status: 'confirmed',
    });
    await crypto2.save();
    console.log(`   ✅ Created crypto deposit: ETH 2.0`);

    // Crypto Deposit 3
    const crypto3 = new CryptoPaymentV2Model({
      userId: user1._id,
      coinType: 'USDT',
      chain: 'ETH',
      depositAddress: '0x3fC91A3aafD04e14B1EBCD80b0C4e99601d67B1F',
      amount: 1000,
      transactionHash: '3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c',
      confirmations: 15,
      requiredConfirmations: 12,
      status: 'confirmed',
    });
    await crypto3.save();
    console.log(`   ✅ Created crypto deposit: USDT 1000`);

    // Flutterwave Deposit 1
    const fw1 = new FlutterwaveTransactionModel({
      userId: user1._id,
      transactionRef: 'fw_ref_1234567890',
      flutterwaveId: 'fw_1234567890',
      amount: 500,
      currency: 'NGN',
      type: 'deposit',
      paymentMethod: 'card',
      status: 'completed',
      customerEmail: 'testuser1@durchex.com',
      confirmedAt: new Date(),
    });
    await fw1.save();
    console.log(`   ✅ Created fiat deposit: NGN 500`);

    // Flutterwave Deposit 2
    const fw2 = new FlutterwaveTransactionModel({
      userId: user2._id,
      transactionRef: 'fw_ref_0987654321',
      flutterwaveId: 'fw_0987654321',
      amount: 100,
      currency: 'USD',
      type: 'deposit',
      paymentMethod: 'bank_transfer',
      status: 'completed',
      customerEmail: 'testuser2@durchex.com',
      confirmedAt: new Date(),
    });
    await fw2.save();
    console.log(`   ✅ Created fiat deposit: USD 100`);

    console.log('\n📊 Seeding complete!\n');
    console.log('📋 Test Users Created:');
    console.log(`   • testuser1 (ID: ${user1._id})`);
    console.log(`   • testuser2 (ID: ${user2._id})\n`);
    console.log('💳 Test Transactions Created:');
    console.log('   • 3 Crypto deposits (BTC, ETH, USDT)');
    console.log('   • 2 Fiat deposits (NGN, USD)\n');
    console.log('✅ Database seeding completed successfully!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding Error:');
    console.error(`   ${error.message}\n`);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
