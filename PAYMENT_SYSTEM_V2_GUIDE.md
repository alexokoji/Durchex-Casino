# New Dual Payment System Documentation

## Overview

The new payment system replaces the old Tatum-only implementation with a comprehensive dual-payment architecture supporting:
- **Fiat Payments**: Via Flutterwave (Card, Bank Transfer, Mobile Money, USSD)
- **Cryptocurrency**: Direct blockchain deposits (BTC, ETH, USDT, USDC, BNB, TRX, BUSD)

Both payment methods are unified under a single tracking system with real-time status updates.

## Architecture

### Models

#### 1. **FlutterwaveTransactionModel** (`backend/models/FlutterwaveTransactionModel.js`)
Tracks all fiat payment transactions via Flutterwave.

**Fields:**
- `userId`: Reference to user
- `flutterwaveId`: Flutterwave transaction ID
- `amount`: Payment amount
- `currency`: Currency code (USD, NGN, etc.)
- `paymentMethod`: 'card', 'bank_transfer', 'mobile_money', 'ussd'
- `status`: 'initiated', 'pending', 'completed', 'failed'
- `paymentLink`: Link to payment gateway
- `customerEmail`: Customer email
- `bankInfo`: Bank details (for transfers)
- `webhookData`: Raw Flutterwave webhook data
- `confirmedAt`: Timestamp of confirmation

#### 2. **CryptoPaymentV2Model** (`backend/models/CryptoPaymentV2Model.js`)
Tracks all cryptocurrency deposits.

**Fields:**
- `userId`: Reference to user
- `coinType`: 'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'TRX', 'BUSD'
- `chain`: Blockchain network ('BTC', 'ETH', 'BSC', 'TRON', 'POLYGON')
- `depositAddress`: Generated deposit address
- `amount`: Deposit amount (in smallest unit, e.g., wei for ETH)
- `transactionHash`: Blockchain transaction hash
- `confirmations`: Current confirmation count
- `requiredConfirmations`: Confirmations needed for acceptance
- `status`: 'pending', 'confirmed', 'failed', 'expired'
- `tatumTransactionId`: Reference to Tatum transaction
- `isDemo`: Flag for demo deposits
- `expiresAt`: 24-hour expiration for unused addresses

#### 3. **UnifiedPaymentModel** (`backend/models/UnifiedPaymentModel.js`)
Unified tracking for all payments (both fiat and crypto).

**Fields:**
- `userId`: Reference to user
- `paymentId`: Unique unified payment ID
- `paymentMethod`: 'flutterwave' or 'crypto'
- `type`: 'deposit' or 'withdrawal'
- `amountRequested`: Original amount requested
- `amountReceived`: Amount received (after fees/conversion)
- `currencyCode`: Currency code
- `status`: 'pending', 'processing', 'completed', 'failed', 'cancelled'
- `flutterwaveTransactionId`: Reference to Flutterwave transaction (if fiat)
- `cryptoPaymentId`: Reference to crypto payment (if crypto)
- `metadata`: Additional payment data

## API Endpoints

### Fiat Payments (Flutterwave)

#### 1. Initiate Fiat Deposit
```http
POST /api/v0/payments/fiat/deposit
Content-Type: application/json

{
  "userId": "user-id",
  "amount": 100,
  "currency": "USD",
  "paymentMethod": "card,ussd,bank_transfer,mobile_money",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Payment initiated successfully",
  "paymentLink": "https://checkout.flutterwave.com/...",
  "transactionId": "transaction-id",
  "redirectUrl": "https://checkout.flutterwave.com/..."
}
```

#### 2. Get Fiat Payment Status
```http
GET /api/v0/payments/fiat/status/:transactionId
```

**Response:**
```json
{
  "status": true,
  "data": {
    "transactionId": "transaction-id",
    "status": "completed",
    "amount": 100,
    "currency": "USD",
    "createdAt": "2024-01-01T12:00:00Z",
    "completedAt": "2024-01-01T12:05:00Z"
  }
}
```

#### 3. Get User Fiat Transactions
```http
GET /api/v0/payments/fiat/transactions/:userId?limit=50&skip=0
```

