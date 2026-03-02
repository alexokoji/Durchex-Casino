# Demo Balance Unified Chips Smoke Test - Manual Checklist

## Overview
This checklist validates the entire demo balance flow with unified chips system through direct HTTP calls and UI interaction.

---

## PRECONDITIONS

1. **Backend running**: `http://localhost:5000`
2. **Frontend running**: `http://localhost:3000`
3. **MongoDB** accessible with demo data

---

## TEST FLOW A: Backend API Validation

### Step A1: Create or Identify Test User

Replace `<USER_ID>` and `<EMAIL>` in all commands below with your test user's ObjectID and email.

**Option 1: Check existing test user via MongoDB**
```bash
mongo
> use PlayZelo
> db.users.findOne({email: "test@smoke.demo"})
```

**Option 2: Create a new test user via the frontend**
- Navigate to: `http://localhost:3000`
- Click Register
- Create account with email `test@demo.local` and password `Test123!`
- Copy the user ID from browser console or MongoDB

---

### Step A2: Enable Demo Mode for Specific User

```bash
curl -X POST http://localhost:5000/api/v0/payment/demo/toggle \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<USER_ID>"
  }'
```

**Expected Response:**
```json
{
  "status": true,
  "message": "Demo mode toggled...",
  "demoMode": true
}
```

✅ **Verify**: `demoMode` is `true`

---

### Step A3: Check Initial Demo Balance

```bash
curl -X POST http://localhost:5000/api/v0/payment/demo/balance \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<USER_ID>"
  }'
```

**Expected Response:**
```json
{
  "status": true,
  "balance": 0
}
```

📝 **Note Initial Balance**: Should be `0` (or small amount if previous tests ran)

---

### Step A4: Simulate Demo Deposit (150 Chips)

```bash
curl -X POST http://localhost:5000/api/v0/payment/demo/simulate-deposit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<USER_ID>",
    "coinType": "CHIPS",
    "chain": "",
    "amount": 150
  }'
```

**Expected Response:**
```json
{
  "status": true,
  "message": "✅ 150 CHIPS deposited successfully!",
  "newBalance": {
    "data": [
      {
        "coinType": "CHIPS",
        "balance": 150,
        "chain": "",
        "type": "native"
      }
    ]
  },
  "demoMode": true
}
```

✅ **Verify**: 
- `status` is `true`
- `newBalance.data[0].balance` is `150`
- `demoMode` is `true`

---

### Step A5: Check Demo Balance After Deposit

```bash
curl -X POST http://localhost:5000/api/v0/auth/getAuthData \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<USER_ID>"
  }'
```

**Expected Response includes:**
```json
{
  "status": true,
  "data": {
    "userData": {
      "_id": "<USER_ID>",
      "email": "test@demo.local",
      "demoMode": true,
      "demoBalance": {
        "data": [
          {
            "coinType": "CHIPS",
            "balance": 150,
            "chain": "",
            "type": "native"
          }
        ]
      }
    },
    "balanceData": [{...}]
  }
}
```

✅ **Verify**: 
- `userData.demoMode` is `true`
- `userData.demoBalance.data[0].balance` is `150`

---

## TEST FLOW B: Frontend UI and Game Integration

### Step B1: Access Frontend Application

1. Open browser: `http://localhost:3000`
2. Login with test user account (email: `test@demo.local`, password: `Test123!`)

✅ **Verify**: 
- Page loads without errors
- User is logged in
- Header shows balance information

---

### Step B2: Verify Demo Mode Toggle UI

1. Click on **Wallet** or **Profile** button
2. Look for **"Demo Mode"** toggle switch
3. Verify it shows **ENABLED** (green/on state)

✅ **Verify**: Demo mode indicator is active

---

### Step B3: Check Wallet/Balance Display

1. Click **Wallet** in the header
2. Look for balance display section
3. Should display demo balance: **150 Chips**

✅ **Verify**: Balance shows `150 Chips` (not specific coin name)

---

### Step B4: Verify Game Shows Chips (Not Specific Coin)

1. Navigate to **Crash Game** (or any other game)
2. Look at the in-game balance display
3. Should show: **Balance: 150.00 Chips** (not USDT, BTC, etc.)

✅ **Verify**: In-game balance shows total as **Chips**

---

### Step B5: Monitor Demo Balance During Game Play

1. **Place a bet**: Select bet amount (e.g., 10)
2. Click **Bet** button
3. **Watch balance in-game**: Should show **140.00 Chips** after bet placed

✅ **Verify**: Balance decremented by bet amount

---

### Step B6: Complete Game Round and Check Payout

1. Play the game round until completion
2. Check game result: **Win** or **Lose**
3. If **Win**: Balance should increase
   - Example: 1.5x multiplier on 10 chip bet = +5 chips payout
   - Final balance: ~145 Chips
4. If **Loss**: Balance stays at deducted amount (140)

✅ **Verify**: 
- Balance either stays reduced (loss) or increases (win)
- Balance is always shown in **Chips**, not any specific cryptocurrency

