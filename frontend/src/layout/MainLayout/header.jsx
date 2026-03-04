import { makeStyles } from "@mui/styles";
import { Box, Button, IconButton, Typography } from "@mui/material";
import AuthenticationModal from "views/main/modals/AuthModal";
import WalletDepositModal from "views/main/modals/WalletDepositModal";
import clsx from "clsx";
import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";

import { ReactComponent as AlarmIcon } from "assets/icons/AlarmIcon.svg";
import { ReactComponent as ChatIcon } from "assets/icons/ChatIcon.svg";
import { ReactComponent as SystemMessageIcon } from "assets/icons/MessageIcon.svg";
import { ReactComponent as ProfileIcon } from "assets/icons/ProfileIcon.svg";
import { ReactComponent as StarIcon } from "assets/icons/StarIcon.svg";
import { ReactComponent as MobileWalletIcon } from "assets/icons/mobile-wallet.svg";
import ProfileWidget from "views/main/pages/profile";
import ChatWidget from "views/main/pages/chat";
import SignoutModal from "views/main/modals/SignoutModal";
import UserSetting from "views/main/pages/userSetting";
import MenuModal from "views/main/modals/MenuModal";
import LevelModal from "views/main/modals/LevelModal";
import MessageIcon from "assets/icons/chaticon.png";
import FreeSpinModal from "views/main/modals/FreeSpinModal";
import { updateCurrency } from "redux/actions/auth";
import { useToasts } from "react-toast-notifications";
import SettingModal from "views/main/modals/SettingModal";
import FairModal from "views/main/modals/FairModal";
import { getCurrencies } from "redux/actions/payment";
import PrivacyModal from "views/main/modals/PrivacyModal";

// load Tawk.to chat globally
function loadTawkScript() {
    if (window.Tawk_API) return; // already loaded
    var Tawk_API = window.Tawk_API || {}, Tawk_LoadStart = new Date();
    (function(){
        var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
        s1.async=true;
        s1.src='https://embed.tawk.to/69a7166f7b02b21c3601dcb1/1jiqav9pg';
        s1.charset='UTF-8';
        s1.setAttribute('crossorigin','*');
        s0.parentNode.insertBefore(s1,s0);
    })();
}

