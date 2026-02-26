# Fiat Withdrawal Testing Guide

## ✅ Implementation Complete

Fiat withdrawal functionality has been fully integrated into the WalletDepositModal. Users can now withdraw funds via bank transfer through Flutterwave.

---

## 🎯 Features

### Frontend Changes
- **Dual-Mode Withdraw Tab:** Users can toggle between "Crypto" and "Fiat" withdrawal options
- **Fiat Withdrawal Form:** Collects amount, currency, bank details, and email
- **Form Validation:** Validates all required fields before submission
- **Demo Mode Support:** When `REACT_APP_DEMO_MODE=true`, fiat withdrawals are simulated instantly

### Backend Changes
- **New Endpoint:** `POST /api/v0/payments/fiat/withdraw`
- **Demo Mode:** Deducts from `user.demoBalance` instead of real balance
- **Production Mode:** Integrates with Flutterwave Transfers API for real bank payouts
- **Transaction Logging:** Tracks all withdrawals in FlutterwaveTransactionModel

---

## 🧪 Testing Instructions

### Step 1: Start Backend & Frontend

```bash
# Terminal 1: Backend
cd backend
DEMO_MODE=true ENABLE_TATUM_INIT=false npm start

# Terminal 2: Frontend
cd frontend
npm start
```

### Step 2: Access Wallet Modal

1. Log in to the application
2. Click the **"Wallet"** button in the header
3. Verify the modal opens with 4 tabs: Fiat Deposit, Crypto Deposit, Withdraw, History

### Step 3: Test Fiat Withdrawal (Demo Mode)

1. Navigate to the **"Withdraw"** tab (tab 3)
2. Click the **"💵 Fiat"** button to switch to fiat withdrawal mode
3. Fill in the form:
   - **Currency:** USD (or EUR/GBP/NGN)
   - **Amount:** 50
   - **Bank Name:** First Bank
   - **Account Number:** 0123456789
   - **Account Holder Name:** John Doe
   - **Email:** (auto-filled from auth)
4. Click **"💳 Withdraw Fiat"**
5. ✅ Expected: Success message appears, fields are cleared
6. Verify user's `demoBalance` decreased by 50 in the database:
   ```bash
   # In MongoDB
   db.users.findOne({ _id: ObjectId("...") })
   # Check: demoBalance reduced by 50
   ```

### Step 4: Test Crypto Withdrawal (Verify Still Works)

1. Navigate to the **"Withdraw"** tab
2. Click the **"₿ Crypto"** button to switch back to crypto withdrawal
3. Fill in the crypto form:
   - **Coin Type:** ETH
   - **Amount:** 0.5
   - **Recipient Address:** 0x742d35Cc6634C0532925a3b844Bc1e4d9e6eE4C9
   - **Email:** (auto-filled)
4. Click **"📤 Withdraw"**
5. ✅ Expected: Success message appears for crypto withdrawal

### Step 5: Test Form Validation

1. In Fiat Withdrawal form, leave **Amount** blank
2. Click **"💳 Withdraw Fiat"**
3. ✅ Expected: Error message "❌ Fill all required fields"

---

## 📊 API Endpoint Reference

### Fiat Withdrawal Endpoint

**URL:** `POST /api/v0/payments/fiat/withdraw`

**Request Body:**
```json
{
  "userId": "USER_ID",
  "amount": 50,
  "currency": "USD",
  "bankName": "First Bank",
  "accountNumber": "0123456789",
  "accountHolder": "John Doe",
  "email": "john@example.com",
  "isDemo": true
}
```

**Response (Demo Mode):**
```json
{
  "status": true,
  "message": "✅ Demo withdrawal processed successfully",
  "data": {
    "transactionId": "...",
    "amount": 50,
    "currency": "USD",
    "status": "completed"
  }
}
```

**Response (Production Mode):**
```json
{
  "status": true,
  "message": "✅ Withdrawal initiated successfully. Please check your bank account within 1-3 business days.",
  "data": {
    "transactionId": "...",
    "flutterwaveTransferId": "...",
    "amount": 50,
    "currency": "USD",
    "status": "processing"
  }
}
```

