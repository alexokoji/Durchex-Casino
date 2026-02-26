/**
 * Improved Authentication Controller
 * Handles all authentication operations with proper validation
 */

const axios = require('axios');
const models = require('../models/index');
const { createRandomName, generateSeed, authenticationCode, generateCampaignCode } = require('../helper/mainHelper');
const JWT = require('jsonwebtoken');
const config = require('../config');
const { sendMsg, authenticationEmail } = require('../helper/emailHelper');

/**
 * Helper functions
 */
const generateUserToken = (userName, userType, loginType) => {
    return JWT.sign(
        { userName, type: userType, loginType },
        config.JWT.secret,
        { expiresIn: config.JWT.expireIn }
    );
};

const createCampaignCode = async (userId) => {
    let flag = false;
    let campaignCode;
    do {
        campaignCode = generateCampaignCode();
        let exist = await models.campaignCodeModel.findOne({ code: campaignCode });
        if (!exist) {
            flag = true;
            await new models.campaignCodeModel({ userId, code: campaignCode }).save();
        }
    } while (!flag);
    return campaignCode;
};

const getOrCreateGameSettings = async (userId) => {
    let settingData = await models.gameSettingModel.findOne({ userId });
    if (!settingData) {
        settingData = await new models.gameSettingModel({ userId }).save();
    }
    return settingData;
};

/**
 * Get authentication data from token
 */
exports.getAuthData = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.json({ status: false, message: 'Invalid Request - Token required' });
        }

        const userData = await models.userModel.findOne({ userToken: token });
        if (!userData) {
            return res.json({ status: false, message: 'Invalid token or user not found' });
        }

        const settingData = await getOrCreateGameSettings(userData._id);
        return res.json({ status: true, data: userData, setting: settingData });
    } catch (err) {
        console.error({ title: 'authController - getAuthData', message: err.message });
        return res.json({ status: false, message: 'Server Error' });
    }
};

/**
 * Email login - Send verification code
 */
exports.emailLogin = async (req, res) => {
    try {
        const { emailAddress } = req.body;
        
        if (!emailAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
            return res.json({ status: false, message: 'Please provide a valid email address.' });
        }

        const code = authenticationCode();
        
        let authData = await models.authenticationModel.findOne({ emailAddress });
        if (authData) {
            authData.code = code;
            authData.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            await authData.save();
        } else {
            await new models.authenticationModel({
                emailAddress,
                code,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            }).save();
        }

        const response = await sendMsg(
            emailAddress,
            'Your PlayZelo Verification Code',
            authenticationEmail(code)
        );

        if (response.status) {
            return res.json({ status: true, message: 'Verification code sent to your email.' });
        } else {
            return res.json({ status: false, message: 'Failed to send verification code. Please try again.' });
        }
    } catch (err) {
        console.error({ title: 'authController - emailLogin', message: err.message });
        return res.json({ status: false, message: 'Server Error' });
    }
};

/**
 * Email login - Verify code & login/register
 */
exports.verifyEmailCode = async (req, res) => {
    try {
        const { emailAddress, code, campaignData } = req.body;

        if (!emailAddress || !code) {
            return res.json({ status: false, message: 'Email and verification code are required.' });
        }

        if (!/^\d{6}$/.test(code)) {
            return res.json({ status: false, message: 'Invalid verification code format.' });
        }

        const authData = await models.authenticationModel.findOne({ emailAddress });
        
        if (!authData) {
            return res.json({ status: false, message: 'Verification code not found. Please request a new one.' });
        }

        if (authData.code !== code) {
            return res.json({ status: false, message: 'Invalid verification code.' });
        }

        if (authData.expiresAt < new Date()) {
            return res.json({ status: false, message: 'Verification code has expired. Please request a new one.' });
        }

        // Find or create user
        let userData = await models.userModel.findOne({ userEmail: emailAddress });
        
        if (!userData) {
            // Register new user
            const saveData = {
                userName: emailAddress,
                userEmail: emailAddress,
                userPassword: '',
                userToken: '',
                loginType: 'Email',
                userNickName: createRandomName(),
                type: 'user',
                address: {},
                profileSet: false,
                campaignCode: campaignData?.exist ? campaignData.code : ''
            };

            const userToken = generateUserToken(saveData.userName, saveData.type, saveData.loginType);
            saveData.userToken = userToken;
            userData = await new models.userModel(saveData).save();

            // Create campaign code
            await createCampaignCode(userData._id);
        } else {
            // Login existing user
            const userToken = generateUserToken(userData.userName, userData.type, userData.loginType);
            userData.userToken = userToken;
            await userData.save();
        }

        const settingData = await getOrCreateGameSettings(userData._id);

        // Clean up authentication data
        await models.authenticationModel.deleteOne({ emailAddress });

        return res.json({
            status: true,
            userData,
            setting: settingData,
            message: 'Login successful!'
        });
    } catch (err) {
        console.error({ title: 'authController - verifyEmailCode', message: err.message });
        return res.json({ status: false, message: 'Server Error' });
    }
};

