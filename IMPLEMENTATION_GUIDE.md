# Implementation Guide - Step by Step

Follow this guide in order to fix all issues and get the application working 100%.

---

## Phase 1: Preparation (5 minutes)

### 1.1 Close All Running Processes

```bash
# Kill all Node processes
killall node

# Or on specific ports
lsof -i :3000 -i :5000 -i :4000 -i :4900 | awk 'NR!=1 {print $2}' | xargs kill -9
```

### 1.2 Backup Current Files (Optional but Recommended)

```bash
cd "/home/alex/Desktop/My Projects/Durchex Casino/Web3-Casino-Crash-Game-Gamefi"
cp -r frontend frontend.backup
cp -r backend backend.backup
cp -r admin admin.backup
```

### 1.3 Clean Node Modules

```bash
# Clear node_modules and package locks
cd backend
rm -rf node_modules package-lock.json
npm cache clean --force

cd ../frontend
rm -rf node_modules package-lock.json
npm cache clean --force

cd ../admin
rm -rf node_modules package-lock.json
npm cache clean --force
```

---

## Phase 2: Fix Critical Issues (30 minutes)

### 2.1 Fix Frontend App.js - React Hooks

**File:** `frontend/src/App.js`

Copy the content from `QUICK_FIXES.md` section "1. Fix React App.js"

**How to apply:**
1. Open VS Code
2. Go to file `frontend/src/App.js`
3. Replace the entire content with the fixed version
4. Save (Ctrl+S)

### 2.2 Fix React Router Future Flags

**File:** `frontend/src/index.js`

Copy the content from `QUICK_FIXES.md` section "2. Fix React Router Future Flags"

**How to apply:**
1. Open `frontend/src/index.js`
2. Find the `<BrowserRouter>` line (around line 30)
3. Replace it with the fixed version that includes future flags
4. Save

### 2.3 Fix Frontend Base URL Configuration

**File:** `frontend/src/config/baseConfig.js`

Copy the changes from `QUICK_FIXES.md` section "3. Fix Frontend Base URL"

**How to apply:**
1. Open `frontend/src/config/baseConfig.js`
2. Find line 8: `baseUrl: isLocal ? 'http://localhost:8800' : ...`
3. Change `8800` to `5000`
4. Save

### 2.4 Create Backend .env File

**File:** `backend/.env` (Create new)

**How to apply:**
1. In VS Code, go to File → New File
2. Copy content from `QUICK_FIXES.md` section "4. Create Backend .env File"
3. Paste the content
4. Save as `backend/.env`

### 2.5 Update Backend Config.js

**File:** `backend/config.js`

Copy from `QUICK_FIXES.md` section "5. Fix Backend Config"

**How to apply:**
1. Open `backend/config.js`
2. Replace the entire file content with the fixed version
3. Save

### 2.6 Create Frontend .env File

**File:** `frontend/.env`

Copy from `QUICK_FIXES.md` section "9. Create Frontend .env File"

**How to apply:**
1. Create new file `frontend/.env`
2. Paste content
3. Save

### 2.7 Create Admin .env File

**File:** `admin/.env`

Copy from `QUICK_FIXES.md` section "10. Create Admin .env File"

**How to apply:**
1. Create new file `admin/.env`
2. Paste content
3. Save

---

## Phase 3: Fix Backend Services (20 minutes)

### 3.1 Update All Game Service Configs to Use Cloud MongoDB

**Files to update:**
- `backend/crash/config.js`
- `backend/dice/config.js`
- `backend/mines/config.js`
- `backend/plinko/config.js`
- `backend/slot/config.js`
- `backend/scissors/config.js` (if exists)
- `backend/turtlerace/config.js` (if exists)

**For each file (example with crash):**

1. Open `backend/crash/config.js`
2. Replace content with:
```javascript
require('dotenv').config({ path: __dirname + '/../.env' });

module.exports = {
    serverInfo: {
        host: '127.0.0.1',
        port: '5700'
    },
    DB: process.env.MONGODB_URL || 'mongodb+srv://victoryfox1116:kzBPFHRoRfxdDGVO@cluster0.iknukbk.mongodb.net/PlayZelo?authSource=admin&replicaSet=atlas-10v8gb-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true'
}
```
3. Adjust the port number for each game:
   - crash: 5700
   - dice: 5400
   - mines: 5300
   - plinko: 5600
   - slot: 5500
   - scissors: 5200
   - turtlerace: 5100
4. Save

### 3.2 Update Management Service Config

**File:** `backend/management/config.js`

