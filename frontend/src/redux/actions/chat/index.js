import { io } from 'socket.io-client';
import Config from "config/index";

const chatRoomConnect = async () => {
    try {
        Config.Root.chatSocket = io(Config.Root.chatSocketUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            path: '/socket.io',
            autoConnect: true
        });

        Config.Root.chatSocket.on('connect', () => {
            console.log('✓ Chat socket connected successfully');
        });

        Config.Root.chatSocket.on('connect_error', (error) => {
            console.error('✗ Chat socket connection error:', error.message);
        });

        Config.Root.chatSocket.on('disconnect', (reason) => {
            console.warn('Chat socket disconnected:', reason);
        });

        Config.Root.chatSocket.on('reconnect_attempt', () => {
            console.log('Attempting to reconnect chat socket...');
        });

    } catch (error) {
        console.error('Error initializing chat socket:', error);
    }
}

export default chatRoomConnect;