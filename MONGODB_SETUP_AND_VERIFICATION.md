# MongoDB Setup & Payment System Verification Guide

## 🚨 Current Status

**Issue Found:** MongoDB Atlas IP Whitelist Blocking Connection

```
❌ MongoDB Connection Failed: Could not connect to any servers in your MongoDB Atlas cluster. 
   One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

## ✅ Solution: Whitelist Your IP on MongoDB Atlas

### Step 1: Get Your Current IP
Your current IP appears to be blocked by MongoDB Atlas IP whitelist settings.

### Step 2: Add IP to MongoDB Atlas Whitelist

1. Go to: **https://cloud.mongodb.com**
2. Sign in with your MongoDB account
3. Navigate to your **Durchex Casino** project
4. Go to **Network Access** (security section)
5. Click **ADD IP ADDRESS**
6. Choose one of these options:
   - **Recommended for Development:** Add specific IP (you'll need to identify it)
   - **Development Only:** Add `0.0.0.0/0` (allows all IPs - NOT for production)
7. Click **Confirm**
8. Wait 1-2 minutes for changes to propagate

### Step 3: Verify Connection
Once whitelisted, test connection:
```bash
cd backend
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./config');
mongoose.connect(config.DB)
  .then(() => { console.log('✅ MongoDB Connected!'); process.exit(0); })
  .catch(err => { console.log('❌', err.message); process.exit(1); });
"
```

---

## 🌱 Database Seeding

Once MongoDB is accessible, seed the database with test data:

### Option 1: Use Provided Seeding Script
```bash
cd backend
node scripts/seedDatabase.js
```

**Output:**
```
✅ MongoDB Connected Successfully!
👥 Creating test users...
✅ Created user: testuser1 (ID: xxxxx)
✅ Created user: testuser2 (ID: xxxxx)

💰 Creating crypto deposits...
✅ Created crypto deposit: USDT (500)
✅ Created crypto deposit: ETH (0.5)

📊 Creating fiat deposits...
✅ Created fiat deposit: 100 USD (card)
✅ Created fiat deposit: 500 USD (bank_transfer)

✅ Database seeding completed successfully!
```

### Option 2: Manual User Creation Script
```bash
cd backend
node scripts/createTestUser.js
```

---

## 🧪 Payment System Verification

### Phase 1: Backend Health Check

After MongoDB is connected and seeded:

```bash
# 1. Start backend server
cd backend && npm start

# Expected output:
# > backend@1.0.0 start
# > node server.js
# server started on 5000 port
# server connected to mongodb successfully
# Backend microservices initialization complete...
```

### Phase 2: Quick API Tests

Once backend is running, open new terminal:

```bash
# 2. Test backend is responding
curl http://localhost:5000/
# Expected: TEST MODE IN HERE

# 3. Get test user balance
curl -X POST http://localhost:5000/api/v0/payment/getDemoBalance \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID_HERE"}'

# Expected response:
# {
#   "status": true,
#   "data": {
#     "data": [
#       {"currency": "BTC", "balance": 1000, ...},
#       {"currency": "ETH", "balance": 1000, ...},
#       ... 11 currencies total
#     ]
#   },
#   "demoMode": true
# }
```

### Phase 3: Crypto Payment Tests

```bash
# 4. Simulate crypto deposit
curl -X POST http://localhost:5000/api/v0/payments/crypto/simulate-deposit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID_HERE",
    "coinType": "USDT",
    "chain": "ETH",
    "amount": 500
  }'

# Expected response:
# {
#   "status": true,
#   "message": "✅ 500 USDT deposited successfully!",
#   "data": {
#     "amount": 500,
#     "coinType": "USDT",
#     "status": "confirmed",
#     "newBalance": 1500
#   }
# }

# 5. Verify balance updated
curl -X POST http://localhost:5000/api/v0/payment/getDemoBalance \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID_HERE"}'

# Expected: Balance for USDT should now be 1500 (was 1000)
```

### Phase 4: Unified Payment History

```bash
# 6. Get all transactions
curl http://localhost:5000/api/v0/payments/transactions/YOUR_USER_ID_HERE

