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

  // Flutterwave / Fiat
  initializeFlutterwave: async (userId, amount, currency, customerEmail, customerPhone, customerName, paymentMethod = 'card') => {
    try {
      const response = await apiClient.post(Config.request.flutterwaveInitialize, {
        userId,
        amount,
        currency,
        paymentMethod,
        customerEmail,
        customerPhone,
        customerName
      });
      return response.data;
    } catch (error) {
      console.error('Error initializing Flutterwave payment:', error);
      throw error;
    }
  },

  verifyFlutterwave: async (reference) => {
    try {
      const response = await apiClient.post(Config.request.flutterwaveVerify, { reference });
      return response.data;
    } catch (error) {
      console.error('Error verifying Flutterwave payment:', error);
      throw error;
    }
  },

  getFlutterwaveHistory: async (userId, type = 'deposit', limit = 50, skip = 0) => {
    try {
      const response = await apiClient.post(Config.request.flutterwaveHistory, { userId, type, limit, skip });
      return response.data;
    } catch (error) {
      console.error('Error fetching Flutterwave history:', error);
      throw error;
    }
  },

  initiateFlutterwaveWithdrawal: async (userId, amount, accountNumber, accountBank, bankCode, currency, narration) => {
    try {
      const response = await apiClient.post(Config.request.flutterwaveWithdraw, {
        userId,
        amount,
        accountNumber,
        accountBank,
        bankCode,
        currency,
        narration
      });
      return response.data;
    } catch (error) {
      console.error('Error initiating Flutterwave withdrawal:', error);
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
