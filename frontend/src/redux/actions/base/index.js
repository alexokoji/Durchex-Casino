import { io } from 'socket.io-client';
import Config from "config/index";

const baseInit = async () => {
    try {
        Config.Root.socket = io(Config.Root.socketServerUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            path: '/socket.io',
            autoConnect: true
        });

        Config.Root.socket.on('connect', () => {
            console.log('✓ Base socket connected successfully');
        });

        Config.Root.socket.on('connect_error', (error) => {
            console.error('✗ Base socket connection error:', error.message);
        });

        Config.Root.socket.on('disconnect', (reason) => {
            console.warn('Base socket disconnected:', reason);
        });

        Config.Root.socket.on('reconnect_attempt', () => {
            console.log('Attempting to reconnect base socket...');
        });

    } catch (error) {
        console.error('Error initializing base socket:', error);
    }
}

export default baseInit;