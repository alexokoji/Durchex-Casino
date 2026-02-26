require('dotenv').config({ path: __dirname + '/../.env' });

module.exports = {
    serverInfo: {
        host: '127.0.0.1',
        port: '5400'
    },
    DB: process.env.MONGODB_URL || 'mongodb+srv://victoryfox1116:kzBPFHRoRfxdDGVO@cluster0.iknukbk.mongodb.net/PlayZelo?authSource=admin&replicaSet=atlas-10v8gb-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true'
}