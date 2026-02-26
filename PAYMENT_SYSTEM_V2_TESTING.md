# Payment System V2 - Testing Guide

## Prerequisites

1. Backend must be running: `cd backend && npm start` (port 5000)
2. MongoDB must be connected and accessible
3. Test user must exist: `699962c34d4fa091e1f5e3fa` (created via createTestUser.js)
4. Flutterwave API key configured in `.env`

## Quick Start

### 1. Ensure Test User Exists

```bash
# From backend directory
node scripts/createTestUser.js
# Output: User ID: 699962c34d4fa091e1f5e3fa
```

### 2. Verify Backend is Running

```bash
curl http://localhost:5000/
# Expected: TEST MODE IN HERE
```

---

## Testing Crypto Payments

### Test 1: Generate Crypto Deposit Address (Demo)

**Request:**
```bash
curl -X POST http://localhost:5000/api/v0/payments/crypto/generate-address \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "699962c34d4fa091e1f5e3fa",
    "coinType": "USDT",
    "chain": "ETH",
    "isDemo": true
  }'
```

**Expected Response:**
```json
{
  "status": true,
  "message": "Demo deposit address generated",
  "data": {
    "paymentId": "payment-id-here",
    "depositAddress": "DEMO_USDT_699962c34d4fa091e1f5e3fa_...",
    "coinType": "USDT",
    "chain": "ETH",
    "amount": 0,
    "status": "pending",
    "requiredConfirmations": 12,
    "expiresAt": "2024-01-02T..."
  }
}
```

### Test 2: Simulate Crypto Deposit

**Request:**
```bash
curl -X POST http://localhost:5000/api/v0/payments/crypto/simulate-deposit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "699962c34d4fa091e1f5e3fa",
    "coinType": "USDT",
    "chain": "ETH",
    "amount": 500
  }'
```

**Expected Response:**
```json
{
  "status": true,
  "message": "✅ 500 USDT deposited successfully!",
  "data": {
    "paymentId": "...",
    "amount": 500,
    "coinType": "USDT",
    "chain": "ETH",
    "status": "confirmed",
    "transactionHash": "DEMO_TX_...",
    "newBalance": 1500
  }
}
```

**Verification:**
Check user balance increased from 1000 to 1500 USDT.

### Test 3: Check Deposit Address Status

**Request:**
```bash
# Use the payment ID from Test 1
curl http://localhost:5000/api/v0/payments/crypto/status/PAYMENT_ID_HERE
```

**Expected Response:**
```json
{
  "status": true,
  "data": {
    "paymentId": "...",
    "depositAddress": "DEMO_USDT_...",
    "coinType": "USDT",
    "chain": "ETH",
    "amount": 0,
    "confirmations": 0,
    "requiredConfirmations": 12,
    "status": "pending",
    "isDemo": true
  }
}
```

### Test 4: Get User Crypto Transactions

**Request:**
```bash
curl http://localhost:5000/api/v0/payments/crypto/transactions/699962c34d4fa091e1f5e3fa
```

**Expected Response:**
```json
{
  "status": true,
  "data": [
    {
      "_id": "...",
      "userId": "699962c34d4fa091e1f5e3fa",
      "coinType": "USDT",
      "chain": "ETH",
      "depositAddress": "DEMO_USDT_...",
      "amount": 500,
      "status": "confirmed",
      "confirmedAt": "2024-01-01T...",
      "isDemo": true
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "skip": 0
  }
}
```

---

## Testing Fiat Payments (Flutterwave)

### Test 5: Initiate Fiat Deposit

**Request:**
```bash
curl -X POST http://localhost:5000/api/v0/payments/fiat/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "699962c34d4fa091e1f5e3fa",
    "amount": 100,
    "currency": "USD",
    "paymentMethod": "card,ussd",
    "email": "test@example.com"
  }'
```

**Expected Response:**
```json
{
  "status": true,
  "message": "Payment initiated successfully",
  "paymentLink": "https://checkout.flutterwave.com/pay/...",
  "transactionId": "transaction-id-here",
  "redirectUrl": "https://checkout.flutterwave.com/pay/..."
}
```

**Note:** In sandbox mode, payment link will be for testing. Use demo card details provided by Flutterwave.

### Test 6: Get Fiat Payment Status

**Request:**
```bash
# Use the transactionId from Test 5
curl http://localhost:5000/api/v0/payments/fiat/status/TRANSACTION_ID_HERE
```

**Expected Response:**
```json
{
  "status": true,
  "data": {
    "transactionId": "...",
    "status": "pending",
    "amount": 100,
    "currency": "USD",
    "createdAt": "2024-01-01T...",
    "completedAt": null
  }
}
```

### Test 7: Get User Fiat Transactions

**Request:**
```bash
curl http://localhost:5000/api/v0/payments/fiat/transactions/699962c34d4fa091e1f5e3fa
```

**Expected Response:**
```json
{
  "status": true,
  "data": [
    {
      "_id": "...",
      "userId": "699962c34d4fa091e1f5e3fa",
      "amount": 100,
      "currency": "USD",
      "paymentMethod": "card",
      "status": "pending",
      "customerEmail": "test@example.com"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "skip": 0
  }
}
```