Replace with:
```javascript
require('dotenv').config({ path: __dirname + '/../.env' });

module.exports = {
    serverInfo: {
        host: '127.0.0.1',
        port: '4000'
    },
    DB: process.env.MONGODB_URL || 'mongodb+srv://victoryfox1116:kzBPFHRoRfxdDGVO@cluster0.iknukbk.mongodb.net/PlayZelo?authSource=admin&replicaSet=atlas-10v8gb-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true'
}
```

### 3.3 Update Chat Service Config

**File:** `backend/userchat/config.js` (if exists, otherwise check in UserChatService.js)

Look for where DB is defined and update to:
```javascript
require('dotenv').config({ path: __dirname + '/../.env' });

DB: process.env.MONGODB_URL || 'mongodb+srv://victoryfox1116:kzBPFHRoRfxdDGVO@cluster0.iknukbk.mongodb.net/PlayZelo?authSource=admin&replicaSet=atlas-10v8gb-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true'
```

---

## Phase 4: Update Socket Initialization (10 minutes)

### 4.1 Enhance Base Socket with Error Handling

**File:** `frontend/src/redux/actions/base/index.js`

Copy from `QUICK_FIXES.md` section "6. Enhanced Socket Initialization"

**How to apply:**
1. Open `frontend/src/redux/actions/base/index.js`
2. Replace entire content
3. Save

### 4.2 Enhance Chat Socket with Error Handling

**File:** `frontend/src/redux/actions/chat/index.js`

Copy from `QUICK_FIXES.md` section "7. Enhanced Chat Socket Initialization"

**How to apply:**
1. Open `frontend/src/redux/actions/chat/index.js`
2. Replace entire content
3. Save

---

## Phase 5: Frontend Dependencies (15 minutes)

### 5.1 Install Backend Dependencies

```bash
cd "/home/alex/Desktop/My Projects/Durchex Casino/Web3-Casino-Crash-Game-Gamefi/backend"
npm install
```

Wait for completion. Should see "added X packages" message.

### 5.2 Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

Wait for completion.

### 5.3 Install Admin Dependencies (Optional)

```bash
cd ../admin
npm install
```

Wait for completion.

---

## Phase 6: Testing - Start Services (30 minutes)

### 6.1 Start Main Backend API

**Terminal 1:**
```bash
cd "/home/alex/Desktop/My Projects/Durchex Casino/Web3-Casino-Crash-Game-Gamefi/backend"
npm start
```

**Expected output:**
```
server connected to mongodb successfully
server started on 5000 port
```

**If you see errors:**
- Check if port 5000 is already in use: `lsof -i :5000`
- Check .env file for correct MongoDB URL
- Check internet connection (needs to reach MongoDB Atlas)

### 6.2 Start Management Service

**Terminal 2:**
```bash
cd "/home/alex/Desktop/My Projects/Durchex Casino/Web3-Casino-Crash-Game-Gamefi/backend"
npm run manage
```

**Expected output:**
```
server connected to mongodb successfully
Management Server started on 4000
```

**If you see errors:**
- Check port 4000 availability
- Check that MongoDB connection works

### 6.3 Start Chat Service

**Terminal 3:**
```bash
cd "/home/alex/Desktop/My Projects/Durchex Casino/Web3-Casino-Crash-Game-Gamefi/backend"
npm run chatroom
```

**Expected output:**
```
server connected to mongodb successfully
```

### 6.4 Start Frontend

**Terminal 4:**
```bash
cd "/home/alex/Desktop/My Projects/Durchex Casino/Web3-Casino-Crash-Game-Gamefi/frontend"
npm start
```

**Expected output:**
```
Compiled successfully!

You can now view client in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://xxx.xxx.xxx.xxx:3000
```

**Open browser:**
Go to `http://localhost:3000`

### 6.5 Verify in Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Look for these messages:
   - ✓ "Base socket connected successfully"
   - ✓ "Chat socket connected successfully"
   - ✗ No "WebSocket connection failed" errors

---

## Phase 7: Verification Checklist

### Frontend Checks
- [ ] Page loads without errors
- [ ] No React Router warnings
- [ ] Console shows socket connections successful
- [ ] Currency select dropdown works (no MUI warnings)
- [ ] Can click "Sign In" button
- [ ] Can connect wallet (if implemented)

### Backend Checks
- [ ] Main API running on 5000
- [ ] Management service running on 4000
- [ ] Chat service running on 4900
- [ ] All services connected to MongoDB
- [ ] No error messages in terminals

### Network Checks
- [ ] Can see Network tab in DevTools
- [ ] WebSocket connections to /socket.io/(endpoints)
- [ ] HTTP requests to http://localhost:5000/api/...

---

## Phase 8: Fix Remaining Issues (Optional)

