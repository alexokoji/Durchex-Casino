const SlotSocket = require('../socket/SlotSocket');
const ManageSocket = require('../socket/ManageSocket');

var slotSocket = null;
var manageSocket = null;

exports.createServer = (app) => {
    const server = require('http').createServer(app);
    slotSocket = new SlotSocket(server);
    manageSocket = new ManageSocket();
    return server;
}

exports.sendBetResult = (data, socket) => {
    if (slotSocket === null)
        return;
        
    slotSocket.sendTo(socket, 'betResult', data);
}

// broadcast helpers for frontend statistics (mirrors crash implementation)
exports.newBetUser = (data) => {
    if (slotSocket === null)
        return;

    slotSocket.broadCast('newBetUser', data);
}

exports.newCashout = (data) => {
    if (slotSocket === null)
        return;

    slotSocket.broadCast('newCashout', data);
}

exports.removeBetUser = (data) => {
    if (slotSocket === null)
        return;

    slotSocket.broadCast('removeBetUser', data);
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