---

## Testing Unified Payment Endpoints

### Test 8: Get All Transactions (Both Fiat + Crypto)

**Request:**
```bash
curl http://localhost:5000/api/v0/payments/transactions/699962c34d4fa091e1f5e3fa
```

**Expected Response:**
```json
{
  "status": true,
  "data": [
    {
      "_id": "...",
      "paymentId": "CRYPTO-...",
      "paymentMethod": "crypto",
      "type": "deposit",
      "status": "completed",
      "amountRequested": 500,
      "amountReceived": 500,
      "currencyCode": "USDT",
      "initiatedAt": "2024-01-01T...",
      "completedAt": "2024-01-01T..."
    },
    {
      "_id": "...",
      "paymentId": "FW-...",
      "paymentMethod": "flutterwave",
      "type": "deposit",
      "status": "pending",
      "amountRequested": 100,
      "currencyCode": "USD",
      "initiatedAt": "2024-01-01T...",
      "completedAt": null
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 50,
    "skip": 0
  }
}
```

### Test 9: Get Specific Transaction Details

**Request:**
```bash
# Use the _id from any transaction in Test 8
curl http://localhost:5000/api/v0/payments/transaction/TRANSACTION_ID_HERE
```

**Expected Response:**
```json
{
  "status": true,
  "data": {
    "_id": "...",
    "paymentId": "CRYPTO-...",
    "paymentMethod": "crypto",
    "type": "deposit",
    "status": "completed",
    "amountRequested": 500,
    "amountReceived": 500,
    "currencyCode": "USDT",
    "cryptoPaymentId": {
      "_id": "...",
      "coinType": "USDT",
      "chain": "ETH",
      "status": "confirmed"
    },
    "flutterwaveTransactionId": null
  }
}
```

---

## Supported Coin Types for Crypto

| Coin  | Chain | Native? |
|-------|-------|---------|
| BTC   | BTC   | ✓       |
| ETH   | ETH   | ✓       |
| USDT  | ETH   | Token   |
| USDC  | ETH   | Token   |
| BNB   | BSC   | ✓       |
| TRX   | TRON  | ✓       |
| BUSD  | BSC   | Token   |

---

## Verification Checklist

### After Each Test

- [ ] Response status is `true`
- [ ] Response includes expected data fields
- [ ] No "error" or "message" fields indicating failure
- [ ] Timestamps are in ISO 8601 format
- [ ] Database record Created (check MongoDB directly if needed)

### End-to-End Verification

1. **Crypto Flow:**
   - [ ] Simulate deposit adds funds to user balance
   - [ ] Deposit reflected in getDemoBalance
   - [ ] Transaction appears in history

2. **Fiat Flow:**
   - [ ] Payment link generated successfully
   - [ ] Transaction created in database
   - [ ] Status can be queried

3. **Unified Flow:**
   - [ ] Both crypto and fiat transactions appear in unified list
   - [ ] Can filter/query by userIdand payment method

---

## Debugging

### Check User Balance
```bash
curl -X POST http://localhost:5000/api/v0/payment/getDemoBalance \
  -H "Content-Type: application/json" \
  -d '{"userId": "699962c34d4fa091e1f5e3fa"}'
```

### Check MongoDB Directly
```bash
# Connect to MongoDB
mongo "mongodb+srv://durchex-casino:Durchex2025@@durchec-casino.cnc7vaa.mongodb.net/?appName=Durchec-Casino"

# Check crypto payments
db.CryptoPayments.find({userId: ObjectId("699962c34d4fa091e1f5e3fa")})

# Check fiat payments
db.FlutterwaveTransactions.find({userId: ObjectId("699962c34d4fa091e1f5e3fa")})

# Check unified payments
db.UnifiedPayments.find({userId: ObjectId("699962c34d4fa091e1f5e3fa")})

# Check user balance
db.Users.findOne({_id: ObjectId("699962c34d4fa091e1f5e3fa")}, {demoBalance: 1})
```

### Check Backend Logs
Look for console output in the backend terminal:
- `📦 Webhook received` - Webhook processing
- `✅ Added X coins to user` - Balance update
- `❌` - Error messages
- `⏳` - Status updates

### Common Issues

**Issue:** Payment created but balance not updated
- **Solution:** Restart backend, ensure `markModified()` is called before save()

**Issue:** 404 Not Found on endpoints
- **Solution:** Verify payment system router is registered in backend/routes/index.js

**Issue:** "User not found" error
- **Solution:** Verify userId exists, run createTestUser.js if needed

**Issue:** Flutterwave API errors
- **Solution:** Check API key in .env, verify Flutterwave account has API access

---

## Next Steps After Verification

1. **Frontend Integration:**
   - Create FiatDepositModal component
   - Create CryptoDepositModal component
   - Add payment button to wallet modal

2. **Production Deployment:**
   - Switch Flutterwave API key from sandbox to production
   - Update FLUTTERWAVE_ENV to "production"
   - Configure proper webhook URLs

3. **Monitoring:**
   - Set up webhook retry logic
   - Add payment state monitoring
   - Log all payment events for auditing
