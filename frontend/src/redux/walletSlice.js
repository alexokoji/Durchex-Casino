import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import walletApi from '../api/walletApi';

// Async Thunks
export const fetchDemoBalance = createAsyncThunk(
  'wallet/fetchDemoBalance',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await walletApi.getDemoBalance(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch demo balance');
    }
  }
);

export const toggleDemoMode = createAsyncThunk(
  'wallet/toggleDemoMode',
  async ({ userId, demoMode }, { rejectWithValue }) => {
    try {
      const response = await walletApi.toggleDemoMode(userId, demoMode);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle demo mode');
    }
  }
);

export const simulateDemoDeposit = createAsyncThunk(
  'wallet/simulateDemoDeposit',
  async ({ userId, coinType, chain, amount }, { rejectWithValue }) => {
    try {
      const response = await walletApi.simulateDemoDeposit(userId, coinType, chain, amount);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to simulate deposit');
    }
  }
);

export const fetchDepositAddress = createAsyncThunk(
  'wallet/fetchDepositAddress',
  async ({ userId, coinType, chain, tokenType }, { rejectWithValue }) => {
    try {
      const response = await walletApi.getOrCreateDepositAddress(userId, coinType, chain, tokenType);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch deposit address');
    }
  }
);

export const fetchDepositHistory = createAsyncThunk(
  'wallet/fetchDepositHistory',
  async ({ userId, limit = 10, skip = 0 }, { rejectWithValue }) => {
    try {
      const response = await walletApi.getDepositHistory(userId, limit, skip);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch deposit history');
    }
  }
);

export const processWithdrawal = createAsyncThunk(
  'wallet/processWithdrawal',
  async ({ userId, coinType, chain, amount, address, tokenType }, { rejectWithValue }) => {
    try {
      const response = await walletApi.processWithdrawal(userId, coinType, chain, amount, address, tokenType);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process withdrawal');
    }
  }
);

export const fetchWithdrawalHistory = createAsyncThunk(
  'wallet/fetchWithdrawalHistory',
  async ({ userId, limit = 10, skip = 0 }, { rejectWithValue }) => {
    try {
      const response = await walletApi.getWithdrawalHistory(userId, limit, skip);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch withdrawal history');
    }
  }
);

export const fetchWithdrawalStatus = createAsyncThunk(
  'wallet/fetchWithdrawalStatus',
  async (withdrawalId, { rejectWithValue }) => {
    try {
      const response = await walletApi.getWithdrawalStatus(withdrawalId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch withdrawal status');
    }
  }
);

const initialState = {
  demoBalance: null,
  demoMode: true,
  depositAddress: null,
  depositHistory: [],
  withdrawalHistory: [],
  currentWithdrawal: null,
  loading: false,
  error: null,
  success: null
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch Demo Balance
    builder
      .addCase(fetchDemoBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDemoBalance.fulfilled, (state, action) => {
        state.loading = false;
        // store full demo balance data (chips may be present)
        // previously we filtered to USDT/ZELO only, which removed chips entries
        const data = action.payload.data;
        state.demoBalance = Array.isArray(data?.data) ? { data: data.data } : data;
        state.demoMode = action.payload.demoMode;
      })
      .addCase(fetchDemoBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Toggle Demo Mode
    builder
      .addCase(toggleDemoMode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleDemoMode.fulfilled, (state, action) => {
        state.loading = false;
        state.demoMode = action.payload.demoMode;
        state.success = 'Demo mode toggled successfully';
      })
      .addCase(toggleDemoMode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Simulate Demo Deposit
    builder
      .addCase(simulateDemoDeposit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(simulateDemoDeposit.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.newBalance) {
          const nb = action.payload.newBalance;
          state.demoBalance = Array.isArray(nb?.data) ? { data: nb.data } : nb;
        }
        state.success = 'Demo deposit simulated successfully';
      })
      .addCase(simulateDemoDeposit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Deposit Address
    builder
      .addCase(fetchDepositAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepositAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.depositAddress = action.payload.data;
      })
      .addCase(fetchDepositAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Deposit History
    builder
      .addCase(fetchDepositHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepositHistory.fulfilled, (state, action) => {
        state.loading = false;
        const allowed = ['USDT','ZELO'];
        state.depositHistory = (action.payload.data || []).filter(rec => allowed.includes(rec.coinType));
      })
      .addCase(fetchDepositHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Process Withdrawal
    builder
      .addCase(processWithdrawal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(processWithdrawal.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWithdrawal = action.payload.withdrawal;
        state.success = 'Withdrawal processed successfully';
      })
      .addCase(processWithdrawal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Withdrawal History
    builder
      .addCase(fetchWithdrawalHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWithdrawalHistory.fulfilled, (state, action) => {
        state.loading = false;
        const allowed = ['USDT','ZELO'];
        state.withdrawalHistory = (action.payload.data || []).filter(rec => allowed.includes(rec.coinType));
      })
      .addCase(fetchWithdrawalHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Withdrawal Status
    builder
      .addCase(fetchWithdrawalStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWithdrawalStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWithdrawal = action.payload.data;
      })
      .addCase(fetchWithdrawalStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearSuccess } = walletSlice.actions;
export default walletSlice.reducer;
