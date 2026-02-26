# USDT (TRC20) Integration Guide

## Overview
Your casino now accepts **USDT (Tether) on TRC20 network only** for crypto deposits via Blockonomics.

## Implementation Summary

### ✅ What Was Changed

#### Backend
- **blockonomicsController.js** - Completely rewritten for USDT-only support
  - `generateUSDTAddress()` - Creates USDT deposit addresses via Blockonomics API
  - `handleBlockonomicsCallback()` - Processes payment confirmations
  - `simulateUSDTDeposit()` - Demo/testing support
  - `getUserUSDTTransactions()` - Transaction history
  - All functions have legacy wrappers for backward compatibility

- **cryptoPaymentController.js** - Re-exports blockonomicsController functions
  - Delegates USDT calls to blockonomicsController
  - Maintains backward compatibility

- **paymentRouterV2.js** - Updated routes
  - New: `/api/v0/payments/usdt/*` endpoints (preferred)
  - Legacy: `/api/v0/payments/crypto/*` endpoints (mapped to USDT)
  - Webhooks: `/webhook/blockonomics` and `/webhook/crypto`

- **.env** - Configuration updates
  - Added: `BASE_URL` - For Blockonomics callback URL
  - Added: `USDT_CHAIN=TRC20`
  - Added: `USDT_DECIMALS=6`
  - Added: `USDT_REQUIRED_CONFIRMATIONS=6`

#### Frontend
- **CryptoDepositModal.jsx** - Completely redesigned
  - USDT-only (no coin selection)
  - QR code display for easy copying
  - One-click address copying
  - Payment status checking
  - Demo mode support
  - Modern UI with step-by-step flow

### 🔧 Configuration

Add to your `.env` file:

```env
# Blockonomics USDT Configuration
BLOCKONOMICS_API_KEY=your_blockonomics_api_key_here
BLOCKONOMICS_API_URL=https://www.blockonomics.co/api
BASE_URL=https://yourdomain.com  # or http://localhost:5000 for dev
BLOCKONOMICS_ENVIRONMENT=testnet  # or mainnet

# USDT Settings
USDT_CHAIN=TRC20
USDT_DECIMALS=6
USDT_REQUIRED_CONFIRMATIONS=6
```

### 🌐 API Endpoints

#### Generate USDT Address
```bash
POST /api/v0/payments/usdt/generate-address
Content-Type: application/json

{
  "userId": "user_id_here",
  "isDemo": false  // true for demo mode
}

Response:
{
  "status": true,
  "message": "USDT payment address generated successfully",
  "data": {
    "paymentId": "payment_id_here",
    "address": "USDT_address_here",
    "currency": "USDT",
    "chain": "TRC20",
    "decimals": 6,
    "requiredConfirmations": 6,
    "qrCode": "https://api.qrserver.com/v1/create-qr-code/?data=...",
    "instructions": "Send USDT (TRC20) to this address. Minimum: 1 USDT",
    "status": "pending"
  }
}
```

#### Check Payment Status
```bash
GET /api/v0/payments/usdt/status/:paymentId

Response:
{
  "status": true,
  "data": {
    "paymentId": "payment_id_here",
    "address": "0x...",
    "currency": "USDT",
    "chain": "TRC20",
    "amount": 50.5,
    "confirmations": 6,
    "requiredConfirmations": 6,
    "status": "confirmed",  // pending, processing, confirmed, expired
    "transactionHash": "0x...",
    "confirmedAt": "2025-02-24T10:30:00Z",
    "isDemo": false
  }
}
```

#### Simulate USDT Deposit (Demo)
```bash
POST /api/v0/payments/usdt/simulate-deposit
Content-Type: application/json

{
  "userId": "user_id_here",
  "address": "payment_address_here",
  "amount": 50  // USDT amount
}

Response:
{
  "status": true,
  "message": "Demo USDT deposit simulated successfully",
  "data": {
    "amount": 50,
    "currency": "USDT",
    "chain": "TRC20",
    "transactionHash": "DEMO_TX_1234567890",
    "status": "confirmed"
  }
}
```

#### Get User USDT Transactions
```bash
GET /api/v0/payments/usdt/transactions/:userId

Response:
{
  "status": true,
  "data": [
    {
      "paymentId": "payment_id_1",
      "amount": 100,
      "chain": "TRC20",
      "status": "confirmed",
      "transactionHash": "0x...",
      "confirmations": 6,
      "requiredConfirmations": 6,
      "createdAt": "2025-02-24T10:00:00Z",
      "confirmedAt": "2025-02-24T10:30:00Z"
    }
  ]
}
```

#### Blockonomics Webhook
```bash
POST /api/v0/payments/webhook/blockonomics
Content-Type: application/json

{
  "crypto": "USDT",
  "status": 2,  // 0=unconfirmed, 1=confirmed, 2=safe (multiple confirmations)
  "address": "USDT_payment_address",
  "txid": "transaction_hash",
  "confirmations": 6,
  "value": 50000000  // in smallest units (satoshis-equivalent)
}
```

### 💾 Database Schema

The system uses `CryptoPaymentV2Model` with these key fields for USDT:

