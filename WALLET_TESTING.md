# Wallet System - Quick Setup & Testing Guide

## Installation & Setup

### 1. Backend Setup (Already Done)
All backend files are in place and ready:
- ✅ Models created (Withdrawal, Deposit, UserModel extended)
- ✅ Controllers created (walletController.js)
- ✅ Routes configured (paymentRouter.js)
- ✅ Config updated (baseConfig.js)

### 2. Frontend Setup (Already Done)
- ✅ Redux slice created (walletSlice.js)
- ✅ API service created (walletApi.js)
- ✅ WalletModal updated with new UI
- ✅ qrcode.react installed

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd "/home/alex/Desktop/My Projects/Durchex Casino/Web3-Casino-Crash-Game-Gamefi/backend"
npm run dev
# Listens on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd "/home/alex/Desktop/My Projects/Durchex Casino/Web3-Casino-Crash-Game-Gamefi/frontend"
npm start
# Opens on http://localhost:3000
```

**Terminal 3 - MongoDB (if not running):**
```bash
mongod
# Listens on localhost:27017
```

## Manual Testing Steps

### Test 1: Verify Installation
1. Open browser to http://localhost:3000
2. Check console for any errors
3. Verify wallet button appears in header

### Test 2: Demo Mode - Initial Balance
1. Login with a test wallet
2. Click "Wallet" button in header
3. Look for "🎮 DEMO MODE ACTIVE" badge
4. Verify switch toggle is ON
5. Expected: Should show demo balance loaded

### Test 3: Demo Mode - Deposit
1. In Wallet Modal, click "Deposit" tab
2. Select coin type (e.g., "ETH")
3. Select token type (e.g., "USDC")
4. Enter amount (e.g., "100")
5. Click "Add Demo Funds"
6. Expected: Request completes, balance increases by 100

### Test 4: Demo Mode - Withdrawal
1. Click "Withdraw" tab
2. Keep amount (e.g., "50")
3. Enter any wallet address (in demo mode it's optional)
4. Observe fee breakdown:
   - Amount: 50 USDC
   - Network Fee: 0
   - Platform Fee (1%): 0.50 USDC
   - Final Amount: 49.50 USDC
5. Click "Demo Withdraw"
6. Expected: Withdrawal succeeds instantly, shows in history

### Test 5: Demo Mode - History
1. Click "History" tab
2. Verify both withdrawals and deposits show
3. Check status is "confirmed" (instant in demo)
4. Dates should match current date
5. Expected: All demo transactions listed

### Test 6: Real Mode - Toggle
1. Click the toggle switch from DEMO to REAL
2. Expected:
   - Badge changes to "💰 REAL MODE ACTIVE"
   - Colors adjust
   - Withdrawal has network fees
   - Deposits require blockchain confirmation

### Test 7: Real Mode - QR Code
1. In Deposit tab (Real Mode)
2. Click "Generate Deposit Address"
3. Wait for API response
4. Expected:
   - Deposit address appears
   - QR code displays below address
   - Copy button works
   - Can scan QR code with phone

### Test 8: API Response Inspection
1. Open DevTools (F12) > Network tab
2. Perform a demo deposit
3. In Network tab, find POST to `/v0/payment/demo/simulate-deposit`
4. Click it and check Response tab
5. Expected response format:
```json
{
  "status": true,
  "message": "Demo deposit simulated successfully",
  "newBalance": {
    "USDC": 1100,
    "USDT": 1000,
    "ZELO": 1000
  }
}
```

### Test 9: Error Handling
1. Try withdrawal without entering address
2. Expected: Alert says "Please fill in all fields"
3. Try withdrawal with amount exceeding balance
4. Expected: Error from backend (insufficent balance)
5. Check console for Redux errors
6. Expected: No red errors in console

### Test 10: Redux State
1. Open DevTools > Redux extension (if installed)
2. Perform demo deposit
3. Watch Redux actions:
   - `wallet/simulateDemoDeposit/pending`
   - `wallet/simulateDemoDeposit/fulfilled`
4. Check state tree shows updated balance
5. Expected: All actions properly traced

## Troubleshooting

### Issue: "Cannot find module walletApi"
**Solution:** Ensure file exists at `frontend/src/api/walletApi.js`
```bash
ls -la frontend/src/api/walletApi.js
```

### Issue: "wallet is not defined" in Redux
**Solution:** Check that walletSlice is imported in reducers/index.js
```bash
grep -n "wallet" frontend/src/redux/reducers/index.js
```

### Issue: QR code not showing
**Solution:** Verify qrcode.react is installed
```bash
cd frontend && npm list qrcode.react
```

### Issue: API returns 404 for wallet endpoints
**Solution:** Verify backend routes are configured
```bash
grep -n "demo/balance\|withdrawal\|deposit" backend/routes/paymentRouter.js
```

### Issue: Balance not updating after deposit
**Solution:** Check browser console for errors, verify Redux dispatch working
1. Open DevTools Console
2. Check for red errors
3. Try Redux extension timeline
4. Check Network tab for failed API calls

## Test Data for Manual Testing

### Test Wallet Addresses (for demo withdrawal)
These won't actually receive funds in demo mode, but are valid formats:
- Ethereum: `0x742d35Cc6634C0532925a3b844Bc9e7595f42bB0`
- Bitcoin: `1A1z7agoat8RUX8SEVd3Aw9gAu6qL8Z7xf`
- Binance: `0x95222290DD7D6B529A9955fa78f41f6D2B89B696`

### Test Amounts
- Small: 0.10 tokens
- Medium: 50 tokens
- Large: 500 tokens
- Max demo balance: 1000 tokens each

## Expected Console Logs

When running properly, you should see:

**Frontend Console:**
```
Fetching demo balance...
Balance loaded successfully
Demo withdrawal initiated
Withdrawal processed in 234ms
```

**Backend Console:**
```
POST /v0/payment/demo/balance 200 12ms
POST /v0/payment/demo/simulate-deposit 200 45ms
POST /v0/payment/withdrawal/process 200 67ms
```

## Performance Expectations

- Demo balance load: < 100ms
- Deposit address generation: < 200ms
- Withdrawal processing: < 100ms
- History retrieval: < 150ms
- QR code rendering: < 50ms

If tests take significantly longer, check:
1. Database connection health
2. API response times in Network tab
3. Redux selector performance
4. Browser memory usage

## Success Criteria Checklist

- [ ] Wallet button appears in header
- [ ] WalletModal opens and closes properly
- [ ] Demo mode toggle shows/hides appropriately
- [ ] Demo balance initializes to 1000 each
- [ ] Deposit increases demo balance
- [ ] Withdrawal decreases demo balance
- [ ] Fee calculations are accurate
- [ ] QR code displays for real mode
- [ ] Transaction history shows all transactions
- [ ] Real mode shows pending status
- [ ] No console errors
- [ ] API calls return proper responses
- [ ] Redux state updates correctly
- [ ] UI is responsive on mobile

## Next Testing Phases

### Phase 2: Real Crypto Integration
- Configure Tatum API credentials
- Test actual blockchain deposits
- Verify webhook for confirmations
- Test real withdrawals to addresses

### Phase 3: Load Testing
- Simulate 100+ users depositing/withdrawing
- Check database query performance
- Monitor API response times
- Verify no race conditions

### Phase 4: Security Testing
- Test address validation
- Test balance overflow/underflow
- Test unauthorized access
- Test SQL injection in address field
- Test XSS in transaction display

## File Locations for Reference

```
Backend:
├── backend/models/UserModel.js (MODIFIED - added demoBalance, demoMode)
├── backend/models/WithdrawalModel.js (NEW)
├── backend/models/DepositModel.js (NEW)
├── backend/models/index.js (MODIFIED - exported new models)
├── backend/controllers/walletController.js (NEW)
└── backend/routes/paymentRouter.js (MODIFIED - 8 new routes)