const useStyles = makeStyles(() => ({
    MainHeaderBox: {
        width: '100%',
        padding: '30px 50px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        background: '#1f1e25',
        zIndex: '10',
        "@media (max-width: 681px)": {
            padding: '8px 14px'
        }
    },
    LogoBox: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '21px'
    },
    LogoIcon: {
        width: '120px',
        height: 'auto',
        "@media (max-width: 1024px)": {
            display: 'none'
        },
        "@media (max-width: 681px)": {
            display: 'block',
            width: '100px',
            height: 'auto'
        }
    },
    MenuIconButton: {
        color: '#FFF',
        background: 'transparent',
        width: '26px',
        height: '16px',
        "@media (max-width: 681px)": {
            display: 'none'
        }
    },
    MobileMenuIconButton: {
        display: 'none',
        "@media (max-width: 681px)": {
            display: 'block',
            width: '50px',
            height: '47px'
        }
    },
    LoginBox: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        gap: "5px"
    },
    HeaderButton: {
        padding: '0px 1rem',
        borderRadius: '0.5rem',
        height: '40px',
        "&>span": {
            textTransform: 'uppercase',
            fontWeight: '600',
            fontSize: '14px',
            "@media (max-width: 764px)": {
                fontSize: '12px'
            }
        }
    },
    CustomizeButton: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        padding: "14px 23px",
        gap: "10px",
        width: "115px",
        height: "47px",
        background: "#2C2C3A",
        border: "1px solid #363646",
        borderRadius: "8px",
        color: '#FFF',
        "@media (max-width: 560px)": {
            display: 'none'
        }
    },
    SignInButton: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        padding: "14px 23px",
        gap: "10px",
        width: "115px",
        height: "47px",
        background: "#2C2C3A",
        border: "1px solid #363646",
        borderRadius: "8px",
        color: '#FFF',
        "@media (max-width: 764px)": {
            width: '50px',
            minWidth: '50px',
            padding: '0px'
        }
    },
    RegisterButton: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        padding: "14px 23px",
        gap: "10px",
        width: "115px",
        height: "47px",
        background: "linear-gradient(48.57deg, #5A45D1 24.42%, #BA6AFF 88.19%)",
        borderRadius: "8px",
        color: '#FFF',
        "@media (max-width: 764px)": {
            display: 'none'
        }
    },
    ChatButton: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
        width: "50px",
        height: "47px",
        background: "#2C2C3A",
        border: "1px solid #363646",
        borderRadius: "8px",
        padding: '0px',
        "@media (max-width: 764px)": {
            display: 'none'
        }
    },
    ProfileButton: {
        borderRadius: '50%',
        background: '#282836',
        padding: '0px',
        width: "50px",
        height: "47px"
    },
    HeaderMiddleBox: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        "@media (max-width: 850px)": {
            // display: 'none'
        }
    },
    WalletButton: {
        background: "linear-gradient(48.57deg, #5A45D1 24.42%, #BA6AFF 88.19%)",
        borderRadius: "8px",
        color: "#FFF",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        padding: "14px 23px",
        gap: "10px",
        width: "115px",
        height: "47px",
        "&:disabled": {
            color: 'rgba(255, 255, 255, 150)',
            opacity: '0.5'
        },
        "@media (max-width: 681px)": {
            display: 'none'
        }
    },
    MobileWalletButton: {
        display: 'none',
        width: '50px',
        height: '47px',
        "@media (max-width: 681px)": {
            display: 'block'
        }
    },

    LevelIconBox: {
        position: 'absolute',
        right: '0px',
        bottom: '0px',
        width: '18.7px',
        height: '18.7px',
        borderRadius: '50%',
        background: '#1F1E25',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    DemoBadge: {
        position: 'absolute',
        left: 20,
        top: 12,
        background: 'linear-gradient(90deg, #5A45D1 0%, #BA6AFF 100%)',
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '800',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 6px 20px rgba(90,69,209,0.18)',
        zIndex: 12
    },
    WalletDropdown: {
        position: 'absolute',
        top: '58px',
        right: '0px',
        background: 'linear-gradient(135deg, rgba(90, 69, 209, 0.35) 0%, rgba(186, 106, 255, 0.25) 100%)',
        border: '3px solid rgba(186, 106, 255, 0.8)',
        padding: '28px 24px',
        borderRadius: '16px',
        width: '480px',
        boxShadow: '0 40px 100px rgba(90, 69, 209, 0.8), inset 0 1px 0 rgba(255,255,255,0.3)',
        zIndex: 50,
        backdropFilter: 'blur(20px)',
        '@media (max-width: 1024px)': {
            width: '420px'
        },
        '@media (max-width: 681px)': {
            position: 'fixed',
            top: 'auto',
            bottom: '0px',
            left: '0px',
            right: '0px',
            width: '100%',
            borderRadius: '24px 24px 0px 0px',
            padding: '24px 16px 32px',
            maxHeight: '70vh',
            overflowY: 'auto',
            boxShadow: '0 -20px 60px rgba(90, 69, 209, 0.8)'
        }
    },
    BalanceRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '22px 18px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)',
        borderRadius: '12px',
        marginBottom: '16px',
        border: '2px solid rgba(186, 106, 255, 0.5)',
        transition: 'all 0.3s ease',
        '&:hover': {
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.06) 100%)',
            border: '2px solid rgba(186, 106, 255, 0.7)',
            boxShadow: '0 12px 32px rgba(186, 106, 255, 0.35)',
            transform: 'translateY(-2px)'
        },
        '@media (max-width: 681px)': {
            padding: '16px 12px',
            marginBottom: '12px',
            borderRadius: '10px'
        }
    },
    BalanceLabel: {
        color: '#D0D0D0',
        fontSize: '16px',
        fontWeight: 700,
        letterSpacing: '0.8px',
        textTransform: 'uppercase',
        '@media (max-width: 681px)': {
            fontSize: '13px',
            letterSpacing: '0.5px'
        }
    },
    BalanceValue: {
        color: '#FFF',
        fontWeight: 900,
        fontSize: '32px',
        background: 'linear-gradient(90deg, #FFD700 0%, #BA6AFF 50%, #5A45D1 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
        letterSpacing: '0.5px',
        '@media (max-width: 681px)': {
            fontSize: '22px'
        }
    },
    ProfileBox: {
        position: 'absolute',
        right: '0px',
        top: '90px'
    },
    ChatBox: {
        position: 'absolute',
        right: '0px',
        top: '90px'
    },
    UserSettingBox: {
        position: 'absolute',
        right: '0px',
        top: '90px',
        zIndex: '3'
    }
}));