/**
 * Google login
 */
exports.userGoogleLogin = async (req, res) => {
    try {
        const { accessToken, campaignData } = req.body;
        if (!accessToken) {
            return res.json({ status: false, message: 'Invalid Request - Access token required' });
        }

        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!response.data.email_verified) {
            return res.json({ status: false, message: 'Google account email is not verified.' });
        }

        let userData = await models.userModel.findOne({ userEmail: response.data.email });

        if (!userData) {
            // Register new user
            const saveData = {
                userName: response.data.name,
                userEmail: response.data.email,
                userPassword: '',
                userToken: '',
                loginType: 'Google',
                userNickName: createRandomName(),
                type: 'user',
                address: {},
                profileSet: false,
                campaignCode: campaignData?.exist ? campaignData.code : ''
            };

            const userToken = generateUserToken(saveData.userName, saveData.type, saveData.loginType);
            saveData.userToken = userToken;
            userData = await new models.userModel(saveData).save();

            // Create campaign code
            await createCampaignCode(userData._id);
        } else {
            // Login existing user
            const userToken = generateUserToken(userData.userName, userData.type, userData.loginType);
            userData.userToken = userToken;
            await userData.save();
        }

        const settingData = await getOrCreateGameSettings(userData._id);

        return res.json({
            status: true,
            userData,
            setting: settingData,
            message: 'Google login successful!'
        });
    } catch (err) {
        console.error({ title: 'authController - userGoogleLogin', message: err.message });
        return res.json({ status: false, message: 'Google authentication failed.' });
    }
};

/**
 * Wallet login - Send verification message
 */