Frontend:
├── frontend/src/config/baseConfig.js (MODIFIED - new endpoints)
├── frontend/src/api/walletApi.js (NEW)
├── frontend/src/redux/walletSlice.js (NEW)
├── frontend/src/redux/reducers/index.js (MODIFIED - added wallet reducer)
└── frontend/src/views/main/modals/WalletModal.jsx (REPLACED - new UI)

Documentation:
├── WALLET_IMPLEMENTATION.md (THIS FILE) - Complete technical specs
└── WALLET_TESTING.md (THIS FILE) - Testing guide
```

## Reverting Changes (If Needed)

To completely remove all wallet changes:

```bash
# Backend
git checkout backend/models/UserModel.js
git checkout backend/models/index.js
git checkout backend/routes/paymentRouter.js
git rm backend/models/WithdrawalModel.js
git rm backend/models/DepositModel.js
git rm backend/controllers/walletController.js

# Frontend
npm uninstall qrcode.react
git checkout frontend/src/config/baseConfig.js
git checkout frontend/src/redux/reducers/index.js
git checkout frontend/src/views/main/modals/WalletModal.jsx
git rm frontend/src/api/walletApi.js
git rm frontend/src/redux/walletSlice.js
```

## Support & Debugging

If you encounter issues:

1. **Check logs**: Backend console for error messages
2. **Inspect network**: DevTools Network tab for API responses
3. **Verify Redux**: Redux DevTools extension for state changes
4. **Test independently**: Use Postman to test API endpoints
5. **Review documentation**: See WALLET_IMPLEMENTATION.md for architecture

## Success!

Once all tests pass, the complete wallet system is ready for:
1. Production deployment
2. Real cryptocurrency integration
3. User beta testing
4. Full casino platform launch

The system supports:
- ✅ Demo mode testing (DONE)
- ✅ Real crypto transfers (Ready for integration)
- ✅ Complete transaction history (DONE)
- ✅ Multi-chain support (Architecture ready)
- ✅ Fee management (DONE)
- ✅ User balance tracking (DONE)
