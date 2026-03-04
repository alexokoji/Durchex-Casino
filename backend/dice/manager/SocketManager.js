const DiceSocket = require('../socket/DiceSocket');
const ManageSocket = require('../socket/ManageSocket');

var diceSocket = null;
var manageSocket = null;

exports.createServer = (app) => {
    const server = require('http').createServer(app);
    diceSocket = new DiceSocket(server);
    manageSocket = new ManageSocket();
    return server;
}

exports.sendNewRoundData = (data) => {
    if (diceSocket === null)
        return;

    diceSocket.broadCast('newRound', data);
}

exports.sendBetResult = (data, socket) => {
    if (diceSocket === null)
        return;

    diceSocket.sendTo(socket, 'betResult', data);
}

// broadcasts for stats
exports.newBetUser = (data) => {
    if (diceSocket === null)
        return;

    diceSocket.broadCast('newBetUser', data);
}

exports.newCashout = (data) => {
    if (diceSocket === null)
        return;

    diceSocket.broadCast('newCashout', data);
}

exports.removeBetUser = (data) => {
    if (diceSocket === null)
        return;

    diceSocket.broadCast('removeBetUser', data);
}

exports.sendHistoryData = (data, socket) => {
    if (diceSocket === null)
        return;

    diceSocket.sendTo(socket, 'historyResult', data);
}

exports.sendBetHistory = (data) => {
    if (manageSocket !== null)
        manageSocket.newBetHistory(data);
}