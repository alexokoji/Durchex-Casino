# Payment System Integration Guide

## Overview
The application now supports two payment gateways:
1. **Flutterwave** - For fiat payments (cards, bank transfers, mobile money, USSD)
2. **Cryptocurrency** - For crypto deposits (BTC, ETH, BNB, TRX, USDT, USDC)

---

## Required Environment Variables

### Flutterwave Configuration
Add these to your `.env` file:

```env
# Flutterwave API Keys
FLUTTERWAVE_PUBLIC_KEY=<your-flutterwave-public-key>
FLUTTERWAVE_SECRET_KEY=<your-flutterwave-secret-key>

# Flutterwave Environment
FLUTTERWAVE_ENV=staging  # or 'production'

# Flutterwave Webhook URL
FLUTTERWAVE_WEBHOOK_URL=https://yourdomain.com/api/v0/payment/flutterwave/webhook
```

**How to get Flutterwave keys:**
1. Visit https://dashboard.flutterwave.com (staging: https://dashboard.staging.flutterwave.com)
2. Sign up or log in
3. Navigate to Settings → API Keys
4. Copy your Public Key and Secret Key

### Tatum Configuration (for Crypto)
```env
# Tatum API
TATUM_API_KEY=<your-tatum-api-key>
TATUM_ENV=staging  # or 'production'
```

**How to get Tatum API key:**
1. Visit https://tatum.io
2. Sign up for free account
3. Go to Developer Dashboard
4. Navigate to Settings → API Keys
5. Copy your API key

### Application URLs
```env
# Frontend callback URL after payment
FRONTEND_URL=http://localhost:3000  # or your production domain

# Backend webhook listener
BACKEND_URL=http://localhost:5000  # or your production domain
```

---

## Backend Integration Points

### 1. Server Setup
The payment routes are automatically registered in `server.js`:
```javascript
// In your server.js or app.js
const paymentRouter = require('./routes/paymentRouter');
app.use('/api/v0/payment', paymentRouter);
```

### 2. Database Models
The following models are now available:
- `FlutterWavePaymentModel` - Stores Flutterwave transactions
- `CryptoPaymentModel` - Stores crypto transactions

Both models are automatically exported from `backend/models/index.js`

### 3. User Balance Structure
The user balance data is stored in the `UserModel`:
```javascript
{
  balance: {
    data: [
      {
        coinType: "USDT",
        balance: 1000,
        chain: "ETH",
        type: "erc-20"
      },
      {
        coinType: "BTC",
        balance: 0.5,
        chain: "BTC",
        type: "native"
      },
      // ... more coins
    ]
  }
}
```

---

## API Endpoints

### Flutterwave Endpoints

#### 1. Initialize Deposit
**POST** `/api/v0/payment/flutterwave/initialize`
```json
{
  "userId": "user-id-string",
  "amount": 100,
  "currency": "NGN",
  "paymentMethod": "card,bank",
  "customerEmail": "user@example.com",
  "customerPhone": "+2348012345678",
  "customerName": "John Doe"
}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "paymentLink": "https://checkout.flutterwave.com/...",
    "reference": "TX_userid_timestamp",
    "paymentId": "payment-mongo-id",
    "authorizationUrl": "redirect-url"
  }
}
```

#### 2. Verify Payment
**POST** `/api/v0/payment/flutterwave/verify`
```json
{
  "reference": "TX_userid_timestamp"
}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "paymentStatus": "completed",
    "amount": 95,
    "reference": "TX_userid_timestamp"
  }
}
```

#### 3. Initiate Withdrawal
**POST** `/api/v0/payment/flutterwave/withdraw`
```json
{
  "userId": "user-id-string",
  "amount": 100,
  "accountNumber": "0123456789",
  "accountBank": "044", // Bank code
  "bankCode": "044",
  "currency": "NGN",
  "narration": "Withdrawal"
}
```

#### 4. Payment History
**POST** `/api/v0/payment/flutterwave/history`
```json
{
  "userId": "user-id-string",
  "type": "deposit", // or "withdrawal"
  "limit": 50,
  "skip": 0
}
```

---

### Crypto Endpoints

#### 1. Create Deposit Address
**POST** `/api/v0/payment/crypto/address`
```json
{
  "userId": "user-id-string",
  "coinType": "BTC"  // BTC, ETH, BNB, TRX, USDT, USDC
}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "depositAddress": "1A1z7agoat...",
    "coinType": "BTC",
    "chain": "BTC",
    "paymentId": "payment-mongo-id"
  }
}
```

#### 2. Get Deposit Status
**POST** `/api/v0/payment/crypto/status`
```json
{
  "paymentId": "payment-mongo-id"
}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "coinType": "BTC",
    "depositAddress": "1A1z7agoat...",
    "paymentStatus": "completed",
    "amount": 0.5,
    "confirmations": 6,
    "requiredConfirmations": 6,
    "txHash": "hash..."
  }
}
```