### 8.1 Fix MUI Select Components (if still showing warnings)

**Example fix for header currency selector:**

File: `frontend/src/layout/MainLayout/header.jsx` (find currency select)

```javascript
// Add better default value handling
const [currency, setCurrency] = useState("DEMO"); // Default instead of empty string

// Add useEffect to validate selected currency exists
useEffect(() => {
    if (currencyList.length > 0) {
        const currencyExists = currencyList.find(c => c.coinType === currency);
        if (!currencyExists) {
            setCurrency(currencyList[0].coinType);
        }
    }
}, [currencyList, currency]);

// Only render select when currency list is ready
{currencyList.length > 0 && (
    <Select 
        value={currency} 
        onChange={handleCurrencyChange}
        className={classes.CustomSelect}
    >
        {currencyList.map(c => (
            <MenuItem key={c.coinType} value={c.coinType} className={classes.CustomMenuItem}>
                {c.name}
            </MenuItem>
        ))}
    </Select>
)}
```

### 8.2 Fix MetaMask Integration

Add utility function in component file or create `frontend/src/utils/walletUtils.js`:

```javascript
export const getMetaMaskProvider = () => {
    if (typeof window === 'undefined') return null;
    return window.ethereum || (window.web3 && window.web3.currentProvider) || null;
};

export const connectMetaMask = async () => {
    const provider = getMetaMaskProvider();
    if (!provider) {
        alert('MetaMask not installed');
        return null;
    }
    
    try {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        return accounts[0];
    } catch (error) {
        console.error('Failed to connect MetaMask:', error);
        return null;
    }
};
```

---

## Phase 9: Start Game Services (Optional)

If you want to play specific games, start them in separate terminals:

```bash
# Terminal 5 - Crash Game
cd backend
npm run crash

# Terminal 6 - Dice Game (in new terminal)
cd backend
npm run dice

# Terminal 7 - Mines Game (in new terminal)
cd backend
npm run mines

# Terminal 8 - Slot Game (in new terminal)
cd backend
npm run slot
```

---

## Troubleshooting

### Issue: "Port already in use"
```bash
# Find process using the port
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change the port in config file
```

### Issue: "MongoDB connection error"
```
Check:
1. Internet connection
2. MongoDB Atlas account access
3. IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for development)
4. Connection string in .env file
```

### Issue: "WebSocket connection failed"
```
Check:
1. Are all 3 backend services running?
2. Is the port configured correctly in baseConfig.js?
3. Check CORS settings in Express server
4. Browser console for specific errors
```

### Issue: "Socket not defined in Redux"
```
Check:
1. baseInit() and chatRoomConnect() are being called
2. They're inside useEffect, not in component body
3. Config.Root is properly imported
```

### Issue: "Blank page or infinite loading"
```
Check:
1. Frontend console for JavaScript errors
2. Network tab for failed requests
3. Verify all backend services are running
4. Check browser cache (Ctrl+Shift+Del)
```

---

## Quick Health Check Script

Run this in browser console to check if everything is working:

```javascript
console.log('=== Casino Platform Health Check ===');

// Check Main API
fetch('http://localhost:5000')
    .then(r => console.log('✓ Main API (5000):', r.status))
    .catch(e => console.log('✗ Main API (5000): Not responding'));

// Check Socket connections
console.log('✓ Base Socket Connected:', window.socket?.connected || false);
console.log('✓ Chat Socket Connected:', window.chatSocket?.connected || false);

// Check Redux State
console.log('Auth Data:', localStorage.getItem('token') ? 'Token found' : 'No token');

// Check Environment
console.log('Environment:', process.env.NODE_ENV);
console.log('=== Health Check Complete ===');
```

---

## Final Verification

After completing all phases, verify:

1. **Frontend loads:** ✓ http://localhost:3000
2. **No console errors:** ✓ Check DevTools Console
3. **Sockets connected:** ✓ Check Redux state or console logs
4. **API responding:** ✓ Network tab shows successful requests
5. **Database connected:** ✓ No MongoDB connection errors
6. **All 3 services running:** ✓ Check all 4 terminals

---

## Next Steps

Once everything is working:

1. **Play a game** - Test betting functionality
2. **Check chat** - Verify real-time messaging works
3. **Test wallet** - Connect and test MetaMask
4. **Review logs** - Look for any persistent warnings
5. **Deploy** - When ready for production, use production config

---

## Support Notes

If issues persist after following this guide:

1. **Check all 3 services are running** - Most common issue
2. **Verify MongoDB connectivity** - Second most common
3. **Check browser console** - Always check for specific error messages
4. **Check terminal output** - Backend errors are printed there
5. **Network tab** - See which requests are failing

