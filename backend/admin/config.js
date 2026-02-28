module.exports = {
    serverInfo: {
        host: '127.0.0.1',
        // avoid colliding with other critical processes on 3000
        port: process.env.ADMIN_PORT || '3001'  // ignore generic PORT (--pm2 sets PORT=3000)
    },
    dbInfo: {
        host: '127.0.0.1',
        port: '27017',
        name: 'PlayZelo'
    },
    jwt: {
        secret: 'csgoclubggjwttokenfetyuhgbcase45w368w3q',
        expire: '365d'
    },
    session: {
        time: 1000 * 60 * 30
    },
    admin: {
        id: 'admin',
        name: 'admin',
        pass: 'admin',
        authKey: 'PlayZelo-Admin',
        commission: 10.00
    },
    gameInfo: {
        host: '127.0.0.1',
        port: '7200',
    }
};