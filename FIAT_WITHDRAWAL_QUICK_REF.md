# Fiat Withdrawal - Quick Integration Guide

## 🎯 What Was Added (TL;DR)

Users can now withdraw fiat money via bank transfer through Flutterwave, in addition to crypto withdrawals.

---

## 📱 User Flow

```
1. Click "Wallet" button in header
   ↓
2. Go to "Withdraw" tab
   ↓
3. Click "💵 Fiat" to switch from crypto
   ↓
4. Fill bank details:
   - Amount
   - Currency (USD/EUR/GBP/NGN)
   - Bank Name
   - Account Number
   - Account Holder Name
   - Email (auto-filled)
   ↓
5. Click "💳 Withdraw Fiat"
   ↓
6. See success/error message
   ↓
7. Demo mode: Instant (deducts from demo balance)
   Production: Pending (1-3 business days)
```

---

## 🛠️ Developer Integration Points

### 1. Frontend State Management
```javascript
// In WalletDepositModal.jsx
const [withdrawType, setWithdrawType] = useState('crypto'); // 'crypto' or 'fiat'
const [fiatWithdrawAmount, setFiatWithdrawAmount] = useState('');
const [fiatWithdrawCurrency, setFiatWithdrawCurrency] = useState('USD');
const [bankName, setBankName] = useState('');
const [accountNumber, setAccountNumber] = useState('');
const [accountHolder, setAccountHolder] = useState('');
```

### 2. Frontend API Call
```javascript
// handleFiatWithdraw() function
const res = await axios.post(
  `${process.env.REACT_APP_API_URL}/api/v0/payments/fiat/withdraw`,
  {
    userId,
    amount: parseFloat(fiatWithdrawAmount),
    currency: fiatWithdrawCurrency,
    bankName,
    accountNumber,
    accountHolder,
    email: withdrawEmail,
    isDemo: DEMO_MODE
  }
);
```

### 3. Backend Endpoint
```
POST /api/v0/payments/fiat/withdraw
Handler: flutterwaveController.initiateWithdrawal()
```

### 4. Backend Processing
```javascript
// Demo mode (DEMO_MODE=true):
user.demoBalance -= amount;
// Store transaction with status: 'completed'
// Return immediately

// Production mode (DEMO_MODE=false):
// Call Flutterwave Transfers API
// user.balance -= amount;
// Store transaction with status: 'processing'
// Return after 1-3 business days
```

---

## 🔄 Mode Toggle

### Demo Mode (Testing)
```bash
DEMO_MODE=true npm start
```
- ✓ Instant withdrawals
- ✓ Deducts from demoBalance
- ✓ No real bank transfers
- ✓ Perfect for testing UI flow

### Production Mode (Live)
```bash
DEMO_MODE=false npm start
```
- ✓ Real bank transfers via Flutterwave
- ✓ Deducts from real balance
- ✓ Requires valid API key
- ✓ Takes 1-3 business days

---

## ✅ Requirements Check

### Frontend
- [x] Withdraw type selector (Crypto/Fiat toggle)
- [x] Fiat withdrawal form with all required fields
- [x] Form validation before submission
- [x] Loading state during submission
- [x] Error/success messaging
- [x] Demo mode support

### Backend
- [x] New endpoint: POST /api/v0/payments/fiat/withdraw
- [x] Validate user and balance
- [x] Demo mode: instant processing
- [x] Production mode: Flutterwave API integration
- [x] Error handling
- [x] Transaction logging

### Database
- [x] FlutterwaveTransactionModel supports withdrawals
- [x] UserModel has balance fields for demo/real
- [x] Transaction type distinction (deposit/withdrawal)

---

## 🧪 Quick Test

1. **Start Services:**
   ```bash
   cd backend
   DEMO_MODE=true ENABLE_TATUM_INIT=false npm start
   
   cd frontend
   npm start
   ```

2. **In Browser:**
   - Log in with test user
   - Click "Wallet" button
   - Click "Withdraw" tab
   - Click "💵 Fiat"
   - Fill form with test data
   - Click "💳 Withdraw Fiat"
   - See success message

3. **Verify in Database:**
   ```javascript
   // MongoDB
   db.users.findOne({ _id: ObjectId("USER_ID") })
   // Check: demoBalance decreased by withdrawal amount
   
   db.flutterwavetransactions.findOne({ 
     userId: ObjectId("USER_ID"), 
     type: "withdrawal" 
   })
   // Check: Transaction saved with status "completed"
   ```

---

## 📊 Data Flow

```
Frontend                Backend                    Database
┌─────────────┐         ┌──────────────────┐      ┌──────────┐
│   Fiat      │         │ Validate user    │      │  Users   │
│ Withdrawal  │────────▶│ Check balance    │      │  Table   │
│    Form     │         │                  │      └──────────┘
└─────────────┘         │ Demo mode?       │      ┌──────────┐
                        │  YES: deduct     │      │ Flutterwave
                        │       demoBalance│────▶ │ Txns     │
                        │  NO: call API    │      │  Table   │
                        │                  │      └──────────┘
                        │ Store transaction│
                        └──────────────────┘
```

---

## 🎯 Key Features

| Feature | Demo Mode | Production Mode |
|---------|-----------|-----------------|
| Transfer Time | Instant | 1-3 days |
| Balance Used | demoBalance | balance |
| API Call | None | Flutterwave |
| Use Case | Testing | Live withdrawals |
| Status | completed | processing |

---

## 📝 Code Locations

| Component | File | What |
|-----------|------|------|
| UI Form | [frontend/src/views/main/modals/WalletDepositModal.jsx](frontend/src/views/main/modals/WalletDepositModal.jsx#L400) | Fiat withdraw tab |
| Handler | [frontend/src/views/main/modals/WalletDepositModal.jsx](frontend/src/views/main/modals/WalletDepositModal.jsx#L310) | handleFiatWithdraw() |
| API Logic | [backend/controllers/flutterwaveController.js](backend/controllers/flutterwaveController.js#L268) | initiateWithdrawal() |
| Route | [backend/routes/paymentRouterV2.js](backend/routes/paymentRouterV2.js#L14) | POST /fiat/withdraw |

---

## ⚠️ Important Notes

1. **Balance Check:** Prevents users from withdrawing more than available
2. **Field Validation:** All fields required before submission
3. **Demo Safety:** Demo withdrawals use separate balance field
4. **Error Handling:** User-friendly error messages
5. **Production Ready:** Demo mode fully functional, production requires Flutterwave config

---

## 🚀 To Go Live

1. Get Flutterwave API key
2. Set `DEMO_MODE=false` in backend
3. Add bank code mapping for your region
4. Test with small amount first
5. Monitor Flutterwave dashboard
6. Set up email notifications
7. Consider adding KYC verification

---

## 💬 Summary

**What's new:** Users can withdraw fiat via bank transfer through Flutterwave.

**How to use:**
- Demo: Set `DEMO_MODE=true`, test instantly with fake withdrawals
- Production: Set `DEMO_MODE=false`, real bank transfers take 1-3 days

**Status:** ✅ Ready to test in demo mode, ready to deploy with Flutterwave config

---

**Last Updated:** [Current Session]  
**Status:** Production Ready (Demo), Deployment Ready (Production)
