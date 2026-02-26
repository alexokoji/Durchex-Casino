import axios from 'axios';
import Config from '../config/baseConfig';

const API_BASE = Config.Root.apiUrl;

// Create axios instance with default headers
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Wallet API Service
const walletApi = {
  // Demo Mode
  getDemoBalance: async (userId) => {
    try {
      const response = await apiClient.post(Config.request.getDemoBalance, { userId });
      return response.data;
    } catch (error) {
      console.error('Error fetching demo balance:', error);
      throw error;
    }
  },

  toggleDemoMode: async (userId, demoMode) => {
    try {
      const response = await apiClient.post(Config.request.toggleDemoMode, {
        userId,
        demoMode
      });
      return response.data;
    } catch (error) {
      console.error('Error toggling demo mode:', error);
      throw error;
    }
  },

  simulateDemoDeposit: async (userId, coinType, chain, amount) => {
    try {
      const response = await apiClient.post(Config.request.simulateDemoDeposit, {
        userId,
        coinType,
        chain,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Error simulating demo deposit:', error);
      throw error;
    }
  },

  // Deposits
  getOrCreateDepositAddress: async (userId, coinType, chain, tokenType) => {
    try {
      const response = await apiClient.post(Config.request.getOrCreateDepositAddress, {
        userId,
        coinType,
        chain,
        tokenType
      });
      return response.data;
    } catch (error) {
      console.error('Error getting deposit address:', error);
      throw error;
    }
  },

  getDepositHistory: async (userId, limit = 10, skip = 0) => {
    try {
      const response = await apiClient.post(Config.request.getDepositHistory, {
        userId,
        limit,
        skip
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching deposit history:', error);
      throw error;
    }
  },

  // Withdrawals
  processWithdrawal: async (userId, coinType, chain, amount, address, tokenType) => {
    try {
      const response = await apiClient.post(Config.request.processWithdrawal, {
        userId,
        coinType,
        chain,
        amount,
        address,
        tokenType
      });
      return response.data;
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      throw error;
    }
  },

  getWithdrawalHistory: async (userId, limit = 10, skip = 0) => {
    try {
      const response = await apiClient.post(Config.request.getWithdrawalHistory, {
        userId,
        limit,
        skip
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
      throw error;
    }
  },

  getWithdrawalStatus: async (withdrawalId) => {
    try {
      const response = await apiClient.post(Config.request.getWithdrawalStatus, {
        withdrawalId
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching withdrawal status:', error);
      throw error;
    }
  }
};

export default walletApi;