#### 3. Initiate Withdrawal
**POST** `/api/v0/payment/crypto/withdraw`
```json
{
  "userId": "user-id-string",
  "coinType": "BTC",
  "toAddress": "1A1z7agoat...",
  "amount": 0.5
}
```

#### 4. Get Supported Coins
**GET** `/api/v0/payment/crypto/supported`

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "code": "BTC",
      "displayName": "Bitcoin",
      "chain": "BTC",
      "decimals": 8
    },
    // ... more coins
  ]
}
```

#### 5. Crypto Payment History
**POST** `/api/v0/payment/crypto/history`
```json
{
  "userId": "user-id-string",
  "coinType": "BTC", // optional
  "type": "deposit", // optional: "deposit" or "withdrawal"
  "limit": 50,
  "skip": 0
}
```

---

## Webhook Handling

### Flutterwave Webhook
- **URL:** `/api/v0/payment/flutterwave/webhook`
- **Triggered by:** Flutterwave on payment completion/status change
- **Verification:** Hash signature in `verification_hash` header
- **Payload:** Full Flutterwave transaction object

### Crypto Webhook
- **URL:** `/api/v0/payment/crypto/webhook`
- **Triggered by:** External crypto payment processor (Tatum, exchange, manual)
- **Required Fields:**
  ```json
  {
    "txHash": "transaction-hash",
    "coinType": "BTC",
    "toAddress": "deposit-address",
    "fromAddress": "sender-address",
    "amount": 0.5,
    "chain": "BTC",
    "confirmations": 6
  }
  ```

---

## Testing the Payment System

### Test Flutterwave (Staging)
1. Use test card: `4242424242424242` (expires 12/25, CVV: 123)
2. Initialize deposit with small amount
3. Complete payment on checkout page
4. Verify payment using reference

### Test Crypto (Manual)
1. Create deposit address
2. Send crypto to deposit address
3. Simulate webhook hit manually:
```bash
curl -X POST http://localhost:5000/api/v0/payment/crypto/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "test-hash",
    "coinType": "BTC",
    "toAddress": "deposit-address",
    "fromAddress": "test-sender",
    "amount": 0.5,
    "chain": "BTC",
    "confirmations": 6
  }'
```

---

## Frontend Integration

### Display Payment Methods
```javascript
// Fetch supported coins
fetch('/api/v0/payment/crypto/supported')
  .then(r => r.json())
  .then(data => console.log(data.data))
```

### Initiate Flutterwave Payment
```javascript
const response = await fetch('/api/v0/payment/flutterwave/initialize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: currentUser._id,
    amount: 100,
    currency: 'NGN',
    paymentMethod: 'card,bank',
    customerEmail: currentUser.email,
    customerPhone: currentUser.phone,
    customerName: currentUser.username
  })
})
```

### Initiate Crypto Deposit
```javascript
const response = await fetch('/api/v0/payment/crypto/address', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: currentUser._id,
    coinType: 'BTC'
  })
})
```

---

## Troubleshooting

### Issue: "Flutterwave keys not configured"
- Verify `FLUTTERWAVE_SECRET_KEY` is set in `.env`
- Check that keys are from the correct environment (staging vs production)

### Issue: "Tatum API error"
- Verify `TATUM_API_KEY` is valid
- Check that `TATUM_ENV` matches your Tatum account type
- Verify account has sufficient API quota

### Issue: "User balance not updating after payment"
- Check MongoDB connection is active
- Verify user ID is valid
- Look at server logs for `markModified` issues
- Ensure `user.markModified('balance')` is called before `save()`

### Issue: "Webhook not triggering balance update"
- Verify webhook URL is publicly accessible
- Check webhook signature verification in logs
- Ensure payment transaction status is "successful" or "completed"
- Verify user is associated with the payment record

---

## Security Considerations

1. **API Keys:** Never commit `.env` file to git
2. **Webhook Verification:** Always verify webhook signatures
3. **HTTPS:** Use HTTPS in production (required for webhooks)
4. **Rate Limiting:** Implement rate limiting on payment endpoints
5. **User Validation:** Always verify user ID before processing payments
6. **Amount Validation:** Validate amounts are positive and within limits
7. **Balance Checks:** Always verify sufficient balance before withdrawals

---

## Next Steps

1. Update frontend to display Flutterwave and crypto payment options
2. Create checkout modal/page with payment method selection
3. Implement transaction history UI
4. Add payment status tracking in user dashboard
5. Set up monitoring for failed payments
6. Create admin dashboard for withdrawal approvals
