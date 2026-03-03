import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Box, IconButton, Typography, TextField, Button, Alert, Card, CardContent } from '@mui/material';
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
  padding: '20px',
  '@media (max-width: 681px)': {
    width: 'calc(100% - 40px)',
    marginTop: '50px',
    borderRadius: '8px'
  }
};

export default function FiatDepositModal({ open, onClose }) {
  const API_URL = process.env.REACT_APP_API_URL || '';
  const auth = useSelector((s) => s.authentication);
  const userId = auth?.userData?._id;

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Calculate current balance
  const currentBalance = useMemo(() => {
    try {
      const userData = auth?.userData;
      if (!userData) return 0;
      const balance = userData.balance || { data: [] };
      if (typeof balance === 'number') return balance;
      if (balance.data && Array.isArray(balance.data)) {
        return balance.data.reduce((acc, b) => {
          if (!b) return acc;
          const val = parseFloat(b.balance || 0);
          return acc + (isNaN(val) ? 0 : val);
        }, 0);
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }, [auth?.userData]);

  const handleCreate = async () => {
    setMessage(null);
    if (!userId) return setMessage({ type: 'error', text: 'Please sign in' });
    if (!amount) return setMessage({ type: 'error', text: 'Enter amount' });
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/v0/payments/fiat/deposit`, {
        userId,
        amount: parseFloat(amount),

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
        <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 'bold' }}>💰 Fiat Deposit</Typography>
        
        {/* Current Balance Card */}
        <Card sx={{ mb: 2, background: '#424253', border: '1px solid #BA6AFF' }}>
          <CardContent sx={{ py: 1.5, px: 2 }}>
            <Typography sx={{ fontSize: '0.875rem', color: '#bbb3b3', mb: 0.5 }}>
              Current Balance
            </Typography>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#BA6AFF' }}>
              {currentBalance.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>

        {message && (
          <Alert severity={message.type} sx={{ mb: 2, color: '#FFF' }}>{message.text}</Alert>
        )}

        <TextField
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          fullWidth
          size="small"
          sx={{ 
            mb: 2,
            input: { color: '#fff' },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#424253'
            }
          }}
          inputProps={{ min: '1', step: '0.01' }}
        />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onClose} sx={{ color: '#fff', borderColor: '#424253' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreate} 
            disabled={loading}
            sx={{ 
              background: 'linear-gradient(135deg, #5A45D1 0%, #BA6AFF 100%)',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