let signoutModal = false;

const MainHeader = () => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const { addToast } = useToasts();

    const modalOption = useSelector((state) => state.modalOption);
    // ensure we always have an object for authentication slice
    const authData = useSelector((state) => state.authentication || {});
    const currencyData = useSelector((state) => state.currencyOption || { currencies: [] });
    const currencies = currencyData.currencies || [];

    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [signoutModalOpen, setSignoutModalOpen] = useState(false);
    const [menuModal, setMenuModal] = useState(false);
    const walletModalOpen = modalOption.walletModal;
    const levelModalOpen = modalOption.levelModal;
    const spinModalOpen = modalOption.spinModal;
    const settingModalOpen = modalOption.settingModal;
    const fairModalOpen = modalOption.fairModal;
    const privacyModalOpen = modalOption.privacyModal;

    const [authType, setAuthType] = useState(0);
    const currency = authData?.isAuth ? authData.userData?.currency : '';

    // Wallet modal state
    const walletDepositModalOpen = walletModalOpen;

    const DEMO_MODE = process.env.REACT_APP_DEMO_MODE === 'true';

    const [profileMenu, setProfileMenu] = useState(false);
    const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
    const walletBtnRef = useRef();
    const [chatPage, setChatPage] = useState(false);
    const [userSetting, setUserSetting] = useState(false);

    const profileButtonRef = useRef();
    const profileWidgetRef = useRef();

    const userSettingRef = useRef();

    const chatButtonRef = useRef();
    const chatWidgetRef = useRef();

    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        getCurrencyData();

        return () => {
            document.removeEventListener('click', handleClickOutside);
        }
        // eslint-disable-next-line
    }, []);

    // Monitor auth state changes
    useEffect(() => {
        console.log('👀 Header watching authData changes:', {
            isAuth: authData?.isAuth,
            hasUserData: !!authData?.userData,
            balanceDataCount: authData?.balanceData ? Object.keys(authData.balanceData).length : 0,
            userData_id: authData?.userData?._id
        });
        console.log('📱 Full authData object:', authData);
    }, [authData?.isAuth, authData?.userData, authData?.balanceData]);

    // Monitor modal state
    useEffect(() => {
        console.log('🔧 authModalOpen changed to:', authModalOpen);
    }, [authModalOpen]);

    useEffect(() => {
        if (authType !== 0)
            setAuthModalOpen(true);
        // eslint-disable-next-line
    }, [authType]);

    useEffect(() => {
        if (!authModalOpen)
            setAuthType(0);
        // eslint-disable-next-line
    }, [authModalOpen]);

    useEffect(() => {
        setTimeout(() => {
            signoutModal = signoutModalOpen;
        }, 100)
        // eslint-disable-next-line
    }, [signoutModalOpen]);

    const getCurrencyData = async () => {
        const response = await getCurrencies();
        if (response.status) {
            let data = [];
            // eslint-disable-next-line
            response.data.map((item) => {
                data.push({
                    name: item.currencyName,
                    fullName: item.fullName,
                    decimal: item.decimal,
                    token: item.token,
                    withdrawable: item.withdrawable,
                    swapable: item.swapable
                });
            });
            dispatch({ type: 'SET_CURRENCIES', data: data });
        }
    }

    const handleClickOutside = (e) => {
        if (signoutModal) return;
        if (profileWidgetRef.current && !profileWidgetRef.current.contains(e.target)) {
            if (profileButtonRef.current && !profileButtonRef.current.contains(e.target)) {
                setProfileMenu(false);
            }
        }
        if (chatWidgetRef.current && !chatWidgetRef.current.contains(e.target)) {
            if (chatButtonRef.current && !chatButtonRef.current.contains(e.target)) {
                setChatPage(false);
            }
        }
        // Close wallet dropdown on mobile when clicking outside
        if (walletBtnRef.current && !walletBtnRef.current.contains(e.target)) {
            setWalletDropdownOpen(false);
        }
    };

    const setLevelModalOpen = (flag) => {
        dispatch({ type: 'SET_LEVEL_MODAL', data: flag });
    };

    const setSpinModalOpen = (flag) => {
        dispatch({ type: 'SET_SPIN_MODAL', data: flag });
    };

    const setSettingModalOpen = (flag) => {
        dispatch({ type: 'SET_SETTING_MODAL', data: flag });
    };

    const setFairModalOpen = (flag) => {
        dispatch({ type: 'SET_FAIR_MODAL', data: flag });
    };

    const setPrivacyModalOpen = (flag) => {
        dispatch({ type: 'SET_PRIVACY_MODAL', data: flag });
    };

    const handleLogin = () => {
        setAuthType(1);
    };

    const handleRegister = () => {
        setAuthType(2);
    };

    const setWalletModalOpen = (flag) => {
        dispatch({ type: 'SET_WALLET_MODAL', data: flag });
    };

    const handleWalletOpen = () => {
        setWalletModalOpen(true);
    };

    const handleMenuCollape = () => {
        // dispatch({ type: 'SET_MENUVISIBLE', data: !menuOption.menuVisible });
    };

    const handleChatVisible = () => {
        setChatPage(!chatPage);
    };

    const handleCurrency = (e) => {
        updatePlayerCurrency(e.target.value);
    };

    const handleProfileMenu = () => {
        setProfileMenu(!profileMenu);
    };

    const handleUserSetting = (flag) => {
        setUserSetting(flag);
        if (flag) setProfileMenu(false);
    };

    const handleMobileMenu = (flag) => {
        setMenuModal(true);
    };

    const updatePlayerCurrency = async (newCurrency) => {
        if (authData?.isAuth) {
            const request = {
                userId: authData?.userData?._id,
                currency: JSON.parse(newCurrency),
            };
            const response = await updateCurrency(request);
            if (response.status) {
                dispatch({ type: 'SET_USERDATA', data: response.data });
            }
            else {
                addToast(response.message, { appearance: 'error', autoDismiss: true });
            }
        }
        else {
            addToast('Please login and try again', { appearance: 'warning', autoDismiss: true });
        }
    };

    return (
        <header className={classes.MainHeaderBox}>
            <Box className={classes.LogoBox}>
                {/* <IconButton className={classes.MenuIconButton} onClick={handleMenuCollape}>
                    <MenuCollapeIcon />
                </IconButton> */}
                {/* <IconButton className={classes.MobileMenuIconButton} onClick={handleMobileMenu}>
                    <MobileMenuCollapeIcon />
                </IconButton> */}
                {/* <LogoIcon className={classes.LogoIcon} /> */}
                <img src="/logo.png" className={classes.LogoIcon} alt="Logo" />
                {process.env.REACT_APP_DEMO_MODE === 'true' && (
                    <Box className={classes.DemoBadge}>
                        🎮 DEMO MODE
                    </Box>
                )}
            </Box>
            <Box className={classes.HeaderMiddleBox}>
                <Box style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Box ref={walletBtnRef} onMouseEnter={() => {
                        // Only use hover on non-touch devices (desktop)
                        if (!window.matchMedia('(hover: hover)').matches) return;
                        setWalletDropdownOpen(true);
                    }} onMouseLeave={() => {
                        if (!window.matchMedia('(hover: hover)').matches) return;
                        setWalletDropdownOpen(false);
                    }} onClick={() => {
                        // On mobile, toggle on click
                        setWalletDropdownOpen(!walletDropdownOpen);
                    }} sx={{ position: 'relative' }}>
                        <Button className={clsx(classes.HeaderButton, classes.WalletButton)} disabled={!authData?.isAuth} onClick={handleWalletOpen}>
                            <span>Wallet</span>
                        </Button>
                        <IconButton className={classes.MobileWalletButton} disabled={!authData.isAuth} onClick={handleWalletOpen}>
                            <MobileWalletIcon />
                        </IconButton>

                        {walletDropdownOpen && authData?.isAuth && (
                            <Box className={classes.WalletDropdown} sx={{ right: 0 }}>
                                <Box className={classes.BalanceRow}>
                                    <span className={classes.BalanceLabel}>Fiat Balance</span>
                                    <span className={classes.BalanceValue}>{(authData.userData && (authData.userData.balance || authData.userData.balance === 0)) ? Number(authData.userData.balance).toFixed(2) : '0.00'}</span>
                                </Box>
                                <Box className={classes.BalanceRow}>
                                    <span className={classes.BalanceLabel}>Chips Balance</span>
                                    <span className={classes.BalanceValue}>{(() => {
                                        try {
                                            if (!authData.userData) return '0.00';
                                            // show demo or real chips depending on mode
                                            if (authData.userData.demoMode && typeof authData.userData.demoChipsBalance === 'number') {
                                                return Number(authData.userData.demoChipsBalance).toFixed(2);
                                            }
                                            if (!authData.userData.demoMode && typeof authData.userData.chipsBalance === 'number') {
                                                return Number(authData.userData.chipsBalance).toFixed(2);
                                            }
                                            return '0.00';
                                        } catch (e) {
                                            return '0.00';
                                        }
                                    })()}</span>
                                </Box>
                                <Box className={classes.BalanceRow}>
                                    <span className={classes.BalanceLabel}>Crypto Balance</span>
                                    <span className={classes.BalanceValue}>{(() => {
                                        try {
                                            const balances = authData.balanceData || [];
                                            const cryptoSum = balances.reduce((acc, b) => {
                                                if (!b) return acc;
                                                // exclude native fiat tokens
                                                if (b.type && b.type === 'native') return acc;
                                                const val = parseFloat(b.balance || 0);
                                                return acc + (isNaN(val) ? 0 : val);
                                            }, 0);
                                            return cryptoSum.toFixed(6);
                                        } catch (e) {
                                            return '0.000000';
                                        }
                                    })()}</span>
                                </Box>
                                <Box sx={{ mt: 3, pt: 3, borderTop: '2px solid rgba(90, 69, 209, 0.2)', display: 'flex', gap: 2 }}>
                                    <Button fullWidth variant="contained" onClick={handleWalletOpen} sx={{ background: 'linear-gradient(135deg, #5A45D1 0%, #BA6AFF 100%)', fontWeight: 800, fontSize: '15px', padding: '16px 20px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', '&:hover': { boxShadow: '0 15px 40px rgba(90, 69, 209, 0.5)', transform: 'translateY(-2px)' }, transition: 'all 0.3s ease' }}>💼 Manage Wallet</Button>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
            <Box className={classes.LoginBox}>
                {
                    !authData.isAuth &&
                    <Button className={clsx(classes.HeaderButton, classes.SignInButton)} onClick={handleLogin}>
                        <span>Sign In</span>
                    </Button>
                }
                {
                    !authData.isAuth &&
                    <Button className={clsx(classes.HeaderButton, classes.RegisterButton)} onClick={handleRegister}>
                        <span>Register</span>
                    </Button>
                }
                {
                    !authData.isAuth &&
                    <IconButton className={clsx(classes.HeaderButton, classes.ChatButton)} onClick={handleChatVisible}>
                        <img src={MessageIcon} alt="icon" width="38px" height="27px" />
                    </IconButton>
                }
                <Button className={clsx(classes.HeaderButton, classes.CustomizeButton)}>
                    <span>Uniswap</span>
                </Button>
                <Button className={clsx(classes.HeaderButton, classes.CustomizeButton)}>
                    <span>Dextools</span>
                </Button>
                {
                    authData.isAuth &&
                    <>
                        <IconButton className={clsx(classes.HeaderButton, classes.ChatButton)}>
                            <AlarmIcon />
                        </IconButton>
                        <IconButton ref={chatButtonRef} className={clsx(classes.HeaderButton, classes.ChatButton)} onClick={handleChatVisible}>
                            <ChatIcon />
                        </IconButton>
                        <IconButton className={clsx(classes.HeaderButton, classes.ChatButton)}>
                            <SystemMessageIcon />
                        </IconButton>
                        <IconButton ref={profileButtonRef} className={clsx(classes.HeaderButton, classes.ProfileButton)} onClick={handleProfileMenu}>
                            <ProfileIcon />
                            <Box className={classes.LevelIconBox}>
                                <StarIcon />
                            </Box>
                        </IconButton>

                    </>
                }
                {
                    profileMenu &&
                    <Box className={classes.ProfileBox} ref={profileWidgetRef}>
                        <ProfileWidget
                            closeProfileMenu={() => setProfileMenu(false)}
                            setSignoutModal={setSignoutModalOpen}
                            handleUserSetting={handleUserSetting}
                            userSettingRef={userSettingRef}
                        />
                    </Box>
                }
                {
                    chatPage &&
                    <Box className={classes.ChatBox} ref={chatWidgetRef}>
                        <ChatWidget />
                    </Box>
                }
                {
                    userSetting &&
                    <Box className={classes.UserSettingBox} ref={userSettingRef}>
                        <UserSetting setUserSetting={setUserSetting} />
                    </Box>
                }
            </Box>
            <AuthenticationModal open={authModalOpen} setOpen={setAuthModalOpen} authType={authType} />
                        {DEMO_MODE && (
                            <Box sx={{ position: 'absolute', left: 20, top: 16 }}>
                                <Typography sx={{ color: '#FFD54F', fontWeight: 800, background: 'rgba(255, 213, 79, 0.08)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255, 213, 79, 0.15)' }}>DEMO MODE</Typography>
                            </Box>
                        )}
            <WalletDepositModal
              open={walletDepositModalOpen}
              onClose={() => setWalletModalOpen(false)}
            />
            <SignoutModal open={signoutModalOpen} setOpen={setSignoutModalOpen} />
            <MenuModal open={menuModal} setOpen={setMenuModal} />
            <LevelModal open={levelModalOpen} setOpen={setLevelModalOpen} />
            <FreeSpinModal open={spinModalOpen} setOpen={setSpinModalOpen} />
            <SettingModal open={settingModalOpen} setOpen={setSettingModalOpen} />
            <FairModal open={fairModalOpen} setOpen={setFairModalOpen} />
            <PrivacyModal open={privacyModalOpen} setOpen={setPrivacyModalOpen} />
        </header>
    )
}

export default MainHeader;