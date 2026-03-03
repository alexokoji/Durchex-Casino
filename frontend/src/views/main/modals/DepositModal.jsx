import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Modal, Box, IconButton, Typography, TextField, Button, Alert, Tabs, Tab } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const modalBoxStyle = {
  marginTop: '100px',
  width: '680px',
  left: '50%',
  transform: 'translate(-50%)',
  background: '#2C2C3A',
  position: 'relative',
  borderRadius: '16px',
  padding: '20px'
};

export default function DepositModal({ open, onClose, initialTab = 'fiat' }) {
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.authentication);
  const userId = auth?.userData?._id;

  const [tab, setTab] = useState(initialTab === 'crypto' ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Fiat fields
  const [fiatAmount, setFiatAmount] = useState('');

  // Crypto fields
  const [coin, setCoin] = useState('ETH');
  const [address, setAddress] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');

  useEffect(() => {
    setTab(initialTab === 'crypto' ? 1 : 0);
  }, [initialTab]);

  const handleClose = () => {
    setMessage(null);
    setFiatAmount('');
    setCryptoAmount('');
    setAddress('');
    onClose && onClose();
  };

  const API_URL = process.env.REACT_APP_API_URL || '';

  const handleCreateFiat = async () => {
    setMessage(null);
    if (!userId) return setMessage({ type: 'error', text: 'Please sign in' });
    if (!fiatAmount) return setMessage({ type: 'error', text: 'Enter amount' });
    setLoading(true);
    try {
      const url = `${API_URL}/api/v0/payments/fiat/deposit`.replace(/\/\/api/, '/api');
      const res = await axios.post(url, {
        userId,
        amount: parseFloat(fiatAmount),
        paymentMethod: 'flutterwave'
      });
      console.log('fiat deposit response:', res.data);
      // redirect user to payment gateway if link provided
      const link = res?.data?.paymentLink || res?.data?.data?.paymentLink || res?.data?.data?.authorizationUrl;
      if (link) {
        console.log('navigating to payment link', link);
        window.location.href = link;
        return; // keep modal open until redirect happens
      }
      setMessage({ type: 'success', text: res.data.message || 'Deposit created' });
      setFiatAmount('');
    } catch (err) {
      console.error('fiat deposit error', err);
      setMessage({ type: 'error', text: err?.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAddress = async () => {
    setMessage(null);
    if (!userId) return setMessage({ type: 'error', text: 'Please sign in' });
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/v0/payments/crypto/generate-address`, {
        userId,
        coinType: coin
      });
      setAddress(res.data.address || res.data.depositAddress || '');
      setMessage({ type: 'success', text: 'Address generated' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateDeposit = async () => {
    setMessage(null);
    if (!userId) return setMessage({ type: 'error', text: 'Please sign in' });
    if (!address) return setMessage({ type: 'error', text: 'Generate address first' });
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/v0/payments/crypto/simulate-deposit`, {
        userId,
        address,
        amount: parseFloat(cryptoAmount || 0),
        coinType: coin
      });
      setMessage({ type: 'success', text: res.data.message || 'Simulated deposit' });
      setCryptoAmount('');
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
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
        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8, color: '#fff' }}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h5" sx={{ color: '#fff', mb: 1 }}>Deposit</Typography>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Fiat" />
          <Tab label="Crypto" />
        </Tabs>

        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>
        )}

        {tab === 0 && (
          <Box>
            <TextField label="Amount" value={fiatAmount} onChange={(e) => setFiatAmount(e.target.value)} fullWidth size="small" sx={{ mb: 2, input: { color: '#fff' } }} />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="contained" color="secondary" onClick={handleClose}>Cancel</Button>
              <Button variant="contained" onClick={handleCreateFiat} disabled={loading}>{loading ? 'Creating...' : 'Create Deposit'}</Button>
            </Box>
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <TextField label="Coin Type" value={coin} onChange={(e) => setCoin(e.target.value)} fullWidth size="small" sx={{ mb: 2, input: { color: '#fff' } }} />
            <Box sx={{ mb: 2 }}>
              <Button variant="outlined" onClick={handleGenerateAddress} disabled={loading} sx={{ mr: 2 }}>{loading ? 'Please wait...' : 'Generate Address'}</Button>
              <Button variant="contained" onClick={handleSimulateDeposit} disabled={loading || !address}>{loading ? 'Processing...' : 'Simulate Deposit'}</Button>
            </Box>
            {address && (
              <TextField label="Deposit Address" value={address} fullWidth size="small" InputProps={{ readOnly: true }} sx={{ mb: 2, input: { color: '#fff' } }} />
            )}
            <TextField label="Amount (for simulation)" value={cryptoAmount} onChange={(e) => setCryptoAmount(e.target.value)} fullWidth size="small" sx={{ mb: 2, input: { color: '#fff' } }} />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="contained" color="secondary" onClick={handleClose}>Close</Button>
            </Box>
          </Box>
        )}
      </Box>
    </Modal>
  );
}
