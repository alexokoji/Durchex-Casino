import { Modal, Box, IconButton, Button, Typography } from "@mui/material";
import { Close, Apple } from "@mui/icons-material";
import { makeStyles } from "@mui/styles";
import PropTypes from "prop-types";
import clsx from "clsx";
import CustomButton from "views/components/buttons/CustomButton";
import MetamaskIcon from "assets/icons/metamask.png";
import CoinBaseIcon from "assets/icons/coinbase.png";
import WalletConnectIcon from "assets/icons/walletconnect.png";
import { useEffect, useState, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useGoogleLogin } from '@react-oauth/google';
import { userGoogleLogin, metamaskLogin, getMyBalances, emailLogin, verifyEmailCode, updateProfileSet } from "redux/actions/auth";
import { useToasts } from "react-toast-notifications";
import Config from "config/index";

import { ReactComponent as GoogleIcon } from "assets/icons/GoogleIcon.svg";
import ReactCodeInput from "react-verification-code-input";
import { LoadingContext } from "layout/Context/loading";
import parser from "query-string";
import { WalletLinkConnector } from "@web3-react/walletlink-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { InjectedConnector } from "@web3-react/injected-connector";
import { useWeb3React } from "@web3-react/core";

const useStyles = makeStyles(() => ({
    ModalBox: {
        marginTop: '160px',
        width: '533px',
        height: '714px',
        left: '50%',
        transform: 'translate(-50%)',
        background: '#2C2C3A',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '30px',
        "@media (max-width: 681px)": {
            width: '100%',
            padding: '28px',
            borderRadius: '0px'
        }
    },
    ModalCloseButton: {
        position: 'absolute',
        top: '-32px',
        right: '-32px',
        width: '64px',
        height: '64px',
        color: '#55556F',
        background: '#2C2C3A',
        border: '6px solid #24252D',
        "&:hover": {
            background: '#2C2C3AEE'
        },
        "@media (max-width: 681px)": {
            transform: 'translate(-50%)',
            right: 'unset',
            left: '50%'
        }
    },
    ModalBodyBox: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '422px',
        flexDirection: 'column',
        "@media (max-width: 370px)": {
            width: '90%'
        }
    },
    ModalLogoBox: {
        marginBottom: '34px',
        "&>svg": {
            width: '245px',
            height: '32px'
        }
    },
    ModalInputBox: {
        width: '100%',
        marginBottom: '14px'
    },
    EmailInput: {
        width: '100%',
        background: '#424253',
        outline: 'none',
        border: 'none',
        textAlign: 'center',
        color: '#FFF',
        fontSize: '17px',
        height: '54px',
        fontWeight: '400',
        borderRadius: '7px',
        fontFamily: 'Styrene A Web',
        lineHeight: '22px',
        "&::placeholder": {
            color: '#FFF'
        }
    },
    AuthButton: {
        width: '100%',
        height: '55px',
        fontSize: '16px',
        fontWeight: '700',
        fontFamily: 'Styrene A Web',
        lineHeight: '20px'
    },
    NextButton: {
        background: 'linear-gradient(48.57deg, #5A45D1 24.42%, #BA6AFF 88.19%);',
        color: '#FFF',
        textTransform: 'uppercase',
        borderRadius: '8px',
    },
    ORBox: {
        background: '#424253',
        color: '#FFF',
        marginTop: '20px',
        marginBottom: '20px',
        borderRadius: '7px',
        padding: '6px 13px',
        textAlign: "center",
        "&>span": {
            textTransform: 'uppercase',
            fontFamily: "'Styrene A Web'",
            fontStyle: "normal",
            fontWeight: '400',
            fontSize: "17px",
            lineHeight: "22px"
        }
    },
    AppleLoginButton: {
        background: '#000',
        color: '#FFF'
    },
    WalletConnectIcon: {
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: '#FFF',
        "&>img": {
            borderRadius: '50%',
            width: '100%',
            height: '100%'
        }
    },
    WalletConnectBox: {
        display: 'flex',
        gap: '10px'
    },
    GoogleLoginButton: {
        width: '100%',
        height: '50px',
        borderRadius: '5px !important',
        display: 'flex !important',
        alignItems: 'center !important',
        justifyContent: 'center',
        position: 'relative',
        background: 'linear-gradient(rgb(249, 253, 255) 0%, rgb(207, 226, 234) 100%)',
        marginBottom: '10px',
        "&>div": {
            background: 'unset !important',
            margin: '0px',
            position: 'absolute',
            left: '10px'
        },
        "&>span": {
            padding: '0px !important',
            color: '#1a2c38',
            fontWeight: '700 !important',
            fontSize: '16px',
        },
        "&:disabled": {
            cursor: 'not-allowed'
        }
    },
    backdrop: {
        backgroundColor: '#1F1E25',
        opacity: '0.95 !important'
    },
    CodeTitle: {
        fontSize: '20px',
        color: '#FFF',
        fontFamily: 'Styrene A Web',
        lineHeight: '22px',
        textTransform: 'uppercase',
        fontWeight: '700'
    },
    CodeSubTitle: {
        marginTop: '20px',
        marginBottom: '20px'
    },
    CodeInput: {
        "&>div": {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        "&>div>input": {
            borderRadius: '6px',
            color: '#FFF',
            background: '#424253',
            border: 'none',
            width: '50px !important',
            height: '50px !important',
            fontFamily: 'Styrene A Web',
            "&:focus": {
                border: 'none',
                caretColor: '#FFF'
            }
        },
        "&>div>input:first-child": {
            'border-top-left-radius': '6px',
            'border-bottom-left-radius': '6px'
        },
        "&>div>input:last-child": {
            'border-top-right-radius': '6px',
            'border-bottom-right-radius': '6px',
            borderRight: '0px'
        }
    },
    ResendButton: {
        fontSize: '16px',
        color: '#FFF',
        fontFamily: 'Styrene A Web',
        cursor: 'pointer'
    },
    PromotionCode: {
        paddingLeft: 16,
        "&::placeholder": {
            color: '#aaa',
            fontSize: 14
        }
    }
}));

