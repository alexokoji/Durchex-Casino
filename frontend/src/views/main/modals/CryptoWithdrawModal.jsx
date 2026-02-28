import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Modal,
  Box,
  IconButton,
  Typography,
  TextField,
  Button,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Styles are copied from CryptoDepositModal for consistency
const modalBoxStyle = {
  marginTop: '50px',
  width: '700px',
  maxHeight: '90vh',
  left: '50%',
  transform: 'translate(-50%)',
  background: '#2C2C3A',
  position: 'relative',
  borderRadius: '16px',
  padding: '30px',
  overflowY: 'auto',
  '@media (max-width: 681px)': {
    width: 'calc(100% - 60px)',
    maxHeight: '85vh',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '20px'
  }
};

const sectionStyle = {
  background: '#1A1A2E',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '20px',
  border: '1px solid #404060'
};

const badgeStyle = {
  display: 'inline-block',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#fff',
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 'bold',
  marginBottom: '15px'
};

export default function CryptoWithdrawModal({ open, onClose }) {
  const auth = useSelector((s) => s.authentication);
  const userId = auth?.userData?._id;

  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [step, setStep] = useState('form'); // 'form' or 'result'
  const [withdrawalId, setWithdrawalId] = useState(null);
  const [withdrawalStatus, setWithdrawalStatus] = useState(null);

  // Calculate current balance
  const currentBalance = useMemo(() => {
    try {
      const userData = auth?.userData;
      if (!userData || !userData.balance) return 0;
      const balance = userData.balance;
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

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setAmount('');
      setAddress('');
      setMessage(null);
      setStep('form');
      setWithdrawalId(null);
      setWithdrawalStatus(null);
    }
  }, [open]);

  const handleInitiateWithdrawal = async () => {
    setMessage(null);
    if (!userId) return setMessage({ type: 'error', text: '❌ Please sign in' });
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return setMessage({ type: 'error', text: '❌ Enter a valid amount' });
    }
    if (parsedAmount < 1) {
      return setMessage({ type: 'error', text: '❌ Minimum USDT amount is 1' });
    }
    if (!address) {
      return setMessage({ type: 'error', text: '❌ Enter destination address' });
    }

    setLoading(true);
    try {
      const endpoint = '/api/v0/payments/usdt/withdraw';
      const res = await fetch(`${process.env.REACT_APP_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          amount: parsedAmount,
          currency: 'USDT',
          address
        })
      });

      const data = await res.json();
      if (!data.status) {
        throw new Error(data.message || 'Withdrawal failed');
      }

      const w = data.withdrawal || data.data;
      setWithdrawalId(w?._id || null);
      setWithdrawalStatus(w);
      setMessage({ type: 'success', text: '✅ Withdrawal request submitted' });
      setStep('result');
    } catch (err) {
      setMessage({ type: 'error', text: `❌ ${err?.message || err}` });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!withdrawalId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v0/payments/usdt/withdrawal/${withdrawalId}`
      );
      const data = await res.json();
      if (!data.status) {
        throw new Error(data.message || 'Failed to fetch status');
      }
      setWithdrawalStatus(data.data);
      setMessage({ type: 'info', text: 'ℹ️ Status updated' });
    } catch (err) {
      setMessage({ type: 'error', text: `❌ ${err?.message || err}` });
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
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: '#fff', zIndex: 10 }}
        >
          <CloseIcon />
        </IconButton>

        <div style={badgeStyle}>💸 USDT (TRC-20) - NOWPayments</div>

        <Typography variant="h4" sx={{ color: '#fff', mb: 1, fontWeight: 'bold' }}>
          USDT Withdrawal
        </Typography>

        <Typography variant="body2" sx={{ color: '#aaa', mb: 3 }}>
          Withdraw USDT from your casino wallet via NOWPayments. Requests are processed automatically; track status below.
        </Typography>

        {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

        {/* Current Balance Card */}
        {step === 'form' && (
          <Card sx={{ mb: 2, background: '#424253', border: '1px solid #667eea' }}>
            <CardContent sx={{ py: 1.5, px: 2 }}>
              <Typography sx={{ fontSize: '0.875rem', color: '#aaa', mb: 0.5 }}>
                Available Balance
              </Typography>
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>
                {currentBalance.toFixed(6)} USDT
              </Typography>
            </CardContent>
          </Card>
        )}

        {step === 'form' && (
          <Box sx={sectionStyle}>
            <TextField
              label="Amount (USDT)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#444' } } }}
              inputProps={{ min: '1', step: '0.01' }}
            />
            <TextField
              label="Destination Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#444' } } }}
              placeholder="T..."
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleInitiateWithdrawal}
              disabled={loading || !amount || !address}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff'
              }}
            >
              {loading ? '⏳ Sending request...' : '🌀 Submit Withdrawal'}
            </Button>
          </Box>
        )}

        {step === 'result' && (
          <>
            <Box sx={sectionStyle}>
              <Typography sx={{ color: '#aaa', mb: 1 }}>Withdrawal ID</Typography>
              <Typography sx={{ color: '#fff', wordBreak: 'break-all' }}>{withdrawalId}</Typography>

              {withdrawalStatus && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ color: '#aaa', mb: 1 }}>Status</Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{withdrawalStatus.status}</Typography>
                </Box>
              )}

              <Button
                variant="outlined"
                onClick={handleCheckStatus}
                disabled={loading}
                sx={{ mt: 2, width: '100%' }}
              >
                {loading ? '⏳ Checking...' : '🔍 Check Status'}
              </Button>
            </Box>

            {/* Back / Close buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setStep('form');
                  setMessage(null);
                }}
              >
                ← Back
              </Button>
              <Button variant="contained" color="secondary" onClick={onClose}>
                Close
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
}