# Expected: Array containing crypto payment record with status "completed"

# 7. Get specific transaction
curl http://localhost:5000/api/v0/payments/transaction/TRANSACTION_ID_HERE

# Expected: Full payment details cross-referenced with crypto payment record
```

### Phase 5: Fiat Payment Test

```bash
# 8. Initiate fiat deposit
curl -X POST http://localhost:5000/api/v0/payments/fiat/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID_HERE",
    "amount": 100,
    "currency": "USD",
    "paymentMethod": "card",
    "email": "test@example.com"
  }'

# Expected response:
# {
#   "status": true,
#   "message": "Payment initiated successfully",
#   "paymentLink": "https://checkout.flutterwave.com/pay/...",
#   "transactionId": "...",
#   "redirectUrl": "..."
# }
```

---

## ✅ Verification Checklist

After running all tests, verify:

- [ ] Backend starts without MongoDB connection errors
- [ ] `getDemoBalance` returns 11 currencies with balance data
- [ ] Crypto deposit simulation updates balance (1000 → 1500)
- [ ] Unified transactions show crypto payment record
- [ ] Transaction details cross-reference crypto payment
- [ ] Fiat deposit initiation returns payment link
- [ ] No console errors in backend terminal

---

## 📊 MongoDB Collections Created

After seeding, your database will contain:

```
▶ Users (2 test users with balances)
▶ CryptoPaymentsV2 (3 demo crypto deposits)
▶ FlutterwaveTransactions (2 demo fiat deposits)
▶ UnifiedPayments (cross-references for all payments)
```

Check MongoDB directly:
```bash
# In MongoDB Atlas or MongoDB Compass
use Durchec-Casino

# Show created collections
show collections

# View test user
db.Users.findOne({email: "test1@example.com"})

# View crypto payments
db.CryptoPaymentsV2.find({})

# View fiat payments
db.FlutterwaveTransactions.find({})

# View unified payments
db.UnifiedPayments.find({})
```

---

## 🔧 Troubleshooting

### Backend Won't Start
```bash
# Verify MongoDB URL is correct
cd backend && node -e "require('dotenv').config(); console.log('DB:', process.env.MONGODB_URL)"

# Try connection test:
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./config');
mongoose.connect(config.DB, {serverSelectionTimeoutMS: 10000})
  .then(() => console.log('✅ Connected'))
  .catch(err => console.log('❌', err.message))
"
```

### "Cannot overwrite model" Error
- Solution: Restart backend with `npm start`
- Or kill all node processes: `pkill -f node`

### "Authentication failed" Error
- Verify credentials in .env: username `durchex-casino`, password `Durchex2025`
- Check IP is whitelisted on MongoDB Atlas
- Verify MongoDB Atlas project name

### Balance Not Updating
```bash
# Check backend logs for:
# "✅ Added X coins to user"

# Verify user has demoMode: true
# Check balance update in database:
db.Users.findOne({_id: ObjectId("YOUR_USER_ID")}, {demoBalance: 1})
```

---

## 📝 Next Steps

1. **Whitelist IP** on MongoDB Atlas (required)
2. **Run seeding script** to populate test data
3. **Start backend** and verify connection
4. **Run all verification tests** using curl commands above
5. **Check backend logs** for any "✅" or "❌" messages
6. **Review MongoDB** collections to confirm data persisted

---

## 📞 Support Resources

- MongoDB Atlas Help: https://docs.mongodb.com/atlas/
- IP Whitelist Guide: https://docs.mongodb.com/atlas/security-whitelist/
- Payment System Guide: See `PAYMENT_SYSTEM_V2_GUIDE.md`
- Testing Guide: See `PAYMENT_SYSTEM_V2_TESTING.md`

---

## Key MongoDB Atlas URLs

- **Dashboard:** https://cloud.mongodb.com
- **Network Access:** Click project → Security → Network Access
- **Connection String:** Copy from "Connect" button in cluster view

---

**Last Updated:** February 2026
**Status:** Verification Pending (Awaiting IP Whitelist)
**Estimated Setup Time:** 5-10 minutes after IP whitelisting