```javascript
{
  userId: ObjectId,
  coinType: "USDT",                    // Always "USDT"
  chain: "TRC20",                       // Always "TRC20"
  depositAddress: String,               // USDT wallet address
  amount: Number,                       // USDT amount
  status: "pending|processing|confirmed|expired",
  transactionHash: String,              // Blockchain tx hash
  blockonomicsTransactionId: String,    // Blockonomics tx ID
  blockonomicsIndex: Number,            // Blockonomics index
  confirmations: Number,                // Current confirmations
  requiredConfirmations: 6,             // Always 6 for USDT
  confirmedAt: Date,                    // When confirmed
  isDemo: Boolean,                      // Demo mode flag
  expiresAt: Date,                      // 24-hour expiry
  createdAt: Date,
  updatedAt: Date
}
```

### 🎯 User Flow (Frontend)

1. **User clicks "Deposit USDT"**
   - Modal opens
   - Shows "USDT (TRC20) Deposits Only" badge

2. **Generate Address**
   - Calls `POST /api/v0/payments/usdt/generate-address`
   - Backend calls Blockonomics `/new_address` endpoint
   - Returns unique USDT address + QR code

3. **Display Address**
   - Shows wallet address with one-click copy
   - Displays QR code
   - Provides instructions

4. **User Sends USDT**
   - User copies address or scans QR
   - Sends USDT from their wallet
   - Must be on TRC20 network

5. **Blockonomics Monitors**
   - Detects incoming transaction
   - Waits for 6 confirmations
   - Sends webhook to `/api/v0/payments/webhook/blockonomics`

6. **System Processes Payment**
   - Backend receives webhook
   - Verifies transaction
   - Updates payment status
   - Credits user's wallet balance

7. **Demo Mode Testing**
   - Option to simulate deposit
   - Instantly confirms payment
   - Useful for testing without real transactions

### ⚠️ Important Notes

1. **TRC20 Network Only**
   - Users MUST send USDT on TRC20 (Tron network)
   - Do NOT send ERC-20 USDT (Ethereum)
   - Do NOT send native USDT on other chains

2. **Minimum & Maximum Amounts**
   - Minimum: 1 USDT
   - Maximum: 100,000 USDT per transaction

3. **Confirmations**
   - Requires 6 network confirmations
   - Typically takes 5-15 minutes
   - Demo mode confirms instantly

4. **Address Expiry**
   - Generated addresses expire after 24 hours of inactivity
   - Users can generate new addresses anytime

5. **User Wallet Credits**
   - Confirmed deposits credit `user.demoBalance` array
   - Also updates `user.walletBalances.USDT` if defined

### 🔗 Blockonomics Setup

1. **Create Blockonomics Account**
   - Go to https://www.blockonomics.co/
   - Sign up and verify email

2. **Get API Key**
   - Dashboard → Settings → API Key
   - Copy API key to `.env` as `BLOCKONOMICS_API_KEY`

3. **Configure Webhooks**
   - Dashboard → Merchants → Webhooks
   - Add webhook URL: `https://yourdomain.com/api/v0/payments/webhook/blockonomics`
   - Subscribe to: "Payment confirmations"

4. **Test with Testnet**
   - Set `BLOCKONOMICS_ENVIRONMENT=testnet` initially
   - Use testnet USDT for testing
   - Switch to `mainnet` for production

### 🧪 Testing

#### Test Generate Address (Dev)
```bash
curl -X POST http://localhost:5000/api/v0/payments/usdt/generate-address \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_id",
    "isDemo": true
  }'
```

#### Test Simulate Deposit (Dev)
```bash
curl -X POST http://localhost:5000/api/v0/payments/usdt/simulate-deposit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_id",
    "address": "DEMO_USDT_TRC20_test_user_id_timestamp",
    "amount": 50
  }'
```

### 📊 Monitoring

Monitor logs for:
- `📡 Requesting USDT address from Blockonomics...`
- `✅ USDT address generated: ...`
- `📦 Blockonomics webhook received: ...`
- `✅ USDT payment confirmed: ...`
- `💰 User credited with X USDT`

### 🚀 Deployment Checklist

- [ ] Set `BLOCKONOMICS_API_KEY` in production `.env`
- [ ] Set `BASE_URL` to your production domain
- [ ] Set `BLOCKONOMICS_ENVIRONMENT=mainnet`
- [ ] Configure Blockonomics webhook URL in dashboard
- [ ] Test with small USDT amount first
- [ ] Monitor blockchain confirmations
- [ ] Verify user balance updates correctly
- [ ] Test webhook delivery from Blockonomics
- [ ] Update app documentation/help files
- [ ] Add USDT to supported payment methods list

### 🔄 API Backward Compatibility

Legacy endpoints still work (mapped to USDT):
- `POST /api/v0/payments/crypto/generate-address` → USDT only
- `GET /api/v0/payments/crypto/status/:paymentId`
- `POST /api/v0/payments/crypto/simulate-deposit` → USDT only
- `GET /api/v0/payments/crypto/transactions/:userId`

### 📞 Troubleshooting

**Issue: "Failed to generate USDT address"**
- Check `BLOCKONOMICS_API_KEY` is set
- Verify `BASE_URL` is correct
- Check Blockonomics API status

**Issue: Webhook not received**
- Verify webhook URL in Blockonomics dashboard
- Check firewall/port 443 accessibility
- Monitor server logs for incoming webhooks

**Issue: Payment stuck on "pending"**
- Check if transaction is on TRC20 network
- Wait for 6 confirmations
- Check blockchain explorer for transaction status

**Issue: Demo deposit not working**
- Ensure `isDemo: true` when generating address
- Use demo address when simulating
- Check user balance updated in database

---

**Last Updated**: February 24, 2025
**Status**: ✅ Production Ready
**Support**: USDT (TRC20) Only
