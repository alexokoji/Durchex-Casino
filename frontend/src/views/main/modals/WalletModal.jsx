import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  Box,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Modal
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { makeStyles } from '@mui/styles';
import {
  fetchDepositAddress,
  fetchDepositHistory,
  fetchWithdrawalHistory,
  processWithdrawal,
  toggleDemoMode,
  simulateDemoDeposit,
  clearError,
  clearSuccess
} from '../../../redux/walletSlice';

const useStyles = makeStyles((theme) => ({
  ModalBox: {
    marginTop: '100px',
    width: '827px',
    left: '50%',
    transform: 'translate(-50%)',
    background: '#2C2C3A',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '30px',
    '@media (max-width: 681px)': {
      width: '100%',
      borderRadius: '0px'
    }
  },
  ModalBodyBox: {
    width: '100%',
    height: '100%',
    position: 'relative',
    padding: '20px'
  },
  CloseButton: {
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
  TitleBox: {
    fontFamily: "'Styrene A Web'",
    fontStyle: 'normal',
    fontWeight: 900,
    fontSize: '32px',
    lineHeight: '49px',
    textAlign: 'center',
    textTransform: 'uppercase',
    color: '#FFFFFF',
    opacity: 0.5
  },
  PageOptionBox: {
    width: '100%',
    height: '54px',
    marginTop: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '10px'
  },
  PageOptionButton: {
    color: '#FFF',
    textTransform: 'uppercase',
    fontSize: '15px',
    fontWeight: '700',
    height: '100%',
    width: '141px',
    borderRadius: '8px'
  },
  SelectedOption: {
    background: 'linear-gradient(48.57deg, #5A45D1 24.42%, #BA6AFF 88.19%);'
  },
  DemoModeContainer: {
    mb: 3,
    p: 2,
    bgcolor: '#424253',
    borderRadius: 1,
    border: '1px solid #5A45D1',
    marginTop: '20px',
    marginBottom: '20px'
  },
  backdrop: {
    backgroundColor: '#1F1E25',
    opacity: '0.95 !important'
  }
}));

const WalletModal = ({ open, setOpen }) => {
  const classes = useStyles();
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

  const handleGetDepositAddress = async () => {
    if (userId) {
      await dispatch(fetchDepositAddress({ userId, coinType, chain: 'ethereum', tokenType }));
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
    <Modal
      open={open}
      onClose={handleOnClose}
      aria-labelledby="wallet-modal-title"
      aria-describedby="wallet-modal-description"
      slotProps={{ backdrop: { sx: { backdropFilter: 'blur(5px)', background: 'rgba(0, 0, 0, 0.7)' } } }}
    >
      <Box className={classes.ModalBox}>
        <Box className={classes.ModalBodyBox}>
          <IconButton className={classes.CloseButton} onClick={handleOnClose}>
            <CloseIcon />
          </IconButton>
          <Box className={classes.TitleBox}>Wallet</Box>

          {/* Alerts */}
          {wallet.error && (
            <Alert severity="error" sx={{ mb: 2, mt: 2, color: '#FFF' }}>
              {wallet.error}
            </Alert>
          )}
          {wallet.success && (
            <Alert severity="success" sx={{ mb: 2, mt: 2, color: '#FFF' }}>
              {wallet.success}
            </Alert>
          )}

          {/* Demo Mode Toggle */}
          <Box sx={classes.DemoModeContainer}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ fontWeight: 600, color: '#FFF' }}>
                  {wallet.demoMode ? '🎮 DEMO MODE' : '💰 REAL MODE'}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#bbb3b3' }}>
                  {wallet.demoMode 
                    ? 'Test with virtual funds' 
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
          <Box className={classes.PageOptionBox}>
            <Button
              onClick={() => setTabValue(0)}
              className={tabValue === 0 ? `${classes.PageOptionButton} ${classes.SelectedOption}` : classes.PageOptionButton}
            >
              Deposit
            </Button>
            <Button
              onClick={() => setTabValue(1)}
              className={tabValue === 1 ? `${classes.PageOptionButton} ${classes.SelectedOption}` : classes.PageOptionButton}
            >
              Withdraw
            </Button>
            <Button
              onClick={() => setTabValue(2)}
              className={tabValue === 2 ? `${classes.PageOptionButton} ${classes.SelectedOption}` : classes.PageOptionButton}
            >
              History
            </Button>
          </Box>

          {/* DEPOSIT TAB */}
          {tabValue === 0 && (
            <Box sx={{ py: 2 }}>
              <Typography sx={{ color: '#FFF', fontWeight: '600', mb: 2 }}>
                {wallet.demoMode ? '🎮 Demo Deposit' : '💰 Receive Crypto'}
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#FFF',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#424253'
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#FFF'
                      }
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#FFF',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#424253'
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#FFF'
                      }
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
                  <Typography sx={{ color: '#bbb3b3', fontSize: '0.875rem', mb: 2, fontStyle: 'italic' }}>
                    Instantly add demo funds to your wallet for testing
                  </Typography>
                  <TextField
                    label="Amount"
                    type="number"
                    value={demoDepositAmount}
                    onChange={(e) => setDemoDepositAmount(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ 
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        color: '#FFF',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#424253'
                      }
                    }}
                    inputProps={{ min: '1', step: '10' }}
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleSimulateDemoDeposit}
                    disabled={wallet.loading}
                    sx={{ 
                      mb: 2,
                      background: 'linear-gradient(48.57deg, #5A45D1 24.42%, #BA6AFF 88.19%)'
                    }}
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
                    sx={{ 
                      mb: 2,
                      background: 'linear-gradient(48.57deg, #5A45D1 24.42%, #BA6AFF 88.19%)'
                    }}
                  >
                    {wallet.loading ? <CircularProgress size={24} /> : 'Generate Deposit Address'}
                  </Button>

                  {wallet.depositAddress && (
                    <Card sx={{ mt: 2, background: '#424253', border: '1px solid #5A45D1' }}>
                      <CardContent>
                        <Typography sx={{ color: '#FFF', fontWeight: '600', mb: 1 }}>
                          Deposit Address
                        </Typography>
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: '#1a2c38',
                            borderRadius: 1,
                            mb: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <Typography
                            sx={{
                              color: '#FFF',
                              fontFamily: 'monospace',
                              wordBreak: 'break-all',
                              flex: 1,
                              fontSize: '0.75rem'
                            }}
                          >
                            {wallet.depositAddress.depositAddress}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={handleCopyAddress}
                            sx={{ ml: 1, color: '#FFF' }}
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

                        {/* QR Code */}
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                          <QRCode
                            value={wallet.depositAddress.depositAddress || ''}
                            level="H"
                            includeMargin={true}
                            size={150}
                          />
                          <Typography sx={{ color: '#bbb3b3', fontSize: '0.75rem', display: 'block', mt: 1 }}>
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
              <Typography sx={{ color: '#FFF', fontWeight: '600', mb: 2 }}>
                {wallet.demoMode ? '🎮 Demo Withdrawal' : '💰 Withdraw Crypto'}
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#FFF',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#424253'
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#FFF'
                      }
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#FFF',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#424253'
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#FFF'
                      }
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
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: '#FFF',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#424253'
                  }
                }}
                inputProps={{ min: '0', step: '0.01' }}
              />

              <TextField
                label={wallet.demoMode ? 'Wallet Address (optional)' : 'Destination Wallet Address'}
                value={withdrawalAddress}
                onChange={(e) => setWithdrawalAddress(e.target.value)}
                fullWidth
                size="small"
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: '#FFF',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#424253'
                  }
                }}
                placeholder="0x..."
              />

              {withdrawalAmount && (
                <Card sx={{ mb: 2, bgcolor: '#424253', border: '1px solid #5A45D1' }}>
                  <CardContent>
                    <Typography sx={{ color: '#FFF', fontWeight: '600', fontSize: '0.875rem' }}>Fee Breakdown</Typography>
                    <Divider sx={{ my: 1, backgroundColor: '#5A45D1' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ color: '#bbb3b3', fontSize: '0.875rem' }}>Amount:</Typography>
                      <Typography sx={{ color: '#FFF', fontSize: '0.875rem', fontWeight: 600 }}>
                        {withdrawalAmount} {tokenType}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ color: '#bbb3b3', fontSize: '0.875rem' }}>Network Fee:</Typography>
                      <Typography sx={{ color: '#FFF', fontSize: '0.875rem' }}>
                        {wallet.demoMode ? '0' : '~0.01'} {tokenType}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ color: '#bbb3b3', fontSize: '0.875rem' }}>Platform Fee (1%):</Typography>
                      <Typography sx={{ color: '#FFF', fontSize: '0.875rem' }}>
                        {(parseFloat(withdrawalAmount) * 0.01).toFixed(2)} {tokenType}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1, backgroundColor: '#5A45D1' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: '#bbb3b3', fontWeight: 600, fontSize: '0.875rem' }}>Final Amount:</Typography>
                      <Typography sx={{ color: '#FFF', fontWeight: 600, fontSize: '0.875rem' }}>
                        {(parseFloat(withdrawalAmount) - (wallet.demoMode ? 0 : 0.01) - (parseFloat(withdrawalAmount) * 0.01)).toFixed(2)} {tokenType}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}

              <Button
                variant="contained"
                fullWidth
                onClick={handleProcessWithdrawal}
                disabled={wallet.loading || !withdrawalAmount}
                sx={{
                  background: wallet.demoMode 
                    ? 'linear-gradient(48.57deg, #4A9D55 24.42%, #6BC86E 88.19%)'
                    : 'linear-gradient(48.57deg, #5A45D1 24.42%, #BA6AFF 88.19%)'
                }}
              >
                {wallet.loading ? <CircularProgress size={24} /> : (wallet.demoMode ? 'Demo Withdraw' : 'Withdraw')}
              </Button>
            </Box>
          )}

          {/* HISTORY TAB */}
          {tabValue === 2 && (
            <Box sx={{ py: 2 }}>
              <Typography sx={{ color: '#FFF', fontWeight: '600', mb: 2 }}>
                Transaction History
              </Typography>

              {/* Withdrawals Table */}
              <Typography sx={{ color: '#FFF', fontWeight: '600', fontSize: '0.875rem', mb: 1 }}>
                Recent Withdrawals
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3, background: '#424253', border: '1px solid #5A45D1' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#1a2c38' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#bbb3b3' }}>Date</TableCell>
                      <TableCell align="right" sx={{ color: '#bbb3b3' }}>Amount</TableCell>
                      <TableCell align="center" sx={{ color: '#bbb3b3' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {wallet.withdrawalHistory.length > 0 ? (
                      wallet.withdrawalHistory.slice(0, 5).map((withdrawal) => (
                        <TableRow key={withdrawal._id} sx={{ '&:hover': { background: '#1a2c38' } }}>
                          <TableCell sx={{ fontSize: '0.875rem', color: '#FFF' }}>
                            {new Date(withdrawal.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#FFF' }}>
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
                        <TableCell colSpan={3} sx={{ textAlign: 'center', py: 3, color: '#bbb3b3' }}>
                          No withdrawals yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Deposits Table */}
              <Typography sx={{ color: '#FFF', fontWeight: '600', fontSize: '0.875rem', mb: 1 }}>
                Recent Deposits
              </Typography>
              <TableContainer component={Paper} sx={{ background: '#424253', border: '1px solid #5A45D1' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#1a2c38' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#bbb3b3' }}>Date</TableCell>
                      <TableCell align="right" sx={{ color: '#bbb3b3' }}>Amount</TableCell>
                      <TableCell align="center" sx={{ color: '#bbb3b3' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {wallet.depositHistory.length > 0 ? (
                      wallet.depositHistory.slice(0, 5).map((deposit) => (
                        <TableRow key={deposit._id} sx={{ '&:hover': { background: '#1a2c38' } }}>
                          <TableCell sx={{ fontSize: '0.875rem', color: '#FFF' }}>
                            {new Date(deposit.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#FFF' }}>
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
                        <TableCell colSpan={3} sx={{ textAlign: 'center', py: 3, color: '#bbb3b3' }}>
                          No deposits yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default WalletModal;