#### 4. Flutterwave Webhook
```http
POST /api/v0/payments/webhook/flutterwave
```
Automatically called by Flutterwave when payment status changes.

### Cryptocurrency Payments

#### 1. Generate Deposit Address
```http
POST /api/v0/payments/crypto/generate-address
Content-Type: application/json

{
  "userId": "user-id",
  "coinType": "USDT",
  "chain": "ETH",
  "isDemo": false
}
```

**Response:**
```json
{
  "status": true,
  "message": "Deposit address generated successfully",
  "data": {
    "paymentId": "payment-id",
    "depositAddress": "0x...",
    "coinType": "USDT",
    "chain": "ETH",
    "amount": 0,
    "status": "pending",
    "requiredConfirmations": 12,
    "expiresAt": "2024-01-02T12:00:00Z"
  }
}
```

**Supported Coins:**
| Coin | Chain | Decimals | Confirmations |
|------|-------|----------|----------------|
| BTC  | BTC   | 8        | 2              |
| ETH  | ETH   | 18       | 12             |
| USDT | ETH   | 6        | 12             |
| USDC | ETH   | 6        | 12             |
| BNB  | BSC   | 18       | 10             |
| TRX  | TRON  | 6        | 20             |
| BUSD | BSC   | 18       | 10             |

#### 2. Get Deposit Address Status
```http
GET /api/v0/payments/crypto/status/:paymentId
```

**Response:**
```json
{
  "status": true,
  "data": {
    "paymentId": "payment-id",
    "depositAddress": "0x...",
    "coinType": "USDT",
    "chain": "ETH",
    "amount": 100,
    "confirmations": 12,
    "requiredConfirmations": 12,
    "status": "confirmed",
    "transactionHash": "0x...",
    "confirmedAt": "2024-01-01T12:10:00Z",
    "isDemo": false
  }
}
```

#### 3. Simulate Crypto Deposit (Demo/Testing)
```http
POST /api/v0/payments/crypto/simulate-deposit
Content-Type: application/json

{
  "userId": "user-id",
  "coinType": "USDT",
  "chain": "ETH",
  "amount": 100
}
```

**Response:**
```json
{
  "status": true,
  "message": "✅ 100 USDT deposited successfully!",
  "data": {
    "paymentId": "payment-id",
    "amount": 100,
    "coinType": "USDT",
    "chain": "ETH",
    "status": "confirmed",
    "transactionHash": "DEMO_TX_...",
    "newBalance": 1100
  }
}
```

#### 4. Get User Crypto Transactions
```http
GET /api/v0/payments/crypto/transactions/:userId?limit=50&skip=0
```

#### 5. Crypto Webhook (On-Chain Confirmations)
```http
POST /api/v0/payments/webhook/crypto
```
Called by Tatum when blockchain confirmations are received.

### Unified Payment Endpoints

#### 1. Get All Transactions (Fiat + Crypto)
```http
GET /api/v0/payments/transactions/:userId?limit=50&skip=0
```

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "_id": "payment-id",
      "paymentId": "FW-...",
      "paymentMethod": "flutterwave",
      "type": "deposit",
      "status": "completed",
      "amountRequested": 100,
      "amountReceived": 98,
      "currencyCode": "USD",
      "initiatedAt": "2024-01-01T12:00:00Z",
      "completedAt": "2024-01-01T12:05:00Z"
    },
    {
      "_id": "payment-id-2",
      "paymentId": "CRYPTO-...",
      "paymentMethod": "crypto",
      "type": "deposit",
      "status": "completed",
      "amountRequested": 0.5,
      "amountReceived": 0.5,
      "currencyCode": "ETH",
      "initiatedAt": "2024-01-01T11:00:00Z",
      "completedAt": "2024-01-01T11:15:00Z"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 50,
    "skip": 0
  }
}
```

#### 2. Get Transaction Details
```http
GET /api/v0/payments/transaction/:transactionId
```

## Flow Diagrams

### Fiat Payment Flow (Flutterwave)

```
User
  ↓
Initiate Deposit (POST /fiat/deposit)
  ↓
Create FlutterwaveTransaction Record
  ↓
Create UnifiedPayment Record
  ↓
