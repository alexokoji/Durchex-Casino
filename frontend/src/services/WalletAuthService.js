/**
 * Wallet Authentication Service
 * Handles all wallet connections and message signing
 */

export class WalletAuthService {
    /**
     * Request wallet account from MetaMask
     */
    static async connectMetaMask() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask not installed. Please install MetaMask extension.');
            }

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts available. Please unlock your wallet and try again.');
            }

            return {
                address: accounts[0],
                provider: window.ethereum,
                walletType: 'metamask'
            };
        } catch (error) {
            throw new Error(
                error.message.includes('rejected') || error.message.includes('denied')
                    ? 'You rejected the wallet connection. Please try again.'
                    : error.message
            );
        }
    }

    /**
     * Request wallet account from WalletConnect
     */
    static async connectWalletConnect(connector) {
        try {
            if (!connector) {
                throw new Error('WalletConnect not initialized.');
            }

            await connector.activate();
            return { walletType: 'walletconnect' };
        } catch (error) {
            throw new Error(
                error.message.includes('rejected') || error.message.includes('denied')
                    ? 'You rejected the wallet connection. Please try again.'
                    : 'Failed to connect WalletConnect. Please try again.'
            );
        }
    }

    /**
     * Request wallet account from Coinbase
     */
    static async connectCoinbase(connector) {
        try {
            if (!connector) {
                throw new Error('Coinbase Wallet not initialized.');
            }

            await connector.activate();
            return { walletType: 'coinbase' };
        } catch (error) {
            throw new Error(
                error.message.includes('rejected') || error.message.includes('denied')
                    ? 'You rejected the wallet connection. Please try again.'
                    : 'Failed to connect Coinbase Wallet. Please try again.'
            );
        }
    }

    /**
     * Generate and sign a verification message
     */
    static generateVerificationMessage(address, nonce = Date.now()) {
        const message = `Sign this message to verify your wallet ownership.\n\nAddress: ${address}\nTimestamp: ${new Date(nonce).toISOString()}\nNonce: ${nonce}`;
        return { message, nonce };
    }

    /**
     * Request signature from user's wallet
     */
    static async requestSignature(address, message) {
        try {
            if (!window.ethereum) {
                throw new Error('Wallet provider not available.');
            }

            const signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [message, address]
            });

            if (!signature) {
                throw new Error('Signature request failed.');
            }

            return signature;
        } catch (error) {
            throw new Error(
                error.message.includes('rejected') || error.message.includes('denied')
                    ? 'You rejected the signature request.'
                    : 'Failed to request signature: ' + error.message
            );
        }
    }

    /**
     * Validate wallet address format
     */
    static isValidAddress(address) {
        const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
        const tronAddressRegex = /^T[a-zA-Z0-9]{33}$/;
        return ethereumAddressRegex.test(address) || tronAddressRegex.test(address);
    }

    /**
     * Get network from address
     */
    static getNetworkFromAddress(address) {
        if (address.startsWith('0x')) {
            return 'ethereum';
        } else if (address.startsWith('T')) {
            return 'tron';
        }
        return 'unknown';
    }

    /**
     * Format address for display
     */
    static formatAddress(address, chars = 6) {
        if (!address) return '';
        return `${address.slice(0, chars)}...${address.slice(-chars)}`;
    }
}

export default WalletAuthService;
