# Demo Balance & Chips System - Quick Test Cheat Sheet

## 1️⃣ Get User ID
```bash
# From MongoDB
mongo
> use PlayZelo
> db.users.findOne({email: "test@demo.local"}).toJSON() | grep _id
```
Copy the `_id` value. All commands below use `<USER_ID>` placeholder.

## 2️⃣ Enable Demo Mode
```bash
curl -X POST http://localhost:5000/api/v0/payment/demo/toggle \
  -H "Content-Type: application/json" \
  -d '{"userId":"<USER_ID>"}'
```
Look for: `"demoMode": true`

## 3️⃣ Deposit 150 Chips
```bash
curl -X POST http://localhost:5000/api/v0/payment/demo/simulate-deposit \
  -H "Content-Type: application/json" \
  -d '{"userId":"<USER_ID>","coinType":"CHIPS","chain":"","amount":150}'
```
Look for: `"balance": 150`

## 4️⃣ Check Balance
```bash
curl -X POST http://localhost:5000/api/v0/auth/getAuthData \
  -H "Content-Type: application/json" \
  -d '{"userId":"<USER_ID>"}'
```
Look for: `"demoBalance": {"data": [{"balance": 150}]}`

## 5️⃣ Frontend UI Test
1. Open: `http://localhost:3000`
2. Login with test user
3. Play **Crash** or **Slot** game
4. Place bet (e.g., 10 chips)
5. ✅ Verify: Balance shows **Chips** (not USDT/BTC), decrements on bet, increments on payout

## 6️⃣ Verify Backend Database
```bash
mongo
> use PlayZelo
> db.users.findOne({_id: ObjectId("<USER_ID>")}, {demoBalance: 1})
```
Should show: `"demoBalance": {"data": [{"coinType": "CHIPS", "balance": 150}]}`

## ✅ Success Indicators
- ✅ Demo balance increases after deposit
- ✅ All games show balance in **Chips**
- ✅ Chips icon used (not USDT/BTC)
- ✅ Balance updates on bet/payout
- ✅ Database stores `coinType: "CHIPS"`

## 🔍 Check Game UI Screenshots
Did you see these in Crash/Slot games?
- [ ] **Balance: 150.00 Chips** (not "Balance: 150 USDT")
- [ ] Chip icon 🎰 (not Bitcoin icon ฿)
- [ ] Bet input shows **Chips** currency
- [ ] Total bet amount at bottom uses **Chips**

---

**If all these are green ✅, the unified chips system is working!**
