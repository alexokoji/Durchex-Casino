import Config from "config/index";
import { io } from "socket.io-client";

export default class PlinkoSocketManager {
    static _instance = null;

    socket;

    static getInstance() {
        if (PlinkoSocketManager._instance === null)
            PlinkoSocketManager._instance = new PlinkoSocketManager();

        return PlinkoSocketManager._instance;
    }

    connect() {
        this.socket = io(Config.Root.plinkoSocketUrl, { transports: ['websocket'] });
        let self = this;

        this.socket.on('connect', function () {
        });

        this.socket.on('betResult', function (response) {
            const message = { type: 'playzelo-Plinko-BetResult', data: response };
            self.postMessage(message);
        });
        this.socket.on('newBetUser', function (response) {
            const message = { type: 'playzelo-Plinko-NewBetUser', data: response };
            self.postMessage(message);
        });
        this.socket.on('newCashout', function (response) {
            const message = { type: 'playzelo-Plinko-NewCashout', data: response };
            self.postMessage(message);
        });
        this.socket.on('removeBetUser', function (response) {
            const message = { type: 'playzelo-Plinko-RemoveBetUser', data: response };
            self.postMessage(message);
        });
    }

    postMessage(message) {
        window.postMessage(message, '*');
    }

    disconnect() {
        this.socket.disconnect();
    }

    joinBet(data) {
        this.socket.emit('joinBet', data)
    }
}