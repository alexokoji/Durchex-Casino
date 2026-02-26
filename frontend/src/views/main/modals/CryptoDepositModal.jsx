import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Box, IconButton, Typography, TextField, Button, Alert, Paper, Copy } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import axios from 'axios';

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
  overflowY: 'auto'
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

export default function CryptoDepositModal({ open, onClose }) {
  const auth = useSelector((s) => s.authentication);
  const userId = auth?.userData?._id;

  const [paymentId, setPaymentId] = useState(null);
  const [nowpaymentsPaymentId, setNowpaymentsPaymentId] = useState(null);
  const [address, setAddress] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [step, setStep] = useState('generate'); // 'generate', 'display'
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);

  useEffect(() => {
    // Reset state when modal closes
    if (!open) {
      setStep('generate');
      setAddress('');
      setQrCode('');
      setAmount('');
      setPaymentId(null);
      setNowpaymentsPaymentId(null);
      setPaymentStatus(null);
      setMessage(null);
      if (pollInterval) clearInterval(pollInterval);
    }
  }, [open, pollInterval]);

  // Auto-poll for payment status every 10 seconds
  useEffect(() => {
    if (paymentId && step === 'display' && open) {
      const interval = setInterval(async () => {
        try {
          const res = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/v0/payments/usdt/${paymentId}`
          );

          const data = res.data.data;
          setPaymentStatus({
            status: data.status,
            amount: data.amount,
            receivedAmount: data.receivedAmount
          });

          // If payment confirmed, show success message
          if (data.status === 'confirmed' || data.status === 'completed' || data.status === 'finished') {
            clearInterval(interval);
            setMessage({
              type: 'success',
              text: '✅ Payment confirmed! Funds have been added to your wallet.'
            });
          }
        } catch (err) {
          // Silently fail on poll - don't spam error messages
          console.error('Poll error:', err.message);
        }
      }, 10000); // Poll every 10 seconds

      setPollInterval(interval);
      return () => clearInterval(interval);
    }
  }, [paymentId, step, open]);

  const handleGenerateAddress = async () => {
    setMessage(null);
    if (!userId) return setMessage({ type: 'error', text: '❌ Please sign in' });
    if (!amount) return setMessage({ type: 'error', text: '❌ Enter amount first' });

    const parsedAmount = parseFloat(amount);
    if (parsedAmount < 1) {
      return setMessage({ type: 'error', text: '❌ Minimum USDT amount is 1' });
    }
    if (parsedAmount > 100000) {
      return setMessage({ type: 'error', text: '❌ Maximum USDT amount is 100,000' });
    }

    setLoading(true);
    try {
      const endpoint = '/api/v0/payments/usdt/trc20/create';
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        {
          userId,
          amount: parsedAmount,
          currencyFrom: 'USD'
        }
      );

      const data = res.data.data;
      setPaymentId(data.paymentId);
      setNowpaymentsPaymentId(data.nowpaymentsPaymentId);
      setAddress(data.address);
      setQrCode(data.qrCode);
      setPaymentStatus({
        status: 'waiting_for_payment',
        amount: parsedAmount,
        receivedAmount: 0
      });
      setMessage({ type: 'success', text: '✅ USDT payment order created successfully!' });
      setStep('display');
    } catch (err) {
      setMessage({
        type: 'error',
        text: `❌ ${err?.response?.data?.message || err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: '✅ Address copied to clipboard!' });
  };

  const handleCheckStatus = async () => {
    if (!paymentId) return;

    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v0/payments/usdt/${paymentId}`
      );

      const data = res.data.data;
      setPaymentStatus({
        status: data.status,
        amount: data.amount,
        receivedAmount: data.receivedAmount,
        expiresAt: data.expiresAt
      });

      if (data.status === 'confirmed' || data.status === 'completed' || data.status === 'finished') {
        setMessage({
          type: 'success',
          text: '✅ Payment confirmed! Funds have been added to your wallet.'
        });
      } else if (data.status === 'waiting_for_payment') {
        setMessage({
          type: 'info',
          text: '⏳ Waiting for payment... Please send USDT to the address above.'
        });
      } else if (data.status === 'confirming') {
        setMessage({
          type: 'info',
          text: '⏳ Payment received! Waiting for blockchain confirmation...'
        });
      } else if (data.status === 'expired') {
        setMessage({
          type: 'error',
          text: '⏰ Payment order expired. Please generate a new address.'
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: `❌ ${err?.response?.data?.message || err.message}`
      });
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

        <div style={badgeStyle}>💎 USDT (TRC-20) - NOWPayments</div>

        <Typography variant="h4" sx={{ color: '#fff', mb: 1, fontWeight: 'bold' }}>
          USDT Deposit
        </Typography>

        <Typography variant="body2" sx={{ color: '#aaa', mb: 3 }}>
          Deposit USDT TRC-20 to your casino wallet via NOWPayments. Payments are instant after blockchain confirmation.
        </Typography>

        {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

        {/* Step 1: Enter Amount & Generate Address */}
        {step === 'generate' && (
          <>
            <Box sx={sectionStyle}>
              <Typography variant="subtitle2" sx={{ color: '#aaa', mb: 2 }}>
                Step 1: Enter Deposit Amount
              </Typography>
              <TextField
                label="USDT Amount (USD)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10.00"
                fullWidth
                size="small"
                inputProps={{ min: '1', max: '100000', step: '0.01' }}
                sx={{
                  mb: 2,
                  '& input': { color: '#fff', fontWeight: 'bold' },
                  '& .MuiOutlinedInput-root': {
                    borderColor: '#444',
                    '&:hover fieldset': { borderColor: '#667eea' }
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleGenerateAddress}
                disabled={loading || !amount}
                fullWidth
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff'
                }}
              >
                {loading ? '⏳ Creating Order...' : '🔐 Create Payment Order'}
              </Button>
            </Box>
          </>
        )}

        {/* Step 2: Display Address & QR */}
        {step === 'display' && address && (
          <>
            <Box sx={sectionStyle}>
              <Typography variant="subtitle2" sx={{ color: '#aaa', mb: 2 }}>
                📍 Send USDT TRC-20 to This Address
              </Typography>
              <Paper sx={{ background: '#0a0a0a', padding: '15px', borderRadius: '8px', mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#4ade80',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      flex: 1,
                      fontSize: '12px'
                    }}
                  >
                    {address}
                  </Typography>
                  <IconButton
                    onClick={() => handleCopyToClipboard(address)}
                    sx={{ color: '#888', minWidth: '40px' }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>

              {qrCode && (
                <>
                  <Typography variant="subtitle2" sx={{ color: '#aaa', mb: 2, mt: 3 }}>
                    📲 Scan QR Code
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <img src={qrCode} alt="USDT Address QR" style={{ maxWidth: '250px' }} />
                  </Box>
                </>
              )}
            </Box>

            {/* Amount Summary */}
            <Box sx={sectionStyle}>
              <Typography variant="subtitle2" sx={{ color: '#aaa', mb: 2 }}>
                💰 Payment Summary
              </Typography>
              <Box sx={{ background: '#0a0a0a', padding: '12px', borderRadius: '8px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>Amount:</Typography>
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {paymentStatus?.amount} USDT
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Payment Status */}
            {paymentStatus && (
              <Box sx={sectionStyle}>
                <Typography variant="subtitle2" sx={{ color: '#aaa', mb: 2 }}>
                  📊 Payment Status
                </Typography>
                <Box sx={{ background: '#0a0a0a', padding: '12px', borderRadius: '8px', mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>Status:</Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: (
                          paymentStatus.status === 'confirmed' ||
                          paymentStatus.status === 'completed' ||
                          paymentStatus.status === 'finished' ?
                            '#4ade80' :
                            paymentStatus.status === 'confirming' ?
                              '#fbbf24' :
                              '#888'
                        ),
                        fontWeight: 'bold'
                      }}
                    >
                      {paymentStatus.status === 'waiting_for_payment' ? '⏳ Waiting' :
                       paymentStatus.status === 'confirming' ? '🔄 Confirming' :
                       paymentStatus.status === 'confirmed' ? '✅ Confirmed' :
                       paymentStatus.status === 'finished' ? '✅ Finished' :
                       paymentStatus.status === 'completed' ? '✅ Completed' :
                       paymentStatus.status}
                    </Typography>
                  </Box>
                  {paymentStatus.receivedAmount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#aaa' }}>Received:</Typography>
                      <Typography variant="body2" sx={{ color: '#4ade80', fontWeight: 'bold' }}>
                        {paymentStatus.receivedAmount} USDT
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  onClick={handleCheckStatus}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? '⏳ Checking...' : '🔍 Check Status'}
                </Button>
              </Box>
            )}

            {/* Instructions */}
            <Box sx={sectionStyle}>
              <Typography variant="subtitle2" sx={{ color: '#aaa', mb: 1 }}>
                📋 Instructions
              </Typography>
              <Typography variant="body2" sx={{ color: '#999', fontSize: '14px', lineHeight: '1.8' }}>
                1️⃣ Copy the address or scan the QR code<br />
                2️⃣ Send <strong style={{ color: '#fff' }}>exactly {paymentStatus?.amount} USDT (TRC-20)</strong> from your wallet<br />
                3️⃣ Payment will be confirmed within a few minutes<br />
                4️⃣ Funds are credited automatically when confirmed<br />
                <br />
                ⚠️ <strong style={{ color: '#ff6b6b' }}>Only send USDT TRC-20</strong><br />
                ⚠️ <strong style={{ color: '#ff6b6b' }}>Never send from exchanges directly</strong><br />
                ⚠️ <strong style={{ color: '#ff6b6b' }}>Payment expires in 24 hours</strong>
              </Typography>
            </Box>

            {/* Back to Generate */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setStep('generate');
                  setAddress('');
                  setQrCode('');
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
