# Payment System V2 - Quick Reference

## 📋 Documentation Index

### For Understanding Architecture
→ **[PAYMENT_SYSTEM_V2_GUIDE.md](./PAYMENT_SYSTEM_V2_GUIDE.md)**
- Complete system architecture
- Data model specifications  
- Payment flow diagrams
- Environment configuration

### For Testing the System
→ **[PAYMENT_SYSTEM_V2_TESTING.md](./PAYMENT_SYSTEM_V2_TESTING.md)** 
- 9 test scenarios with curl commands
- Expected responses
- Debugging guides
- Should take ~15 minutes to run all tests

### For Project Overview
→ **[PAYMENT_SYSTEM_V2_SUMMARY.md](./PAYMENT_SYSTEM_V2_SUMMARY.md)**
- What was completed
- Architecture overview
- Integration points
- Next steps (phased approach)

---

## 🚀 Quick Start (5 Minutes)

### 1. Start Backend
```bash
cd backend && npm start
```

### 2. Create Test User (if needed)
```bash
node backend/scripts/createTestUser.js
# Note the User ID printed out
```

### 3. Test Crypto Deposit Simulation
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

### 4. View All Transactions
```bash
curl http://localhost:5000/api/v0/payments/transactions/699962c34d4fa091e1f5e3fa
```

---

## 🔑 Key Features

### Fiat Payments (Flutterwave)
- ✅ Multiple payment methods: Card, Bank Transfer, Mobile Money, USSD
- ✅ Automatic balance updates on confirmation
- ✅ Webhook signature verification
- ✅ Full payment tracking

### Crypto Payments
- ✅ 7 supported coins: BTC, ETH, USDT, USDC, BNB, TRX, BUSD
- ✅ Multi-chain support
- ✅ On-chain confirmation tracking
- ✅ Demo mode for testing
- ✅ 24-hour address expiration

### Unified Tracking
- ✅ Single dashboard for all payment types
- ✅ Cross-referenced transaction details
- ✅ Transaction history for auditing

---

## 🎯 Verification Checklist

Run these 5 quick checks to validate the system:

1. **[ ] Backend starts without errors**
   ```bash
   cd backend && npm start
   # Should not show any compilation/import errors
   ```

2. **[ ] Test user exists**
   ```bash
   curl -X POST http://localhost:5000/api/v0/payment/getDemoBalance \
     -H "Content-Type: application/json" \
     -d '{"userId": "699962c34d4fa091e1f5e3fa"}'
   # Should return balance data with 11 currencies at 1000 each
   ```

3. **[ ] Crypto simulation works**
   ```bash
   # Run the curl command from Quick Start above
   # Should return: "✅ 500 USDT deposited successfully"
   # New balance should be 1500
   ```

4. **[ ] Unified transactions list populates**
   ```bash
   # Run the curl command from Quick Start above
   # Should return an array with crypto payment record
   ```

5. **[ ] No database errors**
   - Check backend console for any MongoDB connection issues
   - Should see: "server connected to mongodb successfully"

---

## 📁 New Files Created

### Backend Models
- `backend/models/FlutterwaveTransactionModel.js` - Fiat payment records
- `backend/models/CryptoPaymentV2Model.js` - Crypto deposit tracking
- `backend/models/UnifiedPaymentModel.js` - Unified payment tracking

### Backend Controllers
- `backend/controllers/flutterwaveController.js` - Flutterwave payment logic
- `backend/controllers/cryptoPaymentController.js` - Crypto payment logic

### Backend Routes
- `backend/routes/paymentRouterV2.js` - All payment endpoints

### Documentation
- `PAYMENT_SYSTEM_V2_GUIDE.md` - Full technical documentation
- `PAYMENT_SYSTEM_V2_TESTING.md` - Testing and debugging guide
- `PAYMENT_SYSTEM_V2_SUMMARY.md` - Project overview and next steps
- `PAYMENT_SYSTEM_V2_QUICK_REFERENCE.md` - This file

### Modified Files
- `backend/models/index.js` - Added new models
- `backend/routes/index.js` - Registered new router
- `backend/.env` - Added Flutterwave config variables
- `backend/models/FlutterwaveTransactionModel.js` - Enhanced fields
- `backend/models/CryptoPaymentV2Model.js` - Enhanced fields

---

## 🔌 API Endpoints

### Crypto Endpoints (at /api/v0/payments)
```
POST  /crypto/generate-address          - Create deposit address
GET   /crypto/status/:paymentId         - Check address/deposit status
POST  /crypto/simulate-deposit          - Demo deposit (testing)
POST  /webhook/crypto                   - Receive on-chain confirmations
GET   /crypto/transactions/:userId      - Get user's crypto history
```

### Fiat Endpoints (at /api/v0/payments)
```
POST  /fiat/deposit                     - Initiate payment
GET   /fiat/status/:transactionId       - Check payment status
POST  /webhook/flutterwave              - Receive payment updates
GET   /fiat/transactions/:userId        - Get user's fiat history
```

