import React, { useEffect, useState, useContext } from 'react';
import { Modal, Box, IconButton, Button, TextField, CircularProgress } from '@mui/material';
import { Close, Apple } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import clsx from 'clsx';
import { useSelector, useDispatch } from 'react-redux';
import { useToasts } from 'react-toast-notifications';
import { useGoogleLogin } from '@react-oauth/google';
import { useWeb3React } from '@web3-react/core';
import {
    userGoogleLogin,
    walletLogin,
    getMyBalances,
    emailLogin,
    verifyEmailCode,
    updateProfileSet
} from 'redux/actions/auth';
import Config from 'config/index';
import { LoadingContext } from 'layout/Context/loading';
import WalletAuthService from 'services/WalletAuthService';
import ValidationService from 'services/ValidationService';
import MetamaskIcon from 'assets/icons/metamask.png';
import CoinBaseIcon from 'assets/icons/coinbase.png';
import WalletConnectIcon from 'assets/icons/walletconnect.png';
import { ReactComponent as GoogleIcon } from 'assets/icons/GoogleIcon.svg';
import ReactCodeInput from 'react-verification-code-input';
import parser from 'query-string';

const useStyles = makeStyles(() => ({
    ModalBox: {
        marginTop: '160px',
        width: '533px',
        maxHeight: '90vh',
        left: '50%',
        transform: 'translate(-50%)',
        background: '#2C2C3A',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '30px',
        overflow: 'auto',
        '@media (max-width: 681px)': {
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
        '&:hover': {
            background: '#2C2C3AEE'
        },
        '@media (max-width: 681px)': {
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
        padding: '40px 0',
        '@media (max-width: 370px)': {
            width: '90%'
        }
    },
    ModalLogoBox: {
        marginBottom: '34px',
        '&>img': {
            width: '245px',
            height: '32px'
        }
    },
    Title: {
        fontSize: '24px',
        color: '#FFF',
        fontWeight: '700',
        marginBottom: '30px',
        textAlign: 'center'
    },
    InputBox: {
        width: '100%',
        marginBottom: '14px'
    },
    Input: {
        width: '100%',
        background: '#424253',
        outline: 'none',
        border: 'none',
        textAlign: 'left',
        color: '#FFF',
        fontSize: '15px',
        height: '54px',
        fontWeight: '400',
        borderRadius: '7px',
        padding: '0 16px',
        fontFamily: 'Styrene A Web',
        '&::placeholder': {
            color: '#999'
        },
        '&:focus': {
            background: '#4a4a5a'
        }
    },
    ErrorText: {
        color: '#FF4757',
        fontSize: '12px',
        marginTop: '4px',
        minHeight: '16px'
    },
    Button: {
        width: '100%',
        height: '54px',
        fontSize: '16px',
        fontWeight: '700',
        borderRadius: '8px',
        textTransform: 'uppercase',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.3s ease'
    },
    PrimaryButton: {
        background: 'linear-gradient(48.57deg, #5A45D1 24.42%, #BA6AFF 88.19%)',
        color: '#FFF',
        '&:hover': {
            opacity: 0.9
        },
        '&:disabled': {
            opacity: 0.5,
            cursor: 'not-allowed'
        }
    },
    SecondaryButton: {
        background: '#424253',
        color: '#FFF',
        '&:hover': {
            background: '#4a4a5a'
        }
    },
    ORBox: {
        background: '#424253',
        color: '#FFF',
        marginTop: '20px',
        marginBottom: '20px',
        borderRadius: '7px',
        padding: '8px 13px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: '400'
    },
    WalletConnectBox: {
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap'
    },
    WalletIcon: {
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: '#FFF',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
            transform: 'scale(1.05)'
        },
        '&:disabled': {
            opacity: 0.5,
            cursor: 'not-allowed'
        },
        '&>img': {
            width: '100%',
            height: '100%',
            borderRadius: '50%'
        }
    },
    CodeInput: {
        marginBottom: '20px',
        '&>div': {
            display: 'flex',
            gap: '8px',
            justifyContent: 'center'
        },
        '&>div>input': {
            borderRadius: '8px',
            color: '#FFF',
            background: '#424253',
            border: 'none',
            width: '45px !important',
            height: '50px !important',
            fontSize: '24px',
            fontWeight: '700',
            '&:focus': {
                background: '#4a4a5a',
                caretColor: '#BA6AFF'
            }
        }
    },
    WalletInfoBox: {
        background: '#2d5e3d',
        color: '#4ade80',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '15px',
        fontSize: '14px',
        textAlign: 'center'
    },
    backdrop: {
        backgroundColor: '#1F1E25',
        opacity: '0.95 !important'
    },
    LinkButton: {
        background: 'none',
        border: 'none',
        color: '#BA6AFF',
        cursor: 'pointer',
        textDecoration: 'underline',
        fontSize: '14px',
        fontFamily: 'inherit',
        padding: 0,
        '&:hover': {
            opacity: 0.8
        }
    },
    LoadingSpinner: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '54px'
    }
}));