---

### Step B7: Play Multiple Games

1. Play **Slot** game and verify balance updates
2. Play **Plinko** game and verify balance updates
3. Switch games and verify balance is consistent across all

✅ **Verify**: 
- All games show balance in **Chips**
- Balance is synchronized across game switches
- No coin-specific icons appear in gameplay UI

---

### Step B8: Verify No Specific Coin Icons in Games

1. Open **Crash, Slot, Blackjack, Dice, Plinko** games
2. Look for **bet amount display area**
3. Should show **generic chip icon** not USDT/BTC/ETH icons

✅ **Verify**: All game UIs use chip icon, not cryptocurrency icons

---

### Step B9: Test Demo Mode Toggle Off and Back On

1. Go to **Wallet/Settings**
2. Toggle **Demo Mode** OFF
3. Check balance: Should show real balance (0 or small amount)
4. Toggle **Demo Mode** ON
5. Check balance: Should revert to `150 Chips` (demo balance)

✅ **Verify**: 
- Balance switches between demo (150) and real (<10) correctly
- Multiple toggles don't corrupt data
- Demo balance is persistent

---

### Step B10: Test Deposit to Demo Balance (UI)

1. While in Demo Mode, click **Deposit**
2. Select **Fiat Deposit** or **Crypto Deposit**
3. Enter amount (e.g., 50)
4. **For smoke test**: Simulate the deposit by calling Step A4 again
5. Refresh browser and verify balance increased

✅ **Verify**: 
- New demo balance = 150 + 50 = **200 Chips**
- UI reflects the update after refresh

---

## TEST FLOW C: Cross-Game Consistency

### Step C1: Start with Current Balance

Note: Current demo balance after tests above: **150 Chips** (or custom value)

---

### Step C2: Play Each Game Once

**Crash:**
- Bet: 15 chips
- Result: Win at 2.0x
- Balance change: -15 + 15(2.0-1) = -15 + 15 = final amount + 15
- Expected balance: 150 + 15 = 165 (if won)

**Slot:**
- Bet: 5 chips
- Expected UI: Shows 160 chips (or final amount - 5)

**Plinko:**
- Bet: 10 chips
- Expected UI: Shows consistent balance

✅ **Verify**: 
- Each game correctly deducts bet
- Each game shows current balance in chips
- No balance inconsistencies between games

---

## Final Validation Checklist

- [ ] Demo mode can be toggled on/off
- [ ] Demo balance initializes at 0 or previous value
- [ ] Simulated deposits increase demo balance correctly
- [ ] In-game balance displays total as **Chips** (not crypto names)
- [ ] Bet placements decrement balance correctly
- [ ] Game payouts increment balance correctly
- [ ] All games use **chip icon**, not specific cryptocurrency icons
- [ ] Balance is consistent across all games
- [ ] Demo mode toggle preserves balance on toggle
- [ ] No crashes or errors during gameplay with demo balance

---

## Backend Database Verification (MongoDB)

To verify data persistence, run these MongoDB commands:

```javascript
// Connect to MongoDB
mongo

// Select database
use PlayZelo

// Check user demo balance
db.users.findOne(
  {email: "test@demo.local"},
  {_id: 1, email: 1, demoMode: 1, demoBalance: 1}
)

// Expected output:
{
  "_id": ObjectId("..."),
  "email": "test@demo.local",
  "demoMode": true,
  "demoBalance": {
    "data": [
      {
        "coinType": "CHIPS",
        "balance": 150,  // or your final balance
        "chain": "",
        "type": "native"
      }
    ]
  }
}

// Also verify no games are still filtered by specific coinType:
db.crashBetHistory.findOne({}, {coinType: 1, betAmount: 1})
// Should show: "coinType": "CHIPS" (not USDT/BTC/etc.)
```

---

## Troubleshooting

| Issue | Resolution |
|-------|-----------|
| Can't find test user | Create one via frontend or MongoDB directly |
| Demo balance shows 0 after deposit | Refresh browser or call getAuthData again |
| Games show wrong coin icon | Clear browser cache, rebuild and redeploy frontend |
| Balance doesn't update after bet | Check browser console for errors, verify backend socket connection |
| Demo mode toggle stuck | Restart backend and refresh browser |

---

## Success Criteria

✅ **All tests pass when:**
1. Demo balance initializes and persists
2. Demo deposits increase balance correctly
3. All games show balance in **Chips** (not specific coins)
4. In-game balance updates match wallet balance
5. Bet placement and payouts work correctly
6. No specific coin icons appear in game UI
7. Multi-game play is consistent
8. Demo mode toggle works correctly

---

## Notes

- This test validates the **unified chips system** for games
- Header and non-game UIs may still show user's selected currency (expected)
- Games always operate on **demo balance** (if demo mode on) or **total real balance** (if demo mode off)
- Backend now ignores the `userData.currency` field during gameplay and uses first available balance entry as chips