const PROFILE_STATUS = {
    INIT: 0,
    UNSET: 1,
    SET: 2
};

const INFRA_API_KEY = '69b01f7c51d044c0a7883220a2104df3';

const CoinbaseWallet = new WalletLinkConnector({
    url: `https://mainnet.infura.io/v3/${INFRA_API_KEY}`,
    appName: "Web3-react-demo"
});

const WalletConnect = new WalletConnectConnector({
    rpcUrl: `https://mainnet.infura.io/v3/${INFRA_API_KEY}`,
    bridge: "https://bridge.walletconnect.org",
    qrcode: true,
});

const Injected = new InjectedConnector({
    supportedChainIds: [1, 3, 4, 5, 42]
});

const AuthenticationModal = ({ open, setOpen, authType }) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const { addToast } = useToasts();
    const { showLoading, hideLoading } = useContext(LoadingContext);
    const { active, account, activate } = useWeb3React();

    const authData = useSelector((state) => state.authentication);
    
    // Log web3-react state immediately
    useEffect(() => {
        console.log('🌐 Web3React state update:', { active, account, isModalOpen: open });
    }, [active, account, open]);
    const [isMetamask, setMetamask] = useState(false);
    // const [ethAddress, setEthAddress] = useState('');
    const [emailAddress, setEmailAddress] = useState('');
    const [codeInput, setCodeInput] = useState(false);
    // eslint-disable-next-line
    const [verifyCode, setVerifyCode] = useState('');
    const [profileSet, setProfileSet] = useState(PROFILE_STATUS.INIT);
    const [userNickName, setUserNickName] = useState('');
    const [promotionCode, setPromotionCode] = useState('');
    const [walletConnecting, setWalletConnecting] = useState(false);
    const [walletInitiated, setWalletInitiated] = useState(false);
    const [connectedAccount, setConnectedAccount] = useState(null);

    const [campaignData, setCampaignData] = useState({ exist: false, code: '' });

    const handleClose = () => {
        setOpen(false);
        // Reset wallet connection states when modal closes
        setWalletInitiated(false);
        setConnectedAccount(null);
        setWalletConnecting(false);
    };

    useEffect(() => {
        // Modern MetaMask detection using window.ethereum
        if (typeof window.ethereum !== 'undefined') {
            setMetamask(window.ethereum.isMetaMask === true);
        } else if (typeof window.web3 !== 'undefined' && window.web3.currentProvider) {
            // Fallback to deprecated window.web3 for older setups
            setMetamask(window.web3.currentProvider.isMetaMask === true);
        } else {
            setMetamask(false);
        }

        const codeData = parser.parse(window.location.search);
        if (codeData.code) {
            setCampaignData({ exist: true, code: codeData.code });
            setPromotionCode(codeData.code);
        }
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        // Close modal when profile setup is complete (PROFILE_STATUS.SET = 2)
        console.log('👁️ profileSet effect triggered - current value:', profileSet, 'PROFILE_STATUS.SET:', PROFILE_STATUS.SET, 'Match:', profileSet === PROFILE_STATUS.SET);
        
        if (profileSet === PROFILE_STATUS.SET) {
            console.log('🎉✅ Profile setup complete (profileSet === 2) - Closing modal now');
            console.log('Current state - profileSet:', profileSet, 'open prop:', open);
            // Close modal immediately
            console.log('🔴 Calling setOpen(false)');
            setOpen(false);
        } else {
            console.log('⏳ Profile not set yet - profileSet:', profileSet, '(expected 2 for close)');
        }
        // eslint-disable-next-line
    }, [profileSet]);

    useEffect(() => {
        // Reset states when modal closes
        console.log('👀 open effect triggered - open:', open);
        if (!open) {
            console.log('👋 Modal closed - Resetting local states');
            setProfileSet(PROFILE_STATUS.INIT);
            setUserNickName('');
            setConnectedAccount(null);
            setWalletConnecting(false);
            setWalletInitiated(false);
            setCodeInput(false);
            setEmailAddress('');
        } else {
            console.log('🟢 Modal OPENED - not resetting states');
        }
        // eslint-disable-next-line
    }, [open]);

    useEffect(() => {
        console.log('🔄 Wallet login effect fired:', { active, account, condition: active && account });
        console.log('📊 Active:', active, '| Account:', account, '| Modal open:', open);
        
        if (active && account) {
            console.log('✅✅ CONDITIONS MET - active=true AND account exists!');
            setConnectedAccount(account);
            console.log('✅ Wallet connected:', account);
            console.log('Active:', active, 'Account:', account);
            addToast(`✓ Wallet connected: ${account.slice(0, 6)}...${account.slice(-4)}`, { appearance: 'success', autoDismiss: false });
            
            const userMetamaskLogin = async () => {
                // Show loading at the START of the operation
                showLoading();
                console.log('⏳ Showing loader - starting wallet login');
                
                try {
                    console.log('🔐 Logging in with wallet account...', { address: account, type: 'eth', campaignData });
                    const response = await metamaskLogin({ address: account, type: 'eth', campaignData });
                    
                    console.log('📡 Wallet login response:', response);
                    console.log('Response.data status:', response?.data?.status);
                    
                    if (response?.data?.status) {
                        console.log('✅ Login successful - Response data:', response.data);
                        console.log('📦 Full response.data.userData:', response.data.userData);
                        console.log('🔍 userData.profileSet value:', response.data.userData.profileSet, 'Type:', typeof response.data.userData.profileSet);
                        
                        // Dispatch auth actions
                        console.log('📤 Dispatching SET_AUTH...');
                        dispatch({ type: 'SET_AUTH' });
                        
                        console.log('🔐 Setting token:', response.data.userData.userToken);
                        Config.Api.setToken(response.data.userData.userToken);
                        
                        console.log('📤 Dispatching SET_USERDATA with:', response.data.userData);
                        dispatch({ type: 'SET_USERDATA', data: response.data.userData });
                        
                        // Set profile status
                        const hasProfile = response.data.userData.profileSet;
                        const newProfileStatus = hasProfile ? PROFILE_STATUS.SET : PROFILE_STATUS.UNSET;
                        console.log('📊 Profile logic: hasProfile=', hasProfile, ', newProfileStatus=', newProfileStatus, '(PROFILE_STATUS.SET=', PROFILE_STATUS.SET, ', UNSET=', PROFILE_STATUS.UNSET, ')');
                        console.log('🎯 About to call setProfileSet(' + newProfileStatus + ')');
                        setProfileSet(newProfileStatus);
                        
                        setUserNickName(response.data.userData.userNickName || '');

                        const settingData = {
                            inited: true,
                            sound: response.data.setting.sound,
                            backgroundSound: response.data.setting.backgroundSound,
                            effectSound: response.data.setting.effectSound,
                            hotkey: response.data.setting.hotkey,
                            animation: response.data.setting.animation,
                            maxBet: response.data.setting.maxBet
                        };
                        
                        console.log('📤 Dispatching INIT_SETTING...');
                        dispatch({ type: 'INIT_SETTING', data: settingData });

                        try {
                            console.log('💰 Fetching balance for userId:', response.data.userData._id);
                            const balanceData = await getMyBalances({ userId: response.data.userData._id });
                            if (balanceData?.status) {
                                console.log('📤 Dispatching SET_BALANCEDATA...');
                                dispatch({ type: 'SET_BALANCEDATA', data: balanceData.data.data });
                                console.log('✅ Balances loaded successfully');
                            }
                            else {
                                console.warn('⚠️ Failed to load balance:', balanceData?.message);
                                addToast(balanceData?.message || 'Failed to load balance', { appearance: 'warning', autoDismiss: true });
                                // Continue anyway - don't block modal close
                            }
                        } catch (balanceError) {
                            console.error('❌ Error fetching balances:', balanceError);
                            addToast('Failed to load balance: ' + balanceError.message, { appearance: 'warning', autoDismiss: true });
                            // Continue anyway - don't block modal close
                        }
                        
                        // Show appropriate message
                        if (hasProfile) {
                            addToast('🎉 Wallet login successful!', { appearance: 'success', autoDismiss: true });
                            console.log('🎉 Existing user - profileSet will trigger modal close');
                        } else {
                            addToast('⏳ Please complete your profile setup', { appearance: 'info', autoDismiss: false });
                            console.log('⏳ New user - showing profile setup form');
                        }
                    }
                    else {
                        console.error('❌ Login failed:', response?.data?.message);
                        addToast(response?.data?.message || response?.message || 'Connection failed', { appearance: 'error', autoDismiss: true });
                    }
                } catch (error) {
                    console.error('❌ Metamask login error:', error);
                    console.error('Error details:', error.message, error.response);
                    addToast(error?.message || 'Failed to login with wallet', { appearance: 'error', autoDismiss: true });
                } finally {
                    console.log('🏁 Wallet login complete - hiding loader', { walletConnecting: walletConnecting, walletInitiated: walletInitiated });
                    // Hide loading AFTER all async operations complete
                    hideLoading();
                    setWalletConnecting(false);
                    setWalletInitiated(false);
                }
            };
            
            userMetamaskLogin();
        } else {
            console.log('❌ Conditions NOT met - active:', active, '| account:', account);
        }
        // eslint-disable-next-line
    }, [active, account]);

    // FALLBACK: If web3-react doesn't update, use the locally tracked connectedAccount
    useEffect(() => {
        console.log('🔍 Fallback effect checking connectedAccount:', connectedAccount, 'active:', active, 'account:', account);
        
        if (connectedAccount && !active && !account) {
            console.log('⚠️ FALLBACK: Web3-react not updated but we have connectedAccount, triggering login manually');
            
            // Manually trigger login with the connected account since web3-react didn't update
            const fallbackLogin = async () => {
                showLoading();
                console.log('⏳ FALLBACK: Showing loader - starting wallet login with manual account');
                
                try {
                    console.log('🔐 FALLBACK: Logging in with wallet account...', { address: connectedAccount, type: 'eth', campaignData });
                    const response = await metamaskLogin({ address: connectedAccount, type: 'eth', campaignData });
                    
                    console.log('📡 FALLBACK: Wallet login response:', response);
                    console.log('Response.data status:', response?.data?.status);
                    
                    if (response?.data?.status) {
                        console.log('✅ FALLBACK: Login successful - Response data:', response.data);
                        console.log('📦 Full response.data.userData:', response.data.userData);
                        
                        // Dispatch auth actions
                        console.log('📤 Dispatching SET_AUTH...');
                        dispatch({ type: 'SET_AUTH' });
                        
                        console.log('🔐 Setting token:', response.data.userData.userToken);
                        Config.Api.setToken(response.data.userData.userToken);
                        
                        console.log('📤 Dispatching SET_USERDATA with:', response.data.userData);
                        dispatch({ type: 'SET_USERDATA', data: response.data.userData });
                        
                        // Set profile status
                        const hasProfile = response.data.userData.profileSet;
                        const newProfileStatus = hasProfile ? PROFILE_STATUS.SET : PROFILE_STATUS.UNSET;
                        console.log('📊 FALLBACK: Profile logic: hasProfile=', hasProfile, ', newProfileStatus=', newProfileStatus);
                        console.log('🎯 FALLBACK: About to call setProfileSet(' + newProfileStatus + ')');
                        setProfileSet(newProfileStatus);
                        
                        setUserNickName(response.data.userData.userNickName || '');

                        const settingData = {
                            inited: true,
                            sound: response.data.setting.sound,
                            backgroundSound: response.data.setting.backgroundSound,
                            effectSound: response.data.setting.effectSound,
                            hotkey: response.data.setting.hotkey,
                            animation: response.data.setting.animation,
                            maxBet: response.data.setting.maxBet
                        };
                        
                        console.log('📤 Dispatching INIT_SETTING...');
                        dispatch({ type: 'INIT_SETTING', data: settingData });

                        try {
                            console.log('💰 FALLBACK: Fetching balance for userId:', response.data.userData._id);
                            const balanceData = await getMyBalances({ userId: response.data.userData._id });
                            if (balanceData?.status) {
                                console.log('📤 Dispatching SET_BALANCEDATA...');
                                dispatch({ type: 'SET_BALANCEDATA', data: balanceData.data.data });
                                console.log('✅ Balances loaded successfully');
                            }
                            else {
                                console.warn('⚠️ Failed to load balance:', balanceData?.message);
                                addToast(balanceData?.message || 'Failed to load balance', { appearance: 'warning', autoDismiss: true });
                            }
                        } catch (balanceError) {
                            console.error('❌ Error fetching balances:', balanceError);
                            addToast('Failed to load balance: ' + balanceError.message, { appearance: 'warning', autoDismiss: true });
                        }
                        
                        // Show appropriate message
                        if (hasProfile) {
                            addToast('🎉 Wallet login successful!', { appearance: 'success', autoDismiss: true });
                            console.log('🎉 FALLBACK: Existing user - profileSet will trigger modal close');
                        } else {
                            addToast('⏳ Please complete your profile setup', { appearance: 'info', autoDismiss: false });
                            console.log('⏳ FALLBACK: New user - showing profile setup form');
                        }
                    }
                    else {
                        console.error('❌ FALLBACK: Login failed:', response?.data?.message);
                        addToast(response?.data?.message || response?.message || 'Connection failed', { appearance: 'error', autoDismiss: true });
                    }
                } catch (error) {
                    console.error('❌ FALLBACK: Metamask login error:', error);
                    console.error('Error details:', error.message, error.response);
                    addToast(error?.message || 'Failed to login with wallet', { appearance: 'error', autoDismiss: true });
                } finally {
                    console.log('🏁 FALLBACK: Wallet login complete - hiding loader');
                    hideLoading();
                    setWalletConnecting(false);
                    setWalletInitiated(false);
                }
            };
            
            fallbackLogin();
        }
        // eslint-disable-next-line
    }, [connectedAccount]);

    // Listen for account changes on the provider directly
    useEffect(() => {
        const handleAccountChange = (accounts) => {
            if (accounts.length > 0) {
                console.log('👤 Account changed on provider:', accounts[0]);
                setConnectedAccount(accounts[0]);
            } else {
                console.log('⚠️ Provider reports no accounts — logging out');
                try {
                    dispatch({ type: 'SET_LOGOUT' });
                    Config.Api.clearToken();
                    addToast('Wallet disconnected. Please login again.', { appearance: 'warning', autoDismiss: true });
                } catch (err) {
                    console.error('Error during provider logout handling', err);
                }
            }
        };

        const handleChainChange = (chainId) => {
            console.log('🔗 Chain changed:', chainId);
        };

        if (typeof window.ethereum !== 'undefined') {
            try {
                window.ethereum.on('accountsChanged', handleAccountChange);
                window.ethereum.on('chainChanged', handleChainChange);
                
                return () => {
                    window.ethereum?.removeListener('accountsChanged', handleAccountChange);
                    window.ethereum?.removeListener('chainChanged', handleChainChange);
                };
            } catch (error) {
                console.error('Error setting up provider listeners:', error);
            }
        }
        // eslint-disable-next-line
    }, []);

    // const handleConnectMetamask = () => {
    //     if (window.ethereum) {
    //         window.ethereum.request({ method: 'eth_requestAccounts' })
    //             .then(res => {
    //                 setEthAddress(res[0]);
    //             })
    //             .catch(err => {
    //                 console.error(err.message);
    //                 addToast(err.message, { appearance: 'error', autoDismiss: true });
    //             });
    //     }
    // }

    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    // Always call the hook - React requires hooks to be called in the same order every render
    const googleLogin = useGoogleLogin({
        onSuccess: response => {
            if (googleClientId) {
                googleLoginSuccess(response);
            } else {
                addToast('Google login not configured', { appearance: 'error', autoDismiss: true });
            }
        },
        onError: error => {
            if (googleClientId) {
                googleLoginFail(error);
            } else {
                addToast('Google login not configured', { appearance: 'error', autoDismiss: true });
            }
        }
    });

    const googleLoginSuccess = async (success) => {
        const { access_token } = success;
        const request = { accessToken: access_token, campaignData };
        const response = await userGoogleLogin(request);
        if (response.status) {
            dispatch({ type: 'SET_AUTH' });
            Config.Api.setToken(response.data.userData.userToken);
            dispatch({ type: 'SET_USERDATA', data: response.data.userData });
            setProfileSet(response.data.userData.profileSet ? PROFILE_STATUS.SET : PROFILE_STATUS.UNSET);
            setUserNickName(response.data.userData.userNickName);

            const settingData = {
                inited: true,
                sound: response.data.setting.sound,
                backgroundSound: response.data.setting.backgroundSound,
                effectSound: response.data.setting.effectSound,
                hotkey: response.data.setting.hotkey,
                animation: response.data.setting.animation,
                maxBet: response.data.setting.maxBet
            };
            dispatch({ type: 'INIT_SETTING', data: settingData });
        }
        else {
            addToast(response.message, { appearance: 'error', autoDismiss: true });
        }
    }

    const googleLoginFail = (error) => {
        addToast(error, { appearance: 'error', autoDismiss: true });
    }

    const handleEmailLogin = async () => {
        if (vaildateEmailAddress(emailAddress)) {
            showLoading();
            const request = { emailAddress };
            const response = await emailLogin(request);
            if (response.status) {
                setCodeInput(true);
            }
            else {
                addToast(response.message, { appearance: 'error', autoDismiss: true });
            }
            hideLoading();
        }
    }

    const vaildateEmailAddress = (address) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(address);
    }

    const completeVerifyCode = async (value) => {
        sendVerifyCode(value);
    }

    const sendVerifyCode = async (value) => {
        showLoading();
        const request = { emailAddress, code: value, campaignData };
        const response = await verifyEmailCode(request);
        if (response.status) {
            dispatch({ type: 'SET_AUTH' });
            Config.Api.setToken(response.userData.userToken);
            dispatch({ type: 'SET_USERDATA', data: response.userData });
            setProfileSet(response.userData.profileSet ? PROFILE_STATUS.SET : PROFILE_STATUS.UNSET);
            setUserNickName(response.userData.userNickName);

            const settingData = {
                inited: true,
                sound: response.setting.sound,
                backgroundSound: response.setting.backgroundSound,
                effectSound: response.setting.effectSound,
                hotkey: response.setting.hotkey,
                animation: response.setting.animation,
                maxBet: response.setting.maxBet
            };
            dispatch({ type: 'INIT_SETTING', data: settingData });
        }
        else {
            addToast(response.message, { appearance: 'error', autoDismiss: true });
        }
        hideLoading();
    }

    const handleChangeCode = (value) => {
        setVerifyCode(value);
    }

    const handleResendCode = async () => {
        showLoading();
        const request = { emailAddress };
        const response = await emailLogin(request);
        if (response.status) {
            addToast('Sent!', { appearance: 'success', autoDismiss: true });
        }
        else {
            addToast(response.message, { appearance: 'error', autoDismiss: true });
        }
        hideLoading();
    }

    const handleProfileSet = async () => {
        if (!userNickName || userNickName.trim().length === 0) {
            addToast('Please enter a username', { appearance: 'warning', autoDismiss: true });
            return;
        }
        
        showLoading();
        try {
            const request = {
                profileSet: true,
                userNickName: userNickName.trim(),
                promotionCode,
                userId: authData.userData._id
            };
            console.log('📝 Submitting profile setup:', request);
            const response = await updateProfileSet(request);
            
            if (response.status) {
                console.log('✅ Profile setup successful');
                setProfileSet(PROFILE_STATUS.SET);
                addToast('🎉 Welcome! Profile setup complete', { appearance: 'success', autoDismiss: true });
                
                // Modal will auto-close due to profileSet === PROFILE_STATUS.SET effect
            } else {
                console.error('❌ Profile setup failed:', response.message);
                addToast(response.message || 'Profile setup failed', { appearance: 'error', autoDismiss: true });
            }
        } catch (error) {
            console.error('❌ Profile setup error:', error);
            addToast('Profile setup failed: ' + error.message, { appearance: 'error', autoDismiss: true });
        } finally {
            hideLoading();
        }
    }

    const handleWalletConnect = async (connector) => {
        try {
            setWalletConnecting(true);
            setWalletInitiated(true);
            console.log('🔄 Attempting to connect wallet...');
            console.log('🔗 Connector:', connector?.constructor?.name);
            
            // Activate the connector
            console.log('⏳ Calling activate()...');
            const result = await activate(connector);
            console.log('✅ activate() completed, result:', result);
            
            // Log current web3-react state RIGHT after activate
            console.log('📊 Web3React state after activate:', { active, account });
            
            // Add a delay and fallback to get accounts directly if needed
            setTimeout(async () => {
                try {
                    console.log('⏰ Timeout callback - getting accounts directly from provider');
                    if (typeof window.ethereum !== 'undefined') {
                        console.log('📡 Fetching accounts from provider...');
                        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                        if (accounts && accounts.length > 0) {
                            console.log('📍 Accounts found:', accounts[0]);
                            console.log('🎯 Current web3-react active:', active, 'account:', account);
                            
                            // If web3-react state wasn't updated, trigger login manually with the account
                            if (!active || !account) {
                                console.log('⚠️ Web3-react state not updated, triggering manual login with:', accounts[0]);
                                setConnectedAccount(accounts[0]);
                                // This should trigger the login effect, but be ready to call it manually if needed
                            } else {
                                console.log('✅ Web3-react state is good, effect should have already triggered');
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error fetching accounts:', error);
                }
            }, 500);
            
        } catch (error) {
            console.error('Wallet connection error:', error);
            let errorMessage = 'Failed to connect wallet. Please try again.';
            
            if (error.message) {
                if (error.message.includes('User rejected') || error.message.includes('User denied')) {
                    errorMessage = 'You rejected the wallet connection request.';
                } else if (error.message.includes('not installed')) {
                    errorMessage = 'Wallet not installed. Please install the wallet extension first.';
                } else if (error.message.includes('already pending')) {
                    errorMessage = 'Connection request already pending. Check your wallet.';
                } else {
                    errorMessage = error.message;
                }
            }
            
            console.error('❌ Wallet connection failed:', errorMessage);
            addToast(errorMessage, { appearance: 'error', autoDismiss: true });
            setWalletConnecting(false);
            setWalletInitiated(false);
        }
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
            slotProps={{ backdrop: { sx: { backdropFilter: 'blur(5px)', background: 'rgba(0, 0, 0, 0.7)' } } }}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box className={classes.ModalBox}>
                <IconButton className={classes.ModalCloseButton} onClick={handleClose}>
                    <Close />
                </IconButton>
                <Box className={classes.ModalBodyBox}>
                    <Box className={classes.ModalLogoBox}>
                        <img src={`/assets/images/Logo.png`} alt="Logo" />
                    </Box>
                    {
                        (!codeInput && profileSet === PROFILE_STATUS.INIT) &&
                        <>
                            <Box className={classes.ModalInputBox}>
                                <input value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} className={classes.EmailInput} type="email" spellCheck="false" placeholder="Enter your email"></input>
                            </Box>
                            <Button className={clsx(classes.NextButton, classes.AuthButton)} onClick={handleEmailLogin}>
                                <span>Next</span>
                            </Button>
                            <Box className={classes.ORBox}>
                                <span>OR</span>
                            </Box>
                            <CustomButton Icon={Apple} Text="Continue with Apple" customStyle={classes.AppleLoginButton} />
                            <CustomButton Icon={GoogleIcon} Text="Continue with Google" onClick={googleLogin} />
                            <Box className={classes.ORBox}>
                                <span>Continue With Wallet</span>
                            </Box>
                            {connectedAccount && (
                                <Box className={classes.ORBox} style={{ background: '#2d5e3d', color: '#4ade80', marginBottom: '10px' }}>
                                    <span>✓ Connected: {connectedAccount.slice(0, 6)}...{connectedAccount.slice(-4)}</span>
                                </Box>
                            )}
                            <Box className={classes.WalletConnectBox}>
                                {
                                    isMetamask &&
                                    <IconButton 
                                        className={classes.WalletConnectIcon} 
                                        onClick={() => handleWalletConnect(Injected)}
                                        disabled={walletConnecting || walletInitiated}
                                        title={walletConnecting ? "Connecting MetaMask..." : "Connect with MetaMask"}
                                    >
                                        <img src={MetamaskIcon} alt="MetaMask" style={{ opacity: walletConnecting ? 0.6 : 1 }} />
                                    </IconButton>
                                }
                                <IconButton 
                                    className={classes.WalletConnectIcon} 
                                    onClick={() => handleWalletConnect(WalletConnect)}
                                    disabled={walletConnecting || walletInitiated}
                                    title={walletConnecting ? "Connecting WalletConnect..." : "Connect with WalletConnect"}
                                > 
                                    <img src={WalletConnectIcon} alt="WalletConnect" style={{ opacity: walletConnecting ? 0.6 : 1 }} />
                                </IconButton>
                                <IconButton 
                                    className={classes.WalletConnectIcon} 
                                    onClick={() => handleWalletConnect(CoinbaseWallet)}
                                    disabled={walletConnecting || walletInitiated}
                                    title={walletConnecting ? "Connecting Coinbase..." : "Connect with Coinbase Wallet"}
                                >
                                    <img src={CoinBaseIcon} alt="Coinbase" style={{ opacity: walletConnecting ? 0.6 : 1 }} />
                                </IconButton>
                            </Box>
                        </>
                    }
                    {
                        (codeInput && profileSet === PROFILE_STATUS.INIT) &&
                        <>
                            <Typography className={classes.CodeTitle}>Check your email</Typography>
                            <Typography className={classes.CodeSubTitle}>Please enter the code sent to <strong>{emailAddress}</strong></Typography>
                            <ReactCodeInput onComplete={completeVerifyCode} onChange={handleChangeCode} className={classes.CodeInput} />
                            <Typography sx={{ color: '#FFF' }} className={classes.CodeSubTitle}>Didn't receive code. <strong className={classes.ResendButton} onClick={handleResendCode}>Resend Now</strong></Typography>
                        </>
                    }
                    {
                        profileSet === PROFILE_STATUS.UNSET &&
                        <>
                            <Box className={classes.ModalInputBox}>
                                <input value={userNickName} onChange={(e) => setUserNickName(e.target.value)} className={classes.EmailInput} type="text"></input>
                            </Box>
                            <Box className={classes.ModalInputBox}>
                                <input disabled={campaignData.exist} value={promotionCode} placeholder="Promotion Code(optional)" onChange={(e) => setPromotionCode(e.target.value)} className={clsx(classes.EmailInput, classes.PromotionCode)} style={{ textAlign: 'left' }} type="text"></input>
                            </Box>
                            <Button className={clsx(classes.NextButton, classes.AuthButton)} onClick={handleProfileSet}>
                                <span>Start Game</span>
                            </Button>
                        </>
                    }
                </Box>
            </Box>
        </Modal>
    );
};

AuthenticationModal.propTypes = {
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired
};

export default AuthenticationModal;