const AUTH_STEPS = {
    LOGIN_CHOICE: 0,
    EMAIL_INPUT: 1,
    EMAIL_CODE: 2,
    PROFILE_SETUP: 3,
    SUCCESS: 4
};

const AuthModal = ({ open, setOpen, authType }) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const { addToast } = useToasts();
    const { showLoading, hideLoading } = useContext(LoadingContext);
    const authData = useSelector((state) => state.authentication);
    const { activate, account, active } = useWeb3React();

    // Form states
    const [currentStep, setCurrentStep] = useState(AUTH_STEPS.LOGIN_CHOICE);
    const [emailAddress, setEmailAddress] = useState('');
    const [emailError, setEmailError] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [codeError, setCodeError] = useState('');
    const [userNickName, setUserNickName] = useState('');
    const [nicknameError, setNicknameError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [connectedAccount, setConnectedAccount] = useState(null);
    const [campaignData, setCampaignData] = useState({ exist: false, code: '' });

    // Initialize campaign code from URL
    useEffect(() => {
        const codeData = parser.parse(window.location.search);
        if (codeData.code) {
            setCampaignData({ exist: true, code: codeData.code });
        }
    }, []);

    // Watch for completed auth
    useEffect(() => {
        if (authData.isAuth) {
            setCurrentStep(AUTH_STEPS.SUCCESS);
            setTimeout(() => {
                setOpen(false);
            }, 1500);
        }
    }, [authData.isAuth, setOpen]);

    const handleClose = () => {
        setOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setCurrentStep(AUTH_STEPS.LOGIN_CHOICE);
        setEmailAddress('');
        setVerifyCode('');
        setUserNickName('');
        setEmailError('');
        setCodeError('');
        setNicknameError('');
        setConnectedAccount(null);
    };

    // ==================== EMAIL LOGIN ====================
    const handleEmailInputChange = (e) => {
        const value = e.target.value;
        setEmailAddress(value);
        if (emailError) setEmailError('');
    };

    const handleEmailSubmit = async () => {
        if (!ValidationService.isValidEmail(emailAddress)) {
            setEmailError('Please enter a valid email address.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await emailLogin({ emailAddress });
            if (response.status) {
                setCurrentStep(AUTH_STEPS.EMAIL_CODE);
                addToast('Verification code sent to your email!', { appearance: 'success', autoDismiss: true });
            } else {
                setEmailError(response.message || 'Failed to send code. Please try again.');
            }
        } catch (error) {
            setEmailError('Error: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCodeChange = (value) => {
        setVerifyCode(value);
        if (codeError) setCodeError('');
    };

    const handleCodeSubmit = async () => {
        if (!ValidationService.isValidVerificationCode(verifyCode)) {
            setCodeError('Please enter a valid 6-digit code.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await verifyEmailCode({ emailAddress, code: verifyCode, campaignData });
            if (response.status) {
                dispatch({ type: 'SET_AUTH' });
                Config.Api.setToken(response.userData.userToken);
                dispatch({ type: 'SET_USERDATA', data: response.userData });

                if (!response.userData.profileSet) {
                    setCurrentStep(AUTH_STEPS.PROFILE_SETUP);
                } else {
                    setCurrentStep(AUTH_STEPS.SUCCESS);
                }

                // Load balances
                const balances = await getMyBalances({ userId: response.userData._id });
                if (balances.status) {
                    dispatch({ type: 'SET_BALANCEDATA', data: balances.data.data });
                }
            } else {
                setCodeError(response.message || 'Invalid code. Please try again.');
            }
        } catch (error) {
            setCodeError('Error: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ==================== WALLET LOGIN ====================
    const handleWalletConnect = async (connector) => {
        setIsLoading(true);
        try {
            if (connector === 'metamask') {
                const walletData = await WalletAuthService.connectMetaMask();
                setConnectedAccount(walletData.address);
                await performWalletLogin(walletData.address);
            } else if (connector instanceof Function) {
                await activate(connector);
            }
        } catch (error) {
            addToast(error.message || 'Failed to connect wallet.', { appearance: 'error', autoDismiss: true });
        } finally {
            setIsLoading(false);
        }
    };

    const performWalletLogin = async (address) => {
        try {
            const response = await walletLogin({ address, campaignData });
            if (response.status) {
                dispatch({ type: 'SET_AUTH' });
                Config.Api.setToken(response.userData.userToken);
                dispatch({ type: 'SET_USERDATA', data: response.userData });

                if (!response.userData.profileSet) {
                    setCurrentStep(AUTH_STEPS.PROFILE_SETUP);
                } else {
                    setCurrentStep(AUTH_STEPS.SUCCESS);
                }

                const balances = await getMyBalances({ userId: response.userData._id });
                if (balances.status) {
                    dispatch({ type: 'SET_BALANCEDATA', data: balances.data.data });
                }

                addToast('🎉 Wallet login successful!', { appearance: 'success', autoDismiss: true });
            } else {
                addToast(response.message || 'Wallet login failed.', { appearance: 'error', autoDismiss: true });
            }
        } catch (error) {
            addToast('Error: ' + error.message, { appearance: 'error', autoDismiss: true });
        }
    };

    // ==================== GOOGLE LOGIN ====================
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    const googleLogin = useGoogleLogin({
        onSuccess: async (response) => {
            setIsLoading(true);
            try {
                const result = await userGoogleLogin({ accessToken: response.access_token, campaignData });
                if (result.status) {
                    dispatch({ type: 'SET_AUTH' });
                    Config.Api.setToken(result.userData.userToken);
                    dispatch({ type: 'SET_USERDATA', data: result.userData });

                    if (!result.userData.profileSet) {
                        setCurrentStep(AUTH_STEPS.PROFILE_SETUP);
                    } else {
                        setCurrentStep(AUTH_STEPS.SUCCESS);
                    }

                    const balances = await getMyBalances({ userId: result.userData._id });
                    if (balances.status) {
                        dispatch({ type: 'SET_BALANCEDATA', data: balances.data.data });
                    }

                    addToast('Google login successful!', { appearance: 'success', autoDismiss: true });
                } else {
                    addToast(result.message || 'Google login failed.', { appearance: 'error', autoDismiss: true });
                }
            } catch (error) {
                addToast('Error: ' + error.message, { appearance: 'error', autoDismiss: true });
            } finally {
                setIsLoading(false);
            }
        },
        onError: (error) => {
            addToast('Google login failed: ' + error.message, { appearance: 'error', autoDismiss: true });
        }
    });

    // ==================== PROFILE SETUP ====================
    const handleNicknameChange = (e) => {
        const value = e.target.value;
        setUserNickName(value);
        if (nicknameError) setNicknameError('');
    };

    const handleProfileSubmit = async () => {
        if (!ValidationService.isValidUsername(userNickName)) {
            setNicknameError('Username must be 3-20 characters (letters, numbers, _ or -)');
            return;
        }

        setIsLoading(true);
        try {
            const response = await updateProfileSet({
                userId: authData.userData._id,
                userNickName
            });

            if (response.status) {
                dispatch({ type: 'SET_USERDATA', data: response.userData });
                setCurrentStep(AUTH_STEPS.SUCCESS);
                addToast('Profile set successfully!', { appearance: 'success', autoDismiss: true });
            } else {
                setNicknameError(response.message || 'Failed to set profile.');
            }
        } catch (error) {
            setNicknameError('Error: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ==================== RENDER STEPS ====================
    const renderLoginChoice = () => (
        <>
            <div className={classes.ModalLogoBox}>
                <img src="/logo.png" alt="Logo" />
            </div>
            <div className={classes.Title}>Sign In or Register</div>
            {googleClientId && (
                <Button
                    className={clsx(classes.Button, classes.PrimaryButton)}
                    onClick={googleLogin}
                    disabled={isLoading}
                >
                    <GoogleIcon style={{ width: '20px', height: '20px' }} />
                    Continue with Google
                </Button>
            )}

            <div className={classes.ORBox}>OR</div>

            <div className={classes.Title} style={{ fontSize: '16px', marginBottom: '15px' }}>
                Connect with Wallet
            </div>
            <div className={classes.WalletConnectBox}>
                <IconButton
                    className={classes.WalletIcon}
                    onClick={() => handleWalletConnect('metamask')}
                    disabled={isLoading}
                    title="Connect MetaMask"
                >
                    <img src={MetamaskIcon} alt="MetaMask" />
                </IconButton>
                <IconButton
                    className={classes.WalletIcon}
                    disabled={isLoading}
                    title="Connect WalletConnect (coming soon)"
                >
                    <img src={WalletConnectIcon} alt="WalletConnect" style={{ opacity: 0.5 }} />
                </IconButton>
                <IconButton
                    className={classes.WalletIcon}
                    disabled={isLoading}
                    title="Connect Coinbase (coming soon)"
                >
                    <img src={CoinBaseIcon} alt="Coinbase" style={{ opacity: 0.5 }} />
                </IconButton>
            </div>

            <div className={classes.ORBox}>OR</div>

            <Button
                className={clsx(classes.Button, classes.SecondaryButton)}
                onClick={() => setCurrentStep(AUTH_STEPS.EMAIL_INPUT)}
                disabled={isLoading}
            >
                Continue with Email
            </Button>
        </>
    );

    const renderEmailInput = () => (
        <>
            <div className={classes.ModalLogoBox}>
                <img src="/logo.png" alt="Logo" />
            </div>
            <div className={classes.Title}>Enter Your Email</div>
            <div className={classes.InputBox}>
                <input
                    type="email"
                    className={classes.Input}
                    placeholder="your@email.com"
                    value={emailAddress}
                    onChange={handleEmailInputChange}
                    disabled={isLoading}
                />
                {emailError && <div className={classes.ErrorText}>{emailError}</div>}
            </div>

            <Button
                className={clsx(classes.Button, classes.PrimaryButton)}
                onClick={handleEmailSubmit}
                disabled={isLoading}
            >
                {isLoading ? <CircularProgress size={20} /> : 'Send Verification Code'}
            </Button>

            <Button
                className={clsx(classes.Button, classes.SecondaryButton)}
                onClick={() => setCurrentStep(AUTH_STEPS.LOGIN_CHOICE)}
                disabled={isLoading}
            >
                Back
            </Button>
        </>
    );

    const renderEmailCode = () => (
        <>
            <div className={classes.ModalLogoBox}>
                <img src="/logo.png" alt="Logo" />
            </div>
            <div className={classes.Title}>Verify Your Email</div>
            <div style={{ marginBottom: '15px', color: '#999', textAlign: 'center' }}>
                We've sent a code to {emailAddress}
            </div>

            <div className={classes.CodeInput}>
                <ReactCodeInput value={verifyCode} onChange={handleCodeChange} />
            </div>
            {codeError && <div className={classes.ErrorText}>{codeError}</div>}

            <Button
                className={clsx(classes.Button, classes.PrimaryButton)}
                onClick={handleCodeSubmit}
                disabled={isLoading}
            >
                {isLoading ? <CircularProgress size={20} /> : 'Verify'}
            </Button>

            <div style={{ textAlign: 'center', fontSize: '14px', color: '#999' }}>
                Didn't receive a code?{' '}
                <button
                    className={classes.LinkButton}
                    onClick={() => {
                        setCurrentStep(AUTH_STEPS.EMAIL_INPUT);
                        handleEmailSubmit();
                    }}
                    disabled={isLoading}
                >
                    Resend
                </button>
            </div>
        </>
    );

    const renderProfileSetup = () => (
        <>
            <div className={classes.ModalLogoBox}>
                <img src="/logo.png" alt="Logo" />
            </div>
            <div className={classes.Title}>Complete Your Profile</div>

            <div className={classes.InputBox}>
                <input
                    type="text"
                    className={classes.Input}
                    placeholder="Choose a username (3-20 characters)"
                    value={userNickName}
                    onChange={handleNicknameChange}
                    disabled={isLoading}
                />
                {nicknameError && <div className={classes.ErrorText}>{nicknameError}</div>}
            </div>

            <Button
                className={clsx(classes.Button, classes.PrimaryButton)}
                onClick={handleProfileSubmit}
                disabled={isLoading}
            >
                {isLoading ? <CircularProgress size={20} /> : 'Complete Profile'}
            </Button>
        </>
    );

    const renderSuccess = () => (
        <>
            <div className={classes.ModalLogoBox}>
                <img src="/logo.png" alt="Logo" />
            </div>
            <div className={classes.Title}>✓ Welcome!</div>
            <div style={{ color: '#4ade80', textAlign: 'center' }}>
                You're all set. Redirecting...
            </div>
        </>
    );

    return (
        <Modal
            open={open}
            onClose={handleClose}
            slotProps={{ backdrop: { sx: { backdropFilter: 'blur(5px)', background: 'rgba(0, 0, 0, 0.7)' } } }}
        >
            <Box className={classes.ModalBox}>
                <IconButton className={classes.ModalCloseButton} onClick={handleClose}>
                    <Close />
                </IconButton>
                <Box className={classes.ModalBodyBox}>
                    {currentStep === AUTH_STEPS.LOGIN_CHOICE && renderLoginChoice()}
                    {currentStep === AUTH_STEPS.EMAIL_INPUT && renderEmailInput()}
                    {currentStep === AUTH_STEPS.EMAIL_CODE && renderEmailCode()}
                    {currentStep === AUTH_STEPS.PROFILE_SETUP && renderProfileSetup()}
                    {currentStep === AUTH_STEPS.SUCCESS && renderSuccess()}
                </Box>
            </Box>
        </Modal>
    );
};

export default AuthModal;