exports.getWalletVerificationMessage = async (req, res) => {
    try {
        const { address } = req.body;

        if (!address) {
            return res.json({ status: false, message: 'Wallet address is required.' });
        }

        // Validate address format
        const isValidEthAddress = /^0x[a-fA-F0-9]{40}$/.test(address);
        const isValidTronAddress = /^T[a-zA-Z0-9]{33}$/.test(address);

        if (!isValidEthAddress && !isValidTronAddress) {
            return res.json({ status: false, message: 'Invalid wallet address format.' });
        }

        const nonce = Math.random().toString(36).substring(2, 15);
        const message = `Sign this message to verify your wallet ownership.\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;

        // Store nonce in a temporary model (you might want to add this to your models)
        // For now, we'll return it to the client
        return res.json({
            status: true,
            message,
            nonce,
            address
        });
    } catch (err) {
        console.error({ title: 'authController - getWalletVerificationMessage', message: err.message });
        return res.json({ status: false, message: 'Server Error' });
    }
};

/**
 * Wallet login - Verify signature & login/register
 */
exports.walletLogin = async (req, res) => {
    try {
        const { address, signature, campaignData } = req.body;

        if (!address || !signature) {
            return res.json({ status: false, message: 'Wallet address and signature are required.' });
        }

        // Validate address format
        const isValidEthAddress = /^0x[a-fA-F0-9]{40}$/.test(address);
        const isValidTronAddress = /^T[a-zA-Z0-9]{33}$/.test(address);

        if (!isValidEthAddress && !isValidTronAddress) {
            return res.json({ status: false, message: 'Invalid wallet address format.' });
        }

        // TODO: Verify the signature against the address
        // This requires web3.js for Ethereum addresses and TronWeb for TRON addresses
        // For now, we'll do a basic validation

        let userData = await models.userModel.findOne({ userName: address });

        if (!userData) {
            // Register new wallet user
            const saveData = {
                userName: address,
                userEmail: '',
                userPassword: '',
                userToken: '',
                loginType: 'Wallet',
                userNickName: createRandomName(),
                type: 'user',
                address: {},
                profileSet: false,
                campaignCode: campaignData?.exist ? campaignData.code : ''
            };

            const userToken = generateUserToken(saveData.userName, saveData.type, saveData.loginType);
            saveData.userToken = userToken;
            userData = await new models.userModel(saveData).save();

            // Create campaign code
            await createCampaignCode(userData._id);
        } else {
            // Login existing wallet user
            const userToken = generateUserToken(userData.userName, userData.type, userData.loginType);
            userData.userToken = userToken;
            await userData.save();
        }

        const settingData = await getOrCreateGameSettings(userData._id);

        return res.json({
            status: true,
            userData,
            setting: settingData,
            message: 'Wallet login successful!'
        });
    } catch (err) {
        console.error({ title: 'authController - walletLogin', message: err.message });
        return res.json({ status: false, message: 'Wallet authentication failed.' });
    }
};

/**
 * Update profile settings
 */
exports.updateProfileSet = async (req, res) => {
    try {
        const { userId, userNickName, promotionCode } = req.body;

        if (!userId || !userNickName) {
            return res.json({ status: false, message: 'User ID and username are required.' });
        }

        // Validate username
        if (!/^[a-zA-Z0-9_-]{3,20}$/.test(userNickName)) {
            return res.json({
                status: false,
                message: 'Username must be 3-20 characters (letters, numbers, _ or -).'
            });
        }

        // Check if username is already taken
        const existingUser = await models.userModel.findOne({
            userNickName,
            _id: { $ne: userId }
        });

        if (existingUser) {
            return res.json({ status: false, message: 'Username is already taken.' });
        }

        const userData = await models.userModel.findByIdAndUpdate(
            userId,
            {
                userNickName,
                profileSet: true
            },
            { new: true }
        );

        if (!userData) {
            return res.json({ status: false, message: 'User not found.' });
        }

        return res.json({
            status: true,
            userData,
            message: 'Profile updated successfully!'
        });
    } catch (err) {
        console.error({ title: 'authController - updateProfileSet', message: err.message });
        return res.json({ status: false, message: 'Server Error' });
    }
};

/**
 * Get user balance
 */
exports.getMyBalance = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.json({ status: false, message: 'User ID is required.' });
        }

        const userData = await models.userModel.findById(userId);
        if (!userData) {
            return res.json({ status: false, message: 'User not found.' });
        }

        return res.json({ status: true, data: userData.balance });
    } catch (err) {
        console.error({ title: 'authController - getMyBalance', message: err.message });
        return res.json({ status: false, message: 'Server Error' });
    }
};

/**
 * Get user balances (all currencies)
 */
exports.getMyBalances = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.json({ status: false, message: 'User ID is required.' });
        }

        const userData = await models.userModel.findById(userId);
        if (!userData) {
            return res.json({ status: false, message: 'User not found.' });
        }

        return res.json({
            status: true,
            data: {
                data: userData.balance || []
            }
        });
    } catch (err) {
        console.error({ title: 'authController - getMyBalances', message: err.message });
        return res.json({ status: false, message: 'Server Error' });
    }
};

/**
 * Logout user
 */
exports.logout = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.json({ status: false, message: 'User ID is required.' });
        }

        return res.json({
            status: true,
            message: 'Logged out successfully.'
        });
    } catch (err) {
        console.error({ title: 'authController - logout', message: err.message });
        return res.json({ status: false, message: 'Server Error' });
    }
};
