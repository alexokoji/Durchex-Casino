import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Box, IconButton, Typography, TextField, Button, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const modalBoxStyle = {
  marginTop: '100px',
  width: '600px',
  left: '50%',
  transform: 'translate(-50%)',
  background: '#2C2C3A',
  position: 'relative',
  borderRadius: '16px',
  padding: '20px'
};

export default function FiatDepositModal({ open, onClose }) {
  const API_URL = process.env.REACT_APP_API_URL || '';
  const auth = useSelector((s) => s.authentication);
  const userId = auth?.userData?._id;

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleCreate = async () => {
    setMessage(null);
    if (!userId) return setMessage({ type: 'error', text: 'Please sign in' });
    if (!amount) return setMessage({ type: 'error', text: 'Enter amount' });
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/v0/payments/fiat/deposit`, {
        userId,
        amount: parseFloat(amount),
        currency,
        paymentMethod: 'flutterwave'
      });
      // if the backend returned an authorization link, take the user there
      const link = res?.data?.paymentLink || res?.data?.data?.paymentLink || res?.data?.data?.authorizationUrl;
      if (link) {
        // redirect immediately - backend ensures status true
        window.location.href = link;
        return; // leave component open until redirect
      }
      setMessage({ type: 'success', text: res.data.message || 'Deposit created' });
      setAmount('');
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      open={open} 
      onClose={onClose}
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
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, color: '#fff' }}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>Fiat Deposit</Typography>
        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>
        )}

        <TextField
          label="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          fullWidth
          size="small"
          sx={{ mb: 2, input: { color: '#fff' } }}
        />

        <TextField
          label="Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          fullWidth
          size="small"
          sx={{ mb: 2, input: { color: '#fff' } }}
        />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="contained" color="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create Deposit'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
