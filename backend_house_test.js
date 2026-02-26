const models = require('./backend/models/index');
(async()=>{
  try{
    // Use MongoDB Atlas connection from backend server setup
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/PlayZelo';
    console.log('Connecting to:', mongoUrl.substring(0,50) + '...');
    await models.mongoose.connect(mongoUrl);
    let admin = await models.adminUserModel.findOne();
    if(!admin){
      admin = await new models.adminUserModel({username:'admin',sitename:'house',password:'admin',authKey:'PlayZelo-Admin',balance:1000,customerId:'admin-cust',website:'localhost',callbackUrl:'http://localhost'}).save();
      console.log('Created admin',admin._id.toString());
    } else console.log('Found admin',admin._id.toString(),'balance',admin.balance);

    let user = await models.userModel.findOne();
    if(!user){
      user = await new models.userModel({userNickName:'testuser',userName:'testuser',balance:{data:[{coinType:'USDT',balance:100,chain:'TRON',type:'trc-20'}]},currency:{coinType:'USDT',type:'trc-20'}}).save();
      console.log('Created user',user._id.toString());
    } else console.log('Found user',user._id.toString());

    const userId = user._id;
    const betAmount = 5;
    console.log('\nSimulating LOSS: user loses',betAmount);
    const MinesController = require('./backend/mines/controller/MinesController');
    let res = await MinesController.updateMyBalance({ userId: userId, betAmount: betAmount, type: 'bet' });
    console.log('Loss response:',res);

    admin = await models.adminUserModel.findOne();
    console.log('Admin balance after loss:',admin.balance);
    const txs1 = await models.adminTransactionModel.find({}).sort({createdAt:-1}).limit(5);
    console.log('Latest admin txs:',txs1.map(t=>({type:t.type,amount:t.amount,balanceAfter:t.balanceAfter,createdAt:t.createdAt})));

    const payout = 10;
    console.log('\nSimulating WIN: credit user',payout);
    const CrashController = require('./backend/crash/controller/CrashController');
    res = await CrashController.updatePlayerBalance({ userId: userId, amount: -payout }, false);
    console.log('Win response:',res);
    admin = await models.adminUserModel.findOne();
    console.log('Admin balance after win:',admin.balance);
    const txs2 = await models.adminTransactionModel.find({}).sort({createdAt:-1}).limit(5);
    console.log('Latest admin txs:',txs2.map(t=>({type:t.type,amount:t.amount,balanceAfter:t.balanceAfter,createdAt:t.createdAt})));

    user = await models.userModel.findOne({_id:userId});
    console.log('User balance object:',user.balance);

    process.exit(0);
  }catch(e){console.error(e);process.exit(1);} 
})();
