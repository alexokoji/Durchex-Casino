import Config from "config/index";
import { io } from "socket.io-client";

export default class BlackjackSocketManager {
    static _instance = null;

    socket;

    static getInstance() {
        if (BlackjackSocketManager._instance === null)
            BlackjackSocketManager._instance = new BlackjackSocketManager();

        return BlackjackSocketManager._instance;
    }

    connect() {
        // allow configuration to be added later if we run a blackjack socket service
        const url = Config.Root.blackjackSocketUrl || Config.Root.slotSocketUrl;
        this.socket = io(url, { transports: ['websocket'] });
        let self = this;

        this.socket.on('connect', function () {
            // connected
        });

        // broadcast incoming messages via window.postMessage for the React app
        this.socket.on('betResult', function (response) {
            const message = { type: 'playzelo-Blackjack-BetResult', data: response };
            self.postMessage(message);
        });

        this.socket.on('newBetUser', function (response) {
            const message = { type: 'playzelo-Blackjack-NewBetUser', data: response };
            self.postMessage(message);
        });

        this.socket.on('newCashout', function (response) {
            const message = { type: 'playzelo-Blackjack-NewCashout', data: response };
            self.postMessage(message);
        });

        this.socket.on('removeBetUser', function (response) {
            const message = { type: 'playzelo-Blackjack-RemoveBetUser', data: response };
            self.postMessage(message);
        });
    }

    postMessage(message) {
        window.postMessage(message, '*');
    }

    disconnect() {
        if (this.socket) this.socket.disconnect();
    }

    // stubs for future use
    joinBet(data) {
        if (this.socket) this.socket.emit('joinBet', data);
    }

    placeBet(data) {
        if (this.socket) this.socket.emit('placeBet', data);
    }
}
