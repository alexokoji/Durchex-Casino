import Config from "config/index";
import { io } from "socket.io-client";

export default class SlotSocketManager {
    static _instance = null;

    socket;

    static getInstance() {
        if (SlotSocketManager._instance === null)
            SlotSocketManager._instance = new SlotSocketManager();

        return SlotSocketManager._instance;
    }

    connect() {
        this.socket = io(Config.Root.slotSocketUrl, { transports: ['websocket'] });
        let self = this;

        this.socket.on('connect', function () {
        });

        this.socket.on('betResult', function (response) {
            const message = { type: 'playzelo-Slot-BetResult', data: response };
            self.postMessage(message);
        });

        // broadcast of any user placing a bet (for statistics)
        this.socket.on('newBetUser', function (response) {
            const message = { type: 'playzelo-Slot-NewBetUser', data: response };
            self.postMessage(message);
        });

        this.socket.on('newCashout', function (response) {
            const message = { type: 'playzelo-Slot-NewCashout', data: response };
            self.postMessage(message);
        });

        this.socket.on('removeBetUser', function (response) {
            const message = { type: 'playzelo-Slot-RemoveBetUser', data: response };
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