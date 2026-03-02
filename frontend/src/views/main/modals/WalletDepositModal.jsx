import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Modal, Box, IconButton, Typography, TextField, Button, Alert, Tabs, Tab, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, Divider, FormControl, InputLabel, Select, MenuItem, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';
import ReceiptIcon from '@mui/icons-material/Receipt';
import StarIcon from '@mui/icons-material/Star';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';
import CryptoDepositModal from './CryptoDepositModal';
import CryptoWithdrawModal from './CryptoWithdrawModal';
import { fetchDemoBalance } from '../../../redux/walletSlice';

// Add CSS animations - inject only once
if (!document.getElementById('wallet-modal-animations')) {
  const pulseStyle = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.15); }
      100% { transform: scale(1); }
    }
  `;
  const styleSheet = document.createElement("style");
  styleSheet.id = 'wallet-modal-animations';
  styleSheet.textContent = pulseStyle;
  document.head.appendChild(styleSheet);
}

const DEMO_MODE = process.env.REACT_APP_DEMO_MODE === 'true';

const modalBoxStyle = {
  marginTop: '60px',
  width: '900px',
  left: '50%',
  transform: 'translate(-50%)',
  background: 'linear-gradient(135deg, #1f1e25 0%, #2a2935 100%)',
  position: 'relative',
  borderRadius: '20px',
  padding: '0px',
  maxHeight: '90vh',
  overflow: 'hidden',
  boxShadow: '0 20px 60px rgba(90, 69, 209, 0.3)',
  border: '1px solid rgba(90, 69, 209, 0.2)'
};

const headerStyle = {
  background: 'linear-gradient(90deg, #5A45D1 0%, #BA6AFF 100%)',
  padding: '24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
};

const tabsContainerStyle = {
  background: 'rgba(0, 0, 0, 0.3)',
  borderBottom: '2px solid rgba(90, 69, 209, 0.3)',
  '& .MuiTabs-indicator': {
    background: 'linear-gradient(90deg, #FFD700 0%, #FF9800 100%)',
    height: 4,
    borderRadius: '2px',
    boxShadow: '0 0 15px rgba(255, 215, 0, 0.5)'
  },
  '& .MuiTab-root': {
    color: '#999',
    fontSize: '14px',
    fontWeight: 600,
    textTransform: 'uppercase',
    transition: 'all 0.3s ease',
    '&.Mui-selected': {
      color: '#FFD700',
      fontWeight: 900,
      textShadow: '0 0 10px rgba(255, 215, 0, 0.3)'
    },
    '&:hover': {
      color: '#FFC107'
    }
  }
};

const contentStyle = {
  padding: '24px',
  color: '#fff',
  maxHeight: 'calc(90vh - 180px)',
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: '8px'
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0, 0, 0, 0.1)'
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(90, 69, 209, 0.5)',
    borderRadius: '4px',
    '&:hover': {
      background: 'rgba(90, 69, 209, 0.7)'
    }
  }
};

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    color: '#fff',
    '& fieldset': {
      borderColor: 'rgba(90, 69, 209, 0.3)'
    },
    '&:hover fieldset': {
      borderColor: 'rgba(90, 69, 209, 0.5)'
    },
    '&.Mui-focused fieldset': {
      borderColor: '#BA6AFF',
      boxShadow: '0 0 10px rgba(186, 106, 255, 0.3)'
    }
  },
  '& .MuiInputBase-input::placeholder': {
    color: '#666',
    opacity: 0.7
  },
  '& .MuiInputLabel-root': {
    color: '#999',
    '&.Mui-focused': {
      color: '#BA6AFF'
    }
  }
};

const buttonStyle = {
  textTransform: 'uppercase',
  fontWeight: 600,
  fontSize: '12px',
  borderRadius: '8px',
  padding: '10px 24px',
  transition: 'all 0.3s ease'
};

const primaryButtonStyle = {
  ...buttonStyle,
  background: 'linear-gradient(90deg, #5A45D1 0%, #BA6AFF 100%)',
  color: '#fff',
  '&:hover': {
    background: 'linear-gradient(90deg, #6B54E8 0%, #C77DFF 100%)',
    boxShadow: '0 10px 20px rgba(90, 69, 209, 0.4)'
  },
  '&:disabled': {
    background: '#444',
    color: '#666'
  }
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: 'rgba(90, 69, 209, 0.2)',
  color: '#BA6AFF',
  border: '1px solid #BA6AFF',
  '&:hover': {
    background: 'rgba(90, 69, 209, 0.3)',
    boxShadow: '0 5px 15px rgba(186, 106, 255, 0.2)'
  }
};

const formCardStyle = {
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(90, 69, 209, 0.2)',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '16px'
};

export default function WalletDepositModal({ open, onClose }) {  const API_URL = process.env.REACT_APP_API_URL || '';  const auth = useSelector((s) => s.authentication);
  const userId = auth?.userData?._id;

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [history, setHistory] = useState([]);

  // Fiat fields
  const [fiatAmount, setFiatAmount] = useState('');
  const [fiatCurrency, setFiatCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Crypto fields
  const [coin, setCoin] = useState('ETH');
  const [address, setAddress] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [generatedAddress, setGeneratedAddress] = useState('');

  // Withdraw fields
  const [withdrawType, setWithdrawType] = useState('crypto'); // 'crypto' or 'fiat'
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawCoin, setWithdrawCoin] = useState('ETH');
  const [withdrawEmail, setWithdrawEmail] = useState('');
  
  // Fiat withdraw fields
  const [fiatWithdrawAmount, setFiatWithdrawAmount] = useState('');
  const [fiatWithdrawCurrency, setFiatWithdrawCurrency] = useState('USD');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const dispatch = useDispatch();
  const wallet = useSelector(state => state.wallet);
  
  // USDT/Blockonomics modal
  const [usdtModalOpen, setUsdtModalOpen] = useState(false);
  const [usdtWithdrawOpen, setUsdtWithdrawOpen] = useState(false);


  useEffect(() => {
    if (open && tab === 3) {
      loadHistory();
    }
    if (open && tab === 4) {
      // fetch demo balance when the Demo Balance tab is shown
      if (userId) dispatch(fetchDemoBalance(userId));
    }
  }, [open, tab]);

  useEffect(() => {
    if (auth?.userData?.email) {
      setEmail(auth.userData.email);
      setWithdrawEmail(auth.userData.email);
    }
  }, [auth?.userData?.email]);

  const handleClose = () => {
    setMessage(null);
    setFiatAmount('');
    setCryptoAmount('');
    setAddress('');
    setWithdrawAmount('');
    setWithdrawAddress('');
    setFiatWithdrawAmount('');
    setAccountNumber('');
    setBankName('');
    setWithdrawType('crypto');
    setTab(0);
    onClose && onClose();
  };

  const loadHistory = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/v0/payments/fiat/transactions/${userId}`);
      setHistory(res.data || []);
    } catch (err) {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFiat = async () => {
    setMessage(null);
    if (!userId) return setMessage({ type: 'error', text: '❌ Please sign in' });
    if (!fiatAmount) return setMessage({ type: 'error', text: '❌ Enter amount' });
    if (!fullName) return setMessage({ type: 'error', text: '❌ Enter full name' });
    if (!email) return setMessage({ type: 'error', text: '❌ Enter email' });
    if (!paymentMethod) return setMessage({ type: 'error', text: '❌ Select payment method' });
    
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/v0/payments/fiat/deposit`, {
        userId,
        amount: parseFloat(fiatAmount),
        currency: fiatCurrency,
        paymentMethod,
        fullName,
        email,
        isDemo: DEMO_MODE
      });
      setMessage({ type: 'success', text: '✅ ' + (res.data.message || 'Deposit created successfully') });
      setFiatAmount('');
      setFullName('');
    } catch (err) {
      setMessage({ type: 'error', text: '❌ ' + (err?.response?.data?.message || err.message) });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAddress = async () => {
    setMessage(null);
    if (!userId) return setMessage({ type: 'error', text: '❌ Please sign in' });
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/v0/payments/crypto/generate-address`, {
        userId,
        coinType: coin,
        isDemo: DEMO_MODE
      });
      const addr = res.data.address || res.data.depositAddress || '';
      setGeneratedAddress(addr);
      setAddress(addr);
      setMessage({ type: 'success', text: '✅ Address generated successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: '❌ ' + (err?.response?.data?.message || err.message) });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateDeposit = async () => {
    setMessage(null);
    if (!userId) return setMessage({ type: 'error', text: '❌ Please sign in' });
    if (!generatedAddress) return setMessage({ type: 'error', text: '❌ Generate address first' });
    if (!cryptoAmount) return setMessage({ type: 'error', text: '❌ Enter amount' });
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/v0/payments/crypto/simulate-deposit`, {
        userId,
        address: generatedAddress,
        amount: parseFloat(cryptoAmount),
        coinType: coin
      });
      setMessage({ type: 'success', text: '✅ ' + (res.data.message || 'Simulated deposit successfully') });
      setCryptoAmount('');
    } catch (err) {
      setMessage({ type: 'error', text: '❌ ' + (err?.response?.data?.message || err.message) });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setMessage(null);
    if (!userId) return setMessage({ type: 'error', text: '❌ Please sign in' });
    if (!withdrawAmount || !withdrawAddress) return setMessage({ type: 'error', text: '❌ Fill all required fields' });
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/v0/payments/crypto/withdraw`, {
        userId,
        coinType: withdrawCoin,
        amount: parseFloat(withdrawAmount),
        address: withdrawAddress,
        email: withdrawEmail
      });
      setMessage({ type: 'success', text: '✅ ' + (res.data.message || 'Withdrawal initiated successfully') });
      setWithdrawAmount('');
      setWithdrawAddress('');
    } catch (err) {
      setMessage({ type: 'error', text: '❌ ' + (err?.response?.data?.message || err.message) });
    } finally {
      setLoading(false);
    }
  };

  const handleFiatWithdraw = async () => {
    setMessage(null);
    if (!userId) return setMessage({ type: 'error', text: '❌ Please sign in' });
    if (!fiatWithdrawAmount || !bankName || !accountNumber || !accountHolder) {
      return setMessage({ type: 'error', text: '❌ Fill all required fields' });
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/v0/payments/fiat/withdraw`, {
        userId,
        amount: parseFloat(fiatWithdrawAmount),
        currency: fiatWithdrawCurrency,
        bankName,
        accountNumber,
        accountHolder,
        email: withdrawEmail,
        isDemo: DEMO_MODE
      });
      setMessage({ type: 'success', text: '✅ ' + (res.data.message || 'Fiat withdrawal initiated successfully') });
      setFiatWithdrawAmount('');
      setAccountNumber('');
      setBankName('');
      setAccountHolder('');
    } catch (err) {
      setMessage({ type: 'error', text: '❌ ' + (err?.response?.data?.message || err.message) });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: '✅ Copied to clipboard' });
    setTimeout(() => setMessage(null), 2000);
  };


  return (
    <>
    <Modal 
      open={open} 
      onClose={handleClose}
      slotProps={{ 
        backdrop: { 
          sx: { 
            backdropFilter: 'blur(5px)', 
            background: 'rgba(0, 0, 0, 0.7)' 
          } 
        } 
      }}
    >
      <Box sx={modalBoxStyle}>
        {/* HEADER */}
        <Box sx={headerStyle}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CreditCardIcon sx={{ fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>Wallet</Typography>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: '#fff', '&:hover': { background: 'rgba(255, 255, 255, 0.1)' } }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* TABS */}
        <Tabs value={tab} onChange={(e, v) => { setTab(v); setMessage(null); }} sx={tabsContainerStyle}>
          <Tab icon={<CreditCardIcon sx={{ mr: 1 }} />} label="Fiat" iconPosition="start" />
          <Tab 
            label="CRYPTO (USDT)" 
            iconPosition="start"
            sx={{ 
              '&.Mui-selected': { 
                color: '#FFD700 !important',
                fontWeight: 900
              }
            }}
          />
          <Tab icon={<AccountBalanceIcon sx={{ mr: 1 }} />} label="Withdraw" iconPosition="start" />
          <Tab icon={<ReceiptIcon sx={{ mr: 1 }} />} label="History" iconPosition="start" />
          <Tab icon={<InfoIcon sx={{ mr: 1 }} />} label="Demo Balance" iconPosition="start" />
        </Tabs>

        {/* ALERT */}
        {message && (
          <Box sx={{ px: 3, pt: 2 }}>
            <Alert severity={message.type} sx={{ background: message.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)', border: `1px solid ${message.type === 'success' ? '#4CAF50' : '#F44336'}`, color: message.type === 'success' ? '#81C784' : '#EF5350' }}>
              {message.text}
            </Alert>
          </Box>
        )}

        {/* CONTENT */}
        <Box sx={contentStyle}>
          {/* FIAT DEPOSIT */}
          {tab === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#BA6AFF' }}>Fiat Deposit</Typography>
              
              <Box sx={formCardStyle}>
                <Typography variant="caption" sx={{ color: '#999', mb: 1, display: 'block' }}>DEPOSIT DETAILS</Typography>
                <Divider sx={{ borderColor: 'rgba(90, 69, 209, 0.2)', mb: 2 }} />
                
                <TextField label="Amount" value={fiatAmount} onChange={(e) => setFiatAmount(e.target.value)} fullWidth size="small" type="number" sx={{ mb: 2, ...inputStyle }} placeholder="0.00" />
                
                <FormControl fullWidth size="small" sx={{ mb: 2, ...inputStyle }}>
                  <InputLabel>Currency</InputLabel>
                  <Select value={fiatCurrency} onChange={(e) => setFiatCurrency(e.target.value)} label="Currency">
                    <MenuItem value="USD">USD - US Dollar</MenuItem>
                    <MenuItem value="EUR">EUR - Euro</MenuItem>
                    <MenuItem value="GBP">GBP - British Pound</MenuItem>
                    <MenuItem value="JPY">JPY - Japanese Yen</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={{ mb: 2, ...inputStyle }}>
                  <InputLabel>Payment Method</InputLabel>
                  <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} label="Payment Method" disabled={DEMO_MODE}>
                    <MenuItem value="credit_card">💳 Credit Card</MenuItem>
                    <MenuItem value="debit_card">🏧 Debit Card</MenuItem>
                    <MenuItem value="bank_transfer">🏦 Bank Transfer</MenuItem>
                  </Select>
                  {DEMO_MODE && (
                    <Typography variant="caption" sx={{ color: '#FFC107', mt: 1 }}>Demo mode enabled — real payments disabled</Typography>
                  )}
                </FormControl>
              </Box>

              <Box sx={formCardStyle}>
                <Typography variant="caption" sx={{ color: '#999', mb: 1, display: 'block' }}>PERSONAL INFORMATION</Typography>
                <Divider sx={{ borderColor: 'rgba(90, 69, 209, 0.2)', mb: 2 }} />
                
                <TextField label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} fullWidth size="small" sx={{ mb: 2, ...inputStyle }} placeholder="John Doe" />
                
                <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth size="small" type="email" sx={{ mb: 2, ...inputStyle }} placeholder="your@email.com" />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button sx={secondaryButtonStyle} onClick={handleClose}>Cancel</Button>
                <Button sx={primaryButtonStyle} onClick={handleCreateFiat} disabled={loading}>{loading ? '⏳ Processing...' : DEMO_MODE ? '💠 Demo Deposit' : '💰 Deposit'}</Button>
              </Box>
            </Box>
          )}

          {/* CRYPTO DEPOSIT */}
          {tab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#BA6AFF' }}>Crypto Deposit</Typography>
              
              {/* PROMINENT USDT SECTION */}
              <Box sx={{ ...formCardStyle, background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.25) 0%, rgba(255, 152, 0, 0.15), rgba(255, 87, 34, 0.1) 100%)', border: '3px solid #FFC107', mb: 3, boxShadow: '0 15px 40px rgba(255, 152, 0, 0.3)', position: 'relative', overflow: 'hidden' }}>
                {/* Animated background gradient */}
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255, 193, 7, 0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, position: 'relative', zIndex: 1 }}>
                  <StarIcon sx={{ color: '#FFD700', fontSize: 32, animation: 'pulse 2s infinite' }} />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#FFD700', mb: 0, letterSpacing: '1px' }}>💎 USDT Deposits (ERC20)</Typography>
                    <Typography variant="caption" sx={{ color: '#FFB74D', fontWeight: 600 }}>✨ Recommended - Fastest & Most Secure</Typography>
                  </Box>
                  <Chip label="⭐ Featured" size="small" sx={{ background: 'linear-gradient(90deg, #FFD700 0%, #FFC107 100%)', color: '#000', fontWeight: 900, ml: 'auto' }} />
                </Box>
                
                <Divider sx={{ borderColor: 'rgba(255, 193, 7, 0.4)', mb: 2 }} />
                
                <Box sx={{ mb: 2, p: 1.5, background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
                  <Typography variant="body2" sx={{ color: '#FFEB3B', mb: 1, fontWeight: 600 }}>🚀 Why Choose USDT?</Typography>
                  <Typography variant="caption" sx={{ color: '#E8B547', display: 'block', mb: 0.8, lineHeight: 1.5 }}>
                    • ⚡ Instant deposits with 6 blockchain confirmations<br/>
                    • 🔒 Secure ERC20 network technology<br/>
                    • 💨 Fast processing - funds appear immediately<br/>
                    • 📱 Easy QR code scanning with mobile wallets
                  </Typography>
                </Box>
                
                <Button 
                  fullWidth 
                  sx={{ 
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFC107 50%, #FF9800 100%)',
                    color: '#000',
                    fontWeight: 900,
                    fontSize: '16px',
                    padding: '18px 20px',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: '0 8px 20px rgba(255, 152, 0, 0.4)',
                    position: 'relative',
                    zIndex: 2,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #FFEB3B 0%, #FFD54F 50%, #FFAB40 100%)',
                      boxShadow: '0 12px 30px rgba(255, 152, 0, 0.6)',
                      transform: 'translateY(-3px)',
                      fontWeight: 900
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onClick={() => setUsdtModalOpen(true)}
                >
                  🚀 Deposit USDT Now →
                </Button>
                {/* withdraw button for new NOWPayments flow */}
                <Box sx={{ mt: 2 }}>
                  <Button
                    fullWidth
                    sx={{
                      background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: '16px',
                      padding: '18px 20px',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      boxShadow: '0 8px 20px rgba(255, 82, 82, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #FF8A80 0%, #FF5252 100%)',
                        boxShadow: '0 12px 30px rgba(255, 82, 82, 0.6)',
                        transform: 'translateY(-3px)',
                        fontWeight: 900
                      },
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => setUsdtWithdrawOpen(true)}
                  >
                    💸 Withdraw USDT
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ borderColor: 'rgba(90, 69, 209, 0.2)', my: 3 }} />
              <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 2 }}>Or select legacy crypto options below:</Typography>
              
              <Box sx={formCardStyle}>
                <Typography variant="caption" sx={{ color: '#999', mb: 1, display: 'block' }}>SELECT CRYPTOCURRENCY</Typography>
                <Divider sx={{ borderColor: 'rgba(90, 69, 209, 0.2)', mb: 2 }} />
                
                <FormControl fullWidth size="small" sx={{ mb: 2, ...inputStyle }}>
                  <InputLabel>Coin Type</InputLabel>
                  <Select value={coin} onChange={(e) => setCoin(e.target.value)} label="Coin Type">
                    <MenuItem value="USDT">⊘ Tether (USDT)</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="outlined" onClick={handleGenerateAddress} disabled={loading} sx={{ flex: 1, ...secondaryButtonStyle }}>
                    {loading ? '⏳ Generating...' : '🔑 Generate Address'}
                  </Button>
                </Box>
              </Box>

              {generatedAddress && (
                <Box sx={formCardStyle}>
                  <Typography variant="caption" sx={{ color: '#999', mb: 1, display: 'block' }}>YOUR DEPOSIT ADDRESS</Typography>
                  <Divider sx={{ borderColor: 'rgba(90, 69, 209, 0.2)', mb: 2 }} />
                  
                  <Box sx={{ background: 'rgba(0, 0, 0, 0.3)', p: 2, borderRadius: '8px', mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(90, 69, 209, 0.2)' }}>
                    <Typography sx={{ fontSize: '12px', fontFamily: 'monospace', color: '#BA6AFF', wordBreak: 'break-all' }}>
                      {generatedAddress}
                    </Typography>
                    <Button size="small" sx={{ color: '#BA6AFF', ml: 2 }} onClick={() => copyToClipboard(generatedAddress)}>📋 Copy</Button>
                  </Box>
                </Box>
              )}

              <Box sx={formCardStyle}>
                <Typography variant="caption" sx={{ color: '#999', mb: 1, display: 'block' }}>DEPOSIT AMOUNT</Typography>
                <Divider sx={{ borderColor: 'rgba(90, 69, 209, 0.2)', mb: 2 }} />
                
                <TextField label="Amount" value={cryptoAmount} onChange={(e) => setCryptoAmount(e.target.value)} fullWidth size="small" type="number" sx={{ ...inputStyle }} placeholder="0.00" />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button sx={secondaryButtonStyle} onClick={handleClose}>Cancel</Button>
                <Button sx={primaryButtonStyle} onClick={handleSimulateDeposit} disabled={loading || !generatedAddress}>{loading ? '⏳ Processing...' : '📤 Simulate Deposit'}</Button>
              </Box>
            </Box>
          )}

          {/* WITHDRAW */}
          {tab === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#BA6AFF' }}>Withdraw</Typography>
              
              {/* Withdraw Type Selector */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button 
                  sx={{ 
                    flex: 1, 
                    padding: '12px', 
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    background: withdrawType === 'crypto' ? 'linear-gradient(90deg, #5A45D1 0%, #BA6AFF 100%)' : 'rgba(90, 69, 209, 0.2)',
                    color: '#fff',
                    border: withdrawType === 'crypto' ? 'none' : '1px solid rgba(90, 69, 209, 0.3)',
                    transition: 'all 0.3s ease'
                  }} 
                  onClick={() => setWithdrawType('crypto')}
                >
                  ⊘ Crypto
                </Button>
                <Button 
                  sx={{ 
                    flex: 1, 
                    padding: '12px', 
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    background: withdrawType === 'fiat' ? 'linear-gradient(90deg, #5A45D1 0%, #BA6AFF 100%)' : 'rgba(90, 69, 209, 0.2)',
                    color: '#fff',
                    border: withdrawType === 'fiat' ? 'none' : '1px solid rgba(90, 69, 209, 0.3)',
                    transition: 'all 0.3s ease'
                  }} 
                  onClick={() => setWithdrawType('fiat')}
                >
                  💵 Fiat
                </Button>
              </Box>

              {/* CRYPTO WITHDRAW */}
              {withdrawType === 'crypto' && (
                <Box>
                  <Box sx={formCardStyle}>
                    <Typography variant="caption" sx={{ color: '#999', mb: 1, display: 'block' }}>WITHDRAWAL DETAILS</Typography>
                    <Divider sx={{ borderColor: 'rgba(90, 69, 209, 0.2)', mb: 2 }} />
                    
                    <FormControl fullWidth size="small" sx={{ mb: 2, ...inputStyle }}>
                      <InputLabel>Coin Type</InputLabel>
                      <Select value={withdrawCoin} onChange={(e) => setWithdrawCoin(e.target.value)} label="Coin Type">
                        <MenuItem value="USDT">⊘ Tether (USDT)</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField label="Amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} fullWidth size="small" type="number" sx={{ mb: 2, ...inputStyle }} placeholder="0.00" />
                    
                    <TextField label="Recipient Address" value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} fullWidth size="small" sx={{ mb: 2, ...inputStyle }} placeholder="0x..." />
                  </Box>

                  <Box sx={formCardStyle}>
                    <Typography variant="caption" sx={{ color: '#999', mb: 1, display: 'block' }}>NOTIFICATION</Typography>
                    <Divider sx={{ borderColor: 'rgba(90, 69, 209, 0.2)', mb: 2 }} />
                    
                    <TextField label="Email" value={withdrawEmail} onChange={(e) => setWithdrawEmail(e.target.value)} fullWidth size="small" type="email" sx={{ ...inputStyle }} placeholder="your@email.com" />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button sx={secondaryButtonStyle} onClick={handleClose}>Cancel</Button>
                    <Button sx={primaryButtonStyle} onClick={handleWithdraw} disabled={loading}>{loading ? '⏳ Processing...' : '📤 Withdraw'}</Button>
                  </Box>
                </Box>
              )}

              {/* FIAT WITHDRAW */}
              {withdrawType === 'fiat' && (
                <Box>
                  <Box sx={formCardStyle}>
                    <Typography variant="caption" sx={{ color: '#999', mb: 1, display: 'block' }}>FIAT WITHDRAWAL (Via Flutterwave)</Typography>
                    <Divider sx={{ borderColor: 'rgba(90, 69, 209, 0.2)', mb: 2 }} />
                    
                    <FormControl fullWidth size="small" sx={{ mb: 2, ...inputStyle }}>
                      <InputLabel>Currency</InputLabel>
                      <Select value={fiatWithdrawCurrency} onChange={(e) => setFiatWithdrawCurrency(e.target.value)} label="Currency">
                        <MenuItem value="USD">USD - US Dollar</MenuItem>
                        <MenuItem value="EUR">EUR - Euro</MenuItem>
                        <MenuItem value="GBP">GBP - British Pound</MenuItem>
                        <MenuItem value="NGN">NGN - Nigerian Naira</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField label="Amount" value={fiatWithdrawAmount} onChange={(e) => setFiatWithdrawAmount(e.target.value)} fullWidth size="small" type="number" sx={{ mb: 2, ...inputStyle }} placeholder="0.00" />
                  </Box>

                  <Box sx={formCardStyle}>
                    <Typography variant="caption" sx={{ color: '#999', mb: 1, display: 'block' }}>BANK DETAILS</Typography>
                    <Divider sx={{ borderColor: 'rgba(90, 69, 209, 0.2)', mb: 2 }} />
                    
                    <TextField label="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} fullWidth size="small" sx={{ mb: 2, ...inputStyle }} placeholder="e.g., First Bank" />
                    
                    <TextField label="Account Number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} fullWidth size="small" sx={{ mb: 2, ...inputStyle }} placeholder="0123456789" />
                    
                    <TextField label="Account Holder Name" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} fullWidth size="small" sx={{ mb: 2, ...inputStyle }} placeholder="Your Name" />
                  </Box>

                  <Box sx={formCardStyle}>
                    <Typography variant="caption" sx={{ color: '#999', mb: 1, display: 'block' }}>NOTIFICATION</Typography>
                    <Divider sx={{ borderColor: 'rgba(90, 69, 209, 0.2)', mb: 2 }} />
                    
                    <TextField label="Email" value={withdrawEmail} onChange={(e) => setWithdrawEmail(e.target.value)} fullWidth size="small" type="email" sx={{ ...inputStyle }} placeholder="your@email.com" />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button sx={secondaryButtonStyle} onClick={handleClose}>Cancel</Button>
                    <Button sx={primaryButtonStyle} onClick={handleFiatWithdraw} disabled={loading}>{loading ? '⏳ Processing...' : '💳 Withdraw Fiat'}</Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* HISTORY */}
          {tab === 3 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#BA6AFF' }}>Transaction History</Typography>
              
              {loading ? (
                <Typography sx={{ textAlign: 'center', py: 4, color: '#999' }}>⏳ Loading history...</Typography>
              ) : history.length > 0 ? (
                <TableContainer sx={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', border: '1px solid rgba(90, 69, 209, 0.2)' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ background: 'rgba(90, 69, 209, 0.1)' }}>
                        <TableCell sx={{ color: '#BA6AFF', fontWeight: 'bold' }}>Date</TableCell>
                        <TableCell sx={{ color: '#BA6AFF', fontWeight: 'bold' }}>Amount</TableCell>
                        <TableCell sx={{ color: '#BA6AFF', fontWeight: 'bold' }}>Currency</TableCell>
                        <TableCell sx={{ color: '#BA6AFF', fontWeight: 'bold' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.map((tx, idx) => (
                        <TableRow key={idx} sx={{ '&:hover': { background: 'rgba(90, 69, 209, 0.05)' }, borderBottom: '1px solid rgba(90, 69, 209, 0.1)' }}>
                          <TableCell sx={{ color: '#ccc' }}>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell sx={{ color: '#81C784', fontWeight: 'bold' }}>${tx.amount}</TableCell>
                          <TableCell sx={{ color: '#ccc' }}>{tx.currency || 'N/A'}</TableCell>
                          <TableCell sx={{ color: tx.status === 'completed' ? '#81C784' : tx.status === 'pending' ? '#FFC107' : '#f44336', fontWeight: 'bold' }}>
                            {tx.status === 'completed' ? '✅ Completed' : tx.status === 'pending' ? '⏳ Pending' : '❌ Failed'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6, background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', border: '1px dashed rgba(90, 69, 209, 0.2)' }}>
                  <ReceiptIcon sx={{ fontSize: 48, color: '#666', mb: 2 }} />
                  <Typography sx={{ color: '#999' }}>No transaction history yet</Typography>
                </Box>
              )}
            </Box>
          )}

          {/* DEMO BALANCE */}
          {tab === 4 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#BA6AFF' }}>Demo Balance</Typography>
              <Box sx={{ mb: 2 }}>
                <Button sx={primaryButtonStyle} onClick={() => dispatch(fetchDemoBalance(userId))} disabled={wallet.loading}>
                  {wallet.loading ? '⏳ Refreshing...' : '🔄 Refresh Demo Balance'}
                </Button>
              </Box>
              {wallet.error && <Alert severity="error">{wallet.error}</Alert>}
              {wallet.demoBalance ? (
                <Box sx={{ mt: 2 }}>
                  {wallet.demoBalance.data && wallet.demoBalance.data.length > 0 ? (
                    wallet.demoBalance.data.map((b, idx) => (
                      <Typography key={idx} sx={{ color: '#ccc' }}>{b.coinType}: {b.balance}</Typography>
                    ))
                  ) : (
                    <Typography sx={{ color: '#999' }}>No demo currency entries.</Typography>
                  )}
                </Box>
              ) : (
                <Typography sx={{ color: '#999' }}>Demo balance not fetched yet.</Typography>
              )}
            </Box>
          )}

        </Box>
      </Box>
    </Modal>

    {/* USDT DEPOSIT MODAL */}
    <CryptoDepositModal open={usdtModalOpen} onClose={() => setUsdtModalOpen(false)} />
    <CryptoWithdrawModal open={usdtWithdrawOpen} onClose={() => setUsdtWithdrawOpen(false)} />
    </>
  );
}
