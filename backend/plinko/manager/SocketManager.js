const PlinkoSocket = require('../socket/PlinkoSocket');
const ManageSocket = require('../socket/ManageSocket');

var plinkoSocket = null;
var manageSocket = null;

exports.createServer = (app) => {
    const server = require('http').createServer(app);
    plinkoSocket = new PlinkoSocket(server);
    manageSocket = new ManageSocket();
    return server;
}

exports.sendBetResult = (data, socket) => {
    if (plinkoSocket === null)
        return;
    plinkoSocket.sendTo(socket, 'betResult', data);
}

exports.newBetUser = (data) => {
    if (plinkoSocket === null)
        return;

    plinkoSocket.broadCast('newBetUser', data);
}

exports.newCashout = (data) => {
    if (plinkoSocket === null)
        return;

    plinkoSocket.broadCast('newCashout', data);
}

exports.removeBetUser = (data) => {
    if (plinkoSocket === null)
        return;

    plinkoSocket.broadCast('removeBetUser', data);
}

exports.sendBetHistory = (data) => {
    if (manageSocket !== null)
        manageSocket.newBetHistory(data);
}

exports.requestBalanceUpdate = (data) => {
    if (manageSocket !== null)
        manageSocket.userBalanceUpdated(data);
}

exports.requestWargerAmountUpdate = (data) => {
    if (manageSocket !== null)
        manageSocket.updateWargerAmount(data);
}