Call Flutterwave API
  ↓
Return Payment Link
  ↓
User Redirected to Flutterwave Checkout
  ↓
User Completes Payment
  ↓
Flutterwave Sends Webhook
  ↓
Verify Signature & Update Status
  ↓
Add Funds to User Balance
  ↓
Mark Payment Complete
```

### Crypto Payment Flow

```
User
  ↓
Generate Deposit Address (POST /crypto/generate-address)
  ↓
Create CryptoPayment Record
  ↓
Create UnifiedPayment Record
  ↓
Return Deposit Address
  ↓
User Sends Cryptocurrency
  ↓
Blockchain Confirms Transaction
  ↓
Tatum Webhook Received
  ↓
Update Confirmations
  ↓
Confirmations >= Required
  ↓
Add Funds to User Balance
  ↓
Mark Payment Complete
```

## Implementation Status

### ✅ Completed
- [x] FlutterwaveTransactionModel
- [x] CryptoPaymentV2Model
- [x] UnifiedPaymentModel
- [x] flutterwaveController (with full payment and webhook handling)
- [x] cryptoPaymentController (with address generation and webhook handling)
- [x] paymentRouterV2 (all API endpoints)
- [x] Environment variables (.env updates)
- [x] Route registration (routes/index.js)

### ⏳ Pending

#### Backend
- [ ] Fix Mongoose balance persistence (add `markModified()`)
- [ ] Test Flutterwave webhook signature verification
- [ ] Test crypto webhook integration with Tatum
- [ ] Add payment webhook retry logic
- [ ] Add transaction logging and audit trails
- [ ] Add payment cancellation endpoints

#### Frontend
- [ ] Create FiatDepositModal component
- [ ] Create CryptoDepositModal component
- [ ] Create PaymentStatusModal component
- [ ] Add payment history view
- [ ] Integrate with Redux wallet slice
- [ ] Add real-time Socket.io updates for payment status
- [ ] Create payment method selector UI

## Environment Variables Required

```env
# Flutterwave
FLUTTERWAVE_API_KEY=your_api_key
FLUTTERWAVE_SECRET_HASH=your_secret_hash
FLUTTERWAVE_ENV=sandbox|production

# URLs
APP_BASE_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Tatum (existing, but used in new system)
TATUM_API_KEY=your_key
TATUM_API_URL=https://api.tatum.io/v3
```

## Testing

### Test Fiat Payment
```bash
curl -X POST http://localhost:5000/api/v0/payments/fiat/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "699962c34d4fa091e1f5e3fa",
    "amount": 100,
    "currency": "USD",
    "paymentMethod": "card",
    "email": "test@example.com"
  }'
```

### Test Crypto Deposit Address Generation
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

### Test Crypto Simulation
```bash
curl -X POST http://localhost:5000/api/v0/payments/crypto/simulate-deposit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "699962c34d4fa091e1f5e3fa",
    "coinType": "USDT",
    "chain": "ETH",
    "amount": 100
  }'
```

### Get All User Transactions
```bash
curl http://localhost:5000/api/v0/payments/transactions/699962c34d4fa091e1f5e3fa
```

## Migration Notes

The old payment system endpoints remain available for backward compatibility:
- Old: `/api/v0/payment/demo/simulate-deposit`
- New: `/api/v0/payments/crypto/simulate-deposit`

Both systems can coexist during transition. Eventually, deprecate old endpoints after all clients migrate to new system.

## File Structure Summary

```
backend/
├── models/
│   ├── FlutterwaveTransactionModel.js
│   ├── CryptoPaymentV2Model.js
│   └── UnifiedPaymentModel.js
├── controllers/
│   ├── flutterwaveController.js
│   └── cryptoPaymentController.js
├── routes/
│   ├── paymentRouterV2.js
│   └── index.js (updated)
└── .env (updated with Flutterwave config)
```

## Next Steps

1. **Immediate**: Fix Mongoose balance persistence issue
2. **Short-term**: Build frontend payment modals
3. **Integration**: Connect with existing wallet display
4. **Testing**: Full end-to-end payment flow testing
5. **Production**: Deploy and monitor webhook responses
