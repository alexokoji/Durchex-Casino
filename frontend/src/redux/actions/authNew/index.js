/**
 * Improved Authentication Actions
 * Redux actions for authentication operations
 */

import Config from 'config/index';

export const userGoogleLogin = async (data) => {
    try {
        const response = await Config.Api.userGoogleLogin(data);
        return response.data || response;
    } catch (error) {
        return { status: false, message: error.message };
    }
};

export const emailLogin = async (data) => {
    try {
        const response = await Config.Api.emailLogin(data);
        return response.data || response;
    } catch (error) {
        return { status: false, message: error.message };
    }
};

export const verifyEmailCode = async (data) => {
    try {
        const response = await Config.Api.verifyEmailCode(data);
        return response.data || response;
    } catch (error) {
        return { status: false, message: error.message };
    }
};

export const walletLogin = async (data) => {
    try {
        const response = await Config.Api.walletLogin(data);
        return response.data || response;
    } catch (error) {
        return { status: false, message: error.message };
    }
};

export const getWalletVerificationMessage = async (data) => {
    try {
        const response = await Config.Api.getWalletVerificationMessage(data);
        return response.data || response;
    } catch (error) {
        return { status: false, message: error.message };
    }
};

export const updateProfileSet = async (data) => {
    try {
        const response = await Config.Api.updateProfileSet(data);
        return response.data || response;
    } catch (error) {
        return { status: false, message: error.message };
    }
};

export const getMyBalances = async (data) => {
    try {
        const response = await Config.Api.getMyBalances(data);
        return response.data || response;
    } catch (error) {
        return { status: false, message: error.message };
    }
};

export const getAuthData = async (data) => {
    try {
        const response = await Config.Api.getAuthData(data);
        return response.data || response;
    } catch (error) {
        return { status: false, message: error.message };
    }
};

export const logout = async (data) => {
    try {
        Config.Api.clearToken();
        localStorage.clear();
        return { status: true, message: 'Logged out successfully.' };
    } catch (error) {
        return { status: false, message: error.message };
    }
};