### Unified Endpoints (at /api/v0/payments)
```
GET   /transactions/:userId             - All transactions (fiat + crypto)
GET   /transaction/:transactionId       - Specific transaction details
```

---

## 💡 Configuration Needed

### For Production Fiat Payments
1. Get Flutterwave API Key: https://dashboard.flutterwave.com
2. Get Flutterwave Secret Hash from dashboard
3. Update `.env`:
   ```
   FLUTTERWAVE_API_KEY=your_actual_key
   FLUTTERWAVE_SECRET_HASH=your_secret
   FLUTTERWAVE_ENV=production
   ```
4. Configure webhooks in Flutterwave dashboard

### For Production Crypto
1. Ensure Tatum API key is configured (already in .env)
2. Configure Tatum webhooks if needed

---

## 🐛 Debugging Quick Tips

**Problem: "Cannot find module" errors**
→ Run `npm install` in backend directory

**Problem: Payment endpoints returning 404**
→ Check that routes are registered in `backend/routes/index.js`

**Problem: Balance not updating**
→ Check backend console for "✅ Added X coins to user" message

**Problem: Connection to database failing**
→ Verify MongoDB URL in `.env` is correct

**Problem: Flutterwave API errors**
→ Check API key and secret hash in `.env`

For more troubleshooting, see **PAYMENT_SYSTEM_V2_TESTING.md** Debugging section

---

## 🔄 System Integration Points

### Current Integration
- ✅ Uses existing UserModel for balance
- ✅ Works with existing demoMode system
- ✅ Compatible with existing deposit/withdrawal flow
- ✅ Uses existing database connection

### Future Integration (Frontend)
- [ ] Create FiatDepositModal component
- [ ] Create CryptoDepositModal component
- [ ] Add payment status tracking
- [ ] Display unified payment history

---

## 📊 Supported Currencies

### Cryptocurrencies
| Coin | Network | Decimal Places |
|------|---------|----------------|
| BTC | Bitcoin | 8 |
| ETH | Ethereum | 18 |
| USDT | Ethereum/BSC/TRON | 6 |
| USDC | Ethereum | 6 |
| BNB | Binance Smart Chain | 18 |
| TRX | TRON | 6 |
| BUSD | Binance Smart Chain | 18 |

### Fiat Currencies
- USD, NGN, GHS, KES, ZAR, GBP, EUR, CAD, AUD, and 90+ other currencies (via Flutterwave)

---

## 📞 Support Resources

### Quick Issue Resolution
1. Check console output in backend terminal for error messages
2. Review "Debugging" section in PAYMENT_SYSTEM_V2_TESTING.md
3. Verify all environment variables are set correctly
4. Run the test scenarios to isolate the problem

### Documentation References
- **API Details**: PAYMENT_SYSTEM_V2_GUIDE.md
- **Testing Methods**: PAYMENT_SYSTEM_V2_TESTING.md
- **Architecture Diagram**: PAYMENT_SYSTEM_V2_GUIDE.md (Flows section)
- **Implementation Status**: PAYMENT_SYSTEM_V2_SUMMARY.md

---

## ✅ Implementation Status

### Completed (Ready to Test)
- [x] Data models created (3 models)
- [x] Controllers implemented (2 controllers)
- [x] API routes configured (11 endpoints)
- [x] Database integration (MongoDB)
- [x] Balance update logic
- [x] Environment configuration
- [x] Comprehensive documentation
- [x] Testing guide and scenarios

### In Progress
- [ ] Frontend payment UI components

### Not Started
- [ ] Production Flutterwave account setup
- [ ] Production webhook configuration
- [ ] Advanced error handling (retries, notifications)
- [ ] Analytics and monitoring

---

## 🎓 Learning Path

**New to this system? Follow this order:**

1. Read: [PAYMENT_SYSTEM_V2_SUMMARY.md](./PAYMENT_SYSTEM_V2_SUMMARY.md) (10 min)
   - Understand what was built and why

2. Run: Quick Start tests above (5 min)
   - Verify system works

3. Read: [PAYMENT_SYSTEM_V2_GUIDE.md](./PAYMENT_SYSTEM_V2_GUIDE.md) (20 min)
   - Learn architecture and API details

4. Run: All tests from [PAYMENT_SYSTEM_V2_TESTING.md](./PAYMENT_SYSTEM_V2_TESTING.md) (15 min)
   - Validate every endpoint

5. Code: Build frontend components using the API

---

## 📝 License & Notes

This payment system was built to replace the old Tatum-only implementation with modern, scalable payment infrastructure supporting both fiat and cryptocurrency.

**Key Design Principles:**
- Modularity: Easy to extend with new payment methods
- Tracking: Full audit trail for all transactions
- Flexibility: Support multiple payment methods and currencies
- Reliability: Webhook-driven updates and retry logic

---

**Last Updated:** January 2024
**Status:** Ready for Testing
**Next Review:** After frontend integration complete
