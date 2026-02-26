/**
 * MetaMask Wallet Utilities
 * Provides functions for connecting to MetaMask and retrieving provider
 */

/**
 * Get the MetaMask provider with fallback support
 * Handles both new window.ethereum and deprecated window.web3.currentProvider
 * @returns {Object|null} The provider object or null if not available
 */
export const getMetaMaskProvider = () => {
    if (typeof window === 'undefined') return null;
    
    // Prefer window.ethereum (new standard)
    if (window.ethereum) {
        return window.ethereum;
    }
    
    // Fallback to web3.currentProvider (deprecated but still works)
    if (window.web3) {
        return window.web3.currentProvider;
    }
    
    console.error('MetaMask not detected. Please install MetaMask extension.');
    return null;
};

/**
 * Request accounts from MetaMask
 * @returns {Promise<string|null>} The first account address or null if failed
 */
export const connectMetaMask = async () => {
    const provider = getMetaMaskProvider();
    if (!provider) {
        console.error('MetaMask not available');
        return null;
    }
    
    try {
        const accounts = await provider.request({ 
            method: 'eth_requestAccounts' 
        });
        
        if (accounts && accounts.length > 0) {
            console.log('✓ MetaMask connected:', accounts[0]);
            return accounts[0];
        }
        
        return null;
    } catch (error) {
        console.error('Failed to connect MetaMask:', error.message);
        return null;
    }
};

/**
 * Get the chain ID from MetaMask
 * @returns {Promise<string|null>} The chain ID in hex format or null if failed
 */
export const getChainId = async () => {
    const provider = getMetaMaskProvider();
    if (!provider) return null;
    
    try {
        const chainId = await provider.request({ 
            method: 'eth_chainId' 
        });
        return chainId;
    } catch (error) {
        console.error('Failed to get chain ID:', error);
        return null;
    }
};

/**
 * Get accounts from MetaMask without requesting permission
 * @returns {Promise<string[]>} Array of account addresses
 */
export const getAccounts = async () => {
    const provider = getMetaMaskProvider();
    if (!provider) return [];
    
    try {
        const accounts = await provider.request({ 
            method: 'eth_accounts' 
        });
        return accounts || [];
    } catch (error) {
        console.error('Failed to get accounts:', error);
        return [];
    }
};

export default {
    getMetaMaskProvider,
    connectMetaMask,
    getChainId,
    getAccounts
};
