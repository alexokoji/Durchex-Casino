# MongoDB Atlas Setup Checklist & Quick Fix

## 🔴 Current Issue

```
MongoDB Atlas IP Whitelist is blocking connections
Status: ❌ BLOCKED - Cannot connect to database
Impact: Payment system cannot verify balance updates
Fix Duration: 5 minutes
```

---

## ✅ MongoDB Atlas Setup - Step by Step

### 1️⃣ Access MongoDB Atlas Dashboard
```
URL: https://cloud.mongodb.com
Action: Sign in with your MongoDB account
```

### 2️⃣ Select Your Project
```
Project Name: Durchex Casino
Action: Click on the project to open it
```

### 3️⃣ Navigate to Network Access
```
Location: Security section (left sidebar)
Path: Click your project → Security → Network Access
```

### 4️⃣ Add Your IP Address
```
Button: Click "+ ADD IP ADDRESS" (green button)
Choose one option:

OPTION A (Recommended for Development):
- Click "Add Current IP Address"
- Note: This adds your specific IP
- Recommended for development environment

OPTION B (For All IPs - Development Only):  
- Select "Allow Access from Anywhere"
- Enter: 0.0.0.0/0
- ⚠️ Warning: Not secure for production
```

### 5️⃣ Confirm Changes
```
Button: Click "Confirm"
Wait: 1-2 minutes for changes to propagate
Status: Green checkmark appears when ready
```

### 6️⃣ Verify Connection
```bash
# After waiting 1-2 minutes, run:
cd backend
node scripts/seedDatabase.js

# Expected output:
# ✅ MongoDB Connected Successfully!
# 👥 Creating test users...
```

---

## 🧪 Test MongoDB Connection After Whitelisting

### Quick Test (30 seconds)
```bash
cd backend
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./config');
console.log('Connecting to MongoDB...');
mongoose.connect(config.DB, {serverSelectionTimeoutMS: 10000})
  .then(() => { 
    console.log('✅ MongoDB Connected Successfully!'); 
    process.exit(0); 
  })
  .catch(err => { 
    console.log('❌ Connection Failed:', err.message); 
    process.exit(1); 
  })
"
```

### Full Database Test (2-3 minutes)
```bash
cd backend && node scripts/seedDatabase.js
```

---

## 🩺 Diagnose Connection Issues

### Check 1: Is IP Whitelisted?
```bash
# Expected after whitelisting:
MongoDB Address available from IP: [YOUR_IP]
Status: ACTIVE ✅

# If still seeing errors:
Status: PENDING (wait 2+ minutes)
or
Status: NOT WHITELISTED (repeat setup)
```

### Check 2: Verify Credentials
```
Username: durchex-casino
Password: Durchex2025
Database: Durchec-Casino
Cluster: durchec-casino.cnc7vaa.mongodb.net
```

### Check 3: Check Firewall Settings
```
Your Firewall/ISP might be blocking:
- Port 27017 (MongoDB)
- DNS resolution for MongoDB Atlas
- Solution: Contact your ISP or use VPN
```

---

## 📱 Find Your Current IP Address

### Method 1: From MongoDB Error Message
```
Check server logs - often shows your IP:
"Connection refused from IP: 123.45.67.89"
```

### Method 2: Online Tools
```
Websites that show your IP:
- https://whatismyipaddress.com
- https://checkip.amazonaws.com
- https://ipinfo.io
```

### Method 3: From Terminal
```bash
# Linux/Mac:
curl -s https://checkip.amazonaws.com

# Windows:
Invoke-WebRequest -Uri "https://checkip.amazonaws.com" -UseBasicParsing | Select-Object Content
```

---

## 📊 MongoDB Atlas Dashboard Locations

| Item | Location |
|------|----------|
| Network Access | Project → Security → Network Access |
| User Access | Project → Security → Database Access |
| Connection String | Cluster → Connect → Copy connection string |
| Cluster Settings | Cluster → Edit Configuration |
| Database | Browse Collections → Select Database |
| Monitoring | Project → Activity Feed / Monitoring |

---

## ⚡ Common MongoDB Issues & Fixes

### Issue 1: "Could not connect to any servers"
```
Cause: IP not whitelisted OR network unreachable
Fix: 
  1. Check IP is in whitelist
  2. Verify firewall allows outbound connections
  3. Check internet connection
  4. Try again in 2-3 minutes (changes take time)
```

### Issue 2: "authentication failed"
```
Cause: Wrong username/password in connection string
Fix:
  1. Verify credentials in .env file
  2. Check .env has: MONGODB_URL=mongodb+srv://...:...@...
  3. Ensure no special characters in password need encoding
  4. Verify user exists in MongoDB Atlas Database Access
```

### Issue 3: "cannot get master from set"
```
Cause: Network issues or cluster maintenance
Fix:
  1. Wait 2-3 minutes
  2. Verify cluster is running (not paused)
  3. Check MongoDB Atlas alerts for maintenance
  4. Try connection again
```

### Issue 4: Connection successful but operations fail
```
Cause: Collections don't exist yet
Fix:
  1. Run seeding script: node scripts/seedDatabase.js
  2. Or start backend: npm start
  3. Check for collection creation in logs
```

