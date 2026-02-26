import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tab,
  Tabs,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Divider,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import {
  fetchDepositAddress,
  fetchDepositHistory,
  fetchWithdrawalHistory,
  processWithdrawal,
  toggleDemoMode,
  simulateDemoDeposit,
  clearError,
  clearSuccess
} from '../../redux/walletSlice';

const WalletModal = ({ open, setOpen }) => {
  const dispatch = useDispatch();
  const { authentication } = useSelector((state) => state);
  const { wallet } = useSelector((state) => state);
  
  const [tabValue, setTabValue] = useState(0);
  const [coinType, setCoinType] = useState('ETH');
  const [chain, setChain] = useState('ethereum');
  const [tokenType, setTokenType] = useState('USDC');
  
  // Withdrawal form state
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  
  // Demo deposit state
  const [demoDepositAmount, setDemoDepositAmount] = useState('100');
  const [copied, setCopied] = useState(false);

  const userId = authentication?.userData?._id || authentication?.userData?.userId;
  
  const handleOnClose = () => {
    setOpen(false);
  };

  // Load data on mount
  useEffect(() => {
    if (userId && open) {
      dispatch(fetchDepositHistory({ userId }));
      dispatch(fetchWithdrawalHistory({ userId }));
    }
  }, [userId, open, dispatch]);

  // Auto-hide alerts
  useEffect(() => {
    if (wallet.success || wallet.error) {
      const timer = setTimeout(() => {
        if (wallet.success) {
          dispatch(clearSuccess());
        }
        if (wallet.error) {
          dispatch(clearError());
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [wallet.success, wallet.error, dispatch]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleGetDepositAddress = async () => {
    if (userId) {
      await dispatch(fetchDepositAddress({ userId, coinType, chain, tokenType }));
    }
  };

  const handleCopyAddress = () => {
    if (wallet.depositAddress?.depositAddress) {
      navigator.clipboard.writeText(wallet.depositAddress.depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleProcessWithdrawal = async () => {
    if (!withdrawalAmount || !withdrawalAddress) {
      alert('Please fill in all fields');
      return;
    }
    
    if (userId) {
      await dispatch(
        processWithdrawal({
          userId,
          coinType,
          chain,
          amount: parseFloat(withdrawalAmount),
          address: withdrawalAddress,
          tokenType
        })
      );
      setWithdrawalAmount('');
      setWithdrawalAddress('');
    }
  };

  const handleSimulateDemoDeposit = async () => {
    if (!demoDepositAmount) {
      alert('Please enter amount');
      return;
    }
    
    if (userId) {
      await dispatch(
        simulateDemoDeposit({
          userId,
          coinType,
          chain,
          amount: parseFloat(demoDepositAmount)
        })
      );
      setDemoDepositAmount('100');
    }
  };

  const handleToggleDemoMode = async () => {
    if (userId) {
      await dispatch(toggleDemoMode({ userId, demoMode: !wallet.demoMode }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon sx={{ color: 'green' }} />;
      case 'pending':
        return <PendingIcon sx={{ color: 'orange' }} />;
      case 'failed':
      case 'cancelled':
        return <ErrorIcon sx={{ color: 'red' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={handleOnClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Wallet Management</Typography>
        <IconButton size="small" onClick={handleOnClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Alerts */}
        {wallet.error && <Alert severity="error" sx={{ mb: 2 }}>{wallet.error}</Alert>}
        {wallet.success && <Alert severity="success" sx={{ mb: 2 }}>{wallet.success}</Alert>}

        {/* Demo Mode Toggle */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {wallet.demoMode ? '🎮 DEMO MODE ACTIVE' : '💰 REAL MODE ACTIVE'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {wallet.demoMode 
                  ? 'Test with virtual funds - no real crypto needed' 
                  : 'Using real cryptocurrency'}
              </Typography>
            </Box>
            <Switch
              checked={wallet.demoMode}
              onChange={handleToggleDemoMode}
              disabled={wallet.loading}
              color="primary"
            />
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 2 }}>
          <Tab label="Deposit" />
          <Tab label="Withdraw" />
          <Tab label="History" />
        </Tabs>

        {/* DEPOSIT TAB */}
        {tabValue === 0 && (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {wallet.demoMode ? 'Demo Deposit' : 'Receive Crypto'}
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Coin Type"
                  value={coinType}
                  onChange={(e) => setCoinType(e.target.value)}
                  fullWidth
                  size="small"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="ETH">ETH - Ethereum</option>
                  <option value="BTC">BTC - Bitcoin</option>
                  <option value="BNB">BNB - Binance</option>
                  <option value="TRX">TRX - TRON</option>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Token Type"
                  value={tokenType}
                  onChange={(e) => setTokenType(e.target.value)}
                  fullWidth
                  size="small"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                  <option value="ZELO">ZELO</option>
                  <option value="NATIVE">Native</option>
                </TextField>
              </Grid>
            </Grid>

            {wallet.demoMode ? (
              <>
                <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                  Instantly add demo funds to your wallet for testing
                </Typography>
                <TextField
                  label="Amount"
                  type="number"
                  value={demoDepositAmount}
                  onChange={(e) => setDemoDepositAmount(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                  inputProps={{ min: '1', step: '10' }}
                />
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSimulateDemoDeposit}
                  disabled={wallet.loading}
                  sx={{ mb: 2 }}
                >
                  {wallet.loading ? <CircularProgress size={24} /> : 'Add Demo Funds'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleGetDepositAddress}
                  disabled={wallet.loading}
                  sx={{ mb: 2 }}
                >
                  {wallet.loading ? <CircularProgress size={24} /> : 'Generate Deposit Address'}
                </Button>

                {wallet.depositAddress && (
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Deposit Address
                      </Typography>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: '#f5f5f5',
                          borderRadius: 1,
                          mb: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            wordBreak: 'break-all',
                            flex: 1
                          }}
                        >
                          {wallet.depositAddress.depositAddress}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={handleCopyAddress}
                          sx={{ ml: 1 }}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      {copied && (
                        <Chip
                          label="Copied!"
                          color="success"
                          size="small"
                          sx={{ mb: 2 }}
                        />
                      )}

                      <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                        Expires: {wallet.depositAddress.expiresAt ? new Date(wallet.depositAddress.expiresAt).toLocaleString() : 'N/A'}
                      </Typography>

                      {/* QR Code */}
                      <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <QRCode
                          value={wallet.depositAddress.depositAddress || ''}
                          level="H"
                          includeMargin={true}
                          size={200}
                        />
                        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                          Scan to copy address
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </Box>
        )}

        {/* WITHDRAW TAB */}
        {tabValue === 1 && (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {wallet.demoMode ? 'Demo Withdrawal' : 'Withdraw Crypto'}
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Coin Type"
                  value={coinType}
                  onChange={(e) => setCoinType(e.target.value)}
                  fullWidth
                  size="small"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="ETH">ETH</option>
                  <option value="BTC">BTC</option>
                  <option value="BNB">BNB</option>
                  <option value="TRX">TRX</option>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Token Type"
                  value={tokenType}
                  onChange={(e) => setTokenType(e.target.value)}
                  fullWidth
                  size="small"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                  <option value="ZELO">ZELO</option>
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="Amount"
              type="number"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
              inputProps={{ min: '0', step: '0.01' }}
            />

            <TextField
              label={wallet.demoMode ? 'Wallet Address (optional)' : 'Destination Wallet Address'}
              value={withdrawalAddress}
              onChange={(e) => setWithdrawalAddress(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
              placeholder="0x..."
            />

            {withdrawalAmount && (
              <Card sx={{ mb: 2, bgcolor: '#f9f9f9' }}>
                <CardContent>
                  <Typography variant="subtitle2">Fee Breakdown</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Amount:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {withdrawalAmount} {tokenType}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Network Fee:</Typography>
                    <Typography variant="body2">
                      {wallet.demoMode ? '0' : '~0.01'} {tokenType}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Platform Fee (1%):</Typography>
                    <Typography variant="body2">
                      {(parseFloat(withdrawalAmount) * 0.01).toFixed(2)} {tokenType}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Final Amount:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {(parseFloat(withdrawalAmount) - (wallet.demoMode ? 0 : 0.01) - (parseFloat(withdrawalAmount) * 0.01)).toFixed(2)} {tokenType}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            <Button
              variant="contained"
              color={wallet.demoMode ? 'success' : 'primary'}
              fullWidth
              onClick={handleProcessWithdrawal}
              disabled={wallet.loading || !withdrawalAmount}
            >
              {wallet.loading ? <CircularProgress size={24} /> : (wallet.demoMode ? 'Demo Withdraw' : 'Withdraw')}
            </Button>
          </Box>
        )}

        {/* HISTORY TAB */}
        {tabValue === 2 && (
          <Box sx={{ py: 2 }}>
            <Tabs value={tabValue === 2 ? 0 : 1} variant="fullWidth" sx={{ mb: 2 }}>
              <Tab label="Withdrawals" />
              <Tab label="Deposits" />
            </Tabs>

            {/* Withdrawals Table */}
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {wallet.withdrawalHistory.length > 0 ? (
                    wallet.withdrawalHistory.slice(0, 5).map((withdrawal) => (
                      <TableRow key={withdrawal._id}>
                        <TableCell sx={{ fontSize: '0.875rem' }}>
                          {new Date(withdrawal.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem' }}>
                          {withdrawal.amount} {withdrawal.tokenType}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={getStatusIcon(withdrawal.status)}
                            label={withdrawal.status}
                            size="small"
                            color={getStatusColor(withdrawal.status)}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ textAlign: 'center', py: 3 }}>
                        No withdrawals yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Deposits Table */}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Recent Deposits</Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {wallet.depositHistory.length > 0 ? (
                    wallet.depositHistory.slice(0, 5).map((deposit) => (
                      <TableRow key={deposit._id}>
                        <TableCell sx={{ fontSize: '0.875rem' }}>
                          {new Date(deposit.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem' }}>
                          {deposit.amount} {deposit.tokenType}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={getStatusIcon(deposit.status)}
                            label={deposit.status}
                            size="small"
                            color={getStatusColor(deposit.status)}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ textAlign: 'center', py: 3 }}>
                        No deposits yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleOnClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WalletModal;