---

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```
DEMO_MODE=true
FLUTTERWAVE_API_KEY=your_key_here
FLUTTERWAVE_ENV=staging  # or 'production'
```

**Frontend (.env)**
```
REACT_APP_DEMO_MODE=true
REACT_APP_API_URL=http://localhost:5000
```

### Toggling Demo Mode

- **Demo (Simulated):** Set `DEMO_MODE=true` → withdrawals instant, deduct from `demoBalance`
- **Production (Real):** Set `DEMO_MODE=false` → calls Flutterwave API, deduct from `balance`

---

## 📝 Code Structure

### Frontend Components

**File:** [frontend/src/views/main/modals/WalletDepositModal.jsx](frontend/src/views/main/modals/WalletDepositModal.jsx)

- **State Variables:**
  - `withdrawType` - Toggle between 'crypto' or 'fiat'
  - `fiatWithdrawAmount` - Amount to withdraw
  - `fiatWithdrawCurrency` - Currency (USD/EUR/GBP/NGN)
  - `bankName` - Bank name
  - `accountNumber` - Account number
  - `accountHolder` - Account holder name

- **Handlers:**
  - `handleWithdraw()` - Crypto withdrawal
  - `handleFiatWithdraw()` - Fiat withdrawal (new)

- **UI Elements:**
  - Withdraw type selector (Crypto vs Fiat buttons)
  - Conditional rendering: Crypto form OR Fiat form
  - Bank details input section
  - Submit button with loading state

### Backend Components

**File:** [backend/controllers/flutterwaveController.js](backend/controllers/flutterwaveController.js)

- **New Function:** `exports.initiateWithdrawal()`
  - Validates user balance
  - Checks demo mode flag
  - Demo path: Deducts from `user.demoBalance`
  - Production path: Calls Flutterwave Transfers API
  - Stores transaction in database

**File:** [backend/routes/paymentRouterV2.js](backend/routes/paymentRouterV2.js)

- **New Route:** `POST /api/v0/payments/fiat/withdraw`
  - Maps to `flutterwaveController.initiateWithdrawal()`

---

## ⚠️ Known Limitations

1. **Bank Code Mapping:** Currently accepts any bank name; in production, you should map to Flutterwave bank codes
2. **Account Validation:** No IBAN/account number format validation; consider adding regex validation
3. **Rate Limiting:** No rate limiting on withdraw endpoint; consider adding to prevent abuse
4. **Confirmation:** No withdrawal confirmation prompt; optional to add
5. **Flutterwave Integration:** Works with Flutterwave Transfers API; requires valid API key

---

## 🚀 Next Steps (Optional Enhancements)

1. **Bank Code Mapping:** Create a mapping of bank names to Flutterwave bank codes
2. **Account Validation:** Add IBAN/account number format validation
3. **Email Notifications:** Send confirmation email on successful withdrawal
4. **Withdrawal History:** Display pending withdrawals with status (processing, completed, failed)
5. **Recurring Withdrawals:** Allow users to save bank details for quick future withdrawals
6. **Advanced Verification:** Implement KYC/AML checks for large withdrawals
7. **Webhook Handling:** Add Flutterwave webhook for withdrawal status updates

---

## 📞 Support

If you encounter issues:

1. Check backend logs: Look for error messages in console
2. Check browser console: Network tab for API response errors
3. Verify environment variables are set correctly
4. Ensure MongoDB is running and connected
5. Verify Flutterwave API key is valid (for production mode)

---

## ✨ Summary

- ✅ Fiat withdrawal UI implemented with dual-mode support
- ✅ Backend endpoint created and integrated with routes
- ✅ Demo mode working: simulates withdrawals and credits demo balance
- ✅ Production mode ready: requires Flutterwave API configuration
- ✅ Form validation and error handling in place
- ✅ Transaction logging functional