---

## 🚀 Next Steps After MongoDB Works

### 1. Verify Connection (1 min)
```bash
cd backend && npm start
# Look for: "server connected to mongodb successfully"
```

### 2. Seed Database (2 min)
```bash
# Stop server: Ctrl+C
cd backend && node scripts/seedDatabase.js
# Creates test users and payment records
```

### 3. Run Backend Again (1 min)
```bash
cd backend && npm start
# Keep running for next step
```

### 4. Test Payment APIs (5-10 min)
```bash
# In new terminal:
cd backend

# Test 1: Get user balance
curl -X POST http://localhost:5000/api/v0/payment/getDemoBalance \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID_FROM_SEEDING"}'

# Test 2: Simulate crypto deposit
curl -X POST http://localhost:5000/api/v0/payments/crypto/simulate-deposit \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"USER_ID_FROM_SEEDING",
    "coinType":"USDT",
    "chain":"ETH",
    "amount":500
  }'

# Test 3: Check transactions
curl http://localhost:5000/api/v0/payments/transactions/USER_ID_FROM_SEEDING
```

### 5. Check MongoDB (2 min)
```
Visit: https://cloud.mongodb.com
Project → Browse Collections
Look for:
  - Users collection (with your test data)
  - CryptoPaymentsV2 collection
  - FlutterwaveTransactions collection
  - UnifiedPayments collection
```

---

## ✅ Verification Checklist

After completing all steps:

- [ ] MongoDB IP whitelisted
- [ ] Connection test shows "✅ MongoDB Connected"
- [ ] Seeding script completes successfully
- [ ] Backend starts without connection errors
- [ ] getDemoBalance returns user balance data
- [ ] Crypto deposit simulation updates balance
- [ ] Balance persists when checked again
- [ ] Unified transactions show payment records
- [ ] MongoDB collections contain expected data
- [ ] No console errors in backend terminal

---

## 📞 Support Resources

### If You Get Stuck

1. **IP Whitelist Error**
   - Check: Network Access in MongoDB Atlas
   - Verify: Your IP is listed with status ACTIVE
   - Wait: 2-3 minutes after adding IP
   - Retry: Test connection again

2. **Authentication Error**
   - Check: credentials in .env file
   - Verify: MONGODB_URL format is correct
   - Ensure: Username and password match Atlas

3. **Connection Timeout**
   - Check: Internet connection is stable
   - Verify: No firewall blocking port 27017
   - Confirm: Cluster is set to running (not paused)

4. **Database Seeding Fails**
   - Ensure: MongoDB connection works first
   - Try: `npm install` to ensure dependencies
   - Check: backend/scripts/seedDatabase.js exists

---

## 🎯 Success Indicators

### ✅ MongoDB is Working When You See:
```
✅ MongoDB Connected Successfully!
OR
server connected to mongodb successfully
```

### ❌ Still Blocked When You See:
```
❌ Could not connect to any servers
❌ authentication failed
❌ bad auth
```

---

## 📋 Troubleshooting Decision Tree

```
Can MongoDB connect?
├─ YES ✅ → Go to "Seed Database" section
├─ NO ❌ → Is IP whitelisted?
   ├─ YES ✅ → Wait 2-3 minutes, try again
   ├─ NO ❌ → Add IP to whitelist (this section)
   └─ CHECKING ⏳ → Status shows CREATING, wait
          
Database still won't connect?
├─ Check credentials match .env
├─ Verify firewall allows outbound connections
├─ Check internet connection
└─ Contact MongoDB Atlas Support
```

---

## 🔗 Useful Links

| Resource | Link |
|----------|------|
| MongoDB Atlas | https://cloud.mongodb.com |
| IP Whitelist Docs | https://docs.mongodb.com/atlas/security-whitelist/ |
| Connection String | Your project → Cluster → Connect |
| Network Status | Your project → Network Access |
| Database Access | Your project → Security → Database Access |

---

## ⏱️ Estimated Timeline

| Task | Duration | Status |
|------|----------|--------|
| Add IP to whitelist | 3 min | ⏳ Needed |
| Wait for propagation | 2 min | ⏳ Auto |
| Test connection | 1 min | Ready |
| Seed database | 2 min | Ready |
| Start backend | 1 min | Ready |
| Run API tests | 10 min | Ready |
| **TOTAL** | **~20 min** | Ready to go |

---

## ✨ When Everything Works

Once MongoDB is accessible:

1. **Backend will start cleanly**
   ```
   ✅ server connected to mongodb successfully
   ✅ Backend microservices initialization complete
   ```

2. **API Tests will pass**
   ```
   ✅ All payment endpoints respond correctly
   ✅ Balance updates persist in database
   ✅ Unified tracking works
   ```

3. **You can proceed to**
   - Frontend payment UI development
   - Production deployment planning
   - Advanced features implementation

---

**Created:** February 23, 2026
**Status:** Ready - Awaiting IP Whitelisting
**Impact:** Blocks verification but implementation complete
**Estimated Fix Time:** 5-10 minutes
