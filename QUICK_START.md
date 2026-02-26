# 🚀 Quick Start Guide - Web3 Casino Platform

## Prerequisites

- Node.js 14+ installed
- npm (comes with Node.js)
- MongoDB Atlas account (already configured)
- Internet connection

## Option 1: Automated Startup (Recommended)

### Linux / macOS

```bash
# Make the script executable
chmod +x start.sh

# Run it
./start.sh
```

This will:
- ✅ Check for Node.js
- ✅ Kill any existing services
- ✅ Install dependencies if needed
- ✅ Start all 4 services
- ✅ Open browser automatically

### Windows

Simply double-click: **`start.bat`**

Or run from Command Prompt:
```bash
start.bat
```

---

## Option 2: Manual Startup (For Debugging)

If you want to control each service individually or see detailed logs:

### Terminal 1 - Main API Server
```bash
cd backend
npm start
```

Expected output:
```
server connected to mongodb successfully
server started on 5000 port
```

### Terminal 2 - Management Service
```bash
cd backend
npm run manage
```

Expected output:
```
server connected to mongodb successfully
Management Server started on 4000
```

### Terminal 3 - Chat Service
```bash
cd backend
npm run chatroom
```

Expected output:
```
server connected to mongodb successfully
```

### Terminal 4 - Frontend
```bash
cd frontend
npm start
```

Expected output:
```
Compiled successfully!
You can now view client in the browser at:
  Local:            http://localhost:3000
```

---

## Verify Everything Works

### Option 1: Use Health Check Script

**Linux / macOS:**
```bash
chmod +x check-health.sh
./check-health.sh
```

**Windows:**
```bash
# Just open a command prompt and check manually:
netstat -an | find "5000"
netstat -an | find "4000"
netstat -an | find "4900"
netstat -an | find "3000"
```

### Option 2: Manual Verification

1. **Open Browser:** Go to `http://localhost:3000`

2. **Check Console (F12):**
   - Press `F12` to open DevTools
   - Go to "Console" tab
   - Look for these messages:
     ```
     ✓ Base socket connected successfully
     ✓ Chat socket connected successfully
     ```
   - Should see NO errors like "WebSocket connection failed"

3. **Check Network Tab (F12 → Network):**
   - Should see requests to `http://localhost:5000/api/...`
   - Should see WebSocket connections to `/socket.io`

---

## Common Issues & Solutions

### ❌ "Port already in use"

**Solution:**
```bash
# Linux / macOS
lsof -i :5000  # Check what's using port 5000
lsof -i :4000  # Check port 4000
lsof -i :4900  # Check port 4900
lsof -i :3000  # Check port 3000

# Kill process using port (example for port 5000)
kill -9 $(lsof -t -i:5000)
```

**Windows:**
```bash
# Find process on port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual number)
taskkill /F /PID <PID>
```

### ❌ "MongoDB connection error"

**Check:**
1. Internet connection is working
2. MongoDB Atlas account is accessible
3. IP address is whitelisted in MongoDB Atlas
   - Go to: MongoDB Atlas → Network Access → IP Whitelist
   - Add: `0.0.0.0/0` (for development only)

### ❌ "WebSocket connection failed"

**Check:**
1. Are all 3 backend services running? (5000, 4000, 4900)
2. Are there any error messages in the backend terminals?
3. Check browser console (F12) for specific error

### ❌ Frontend keeps loading / blank page

**Solution:**
```bash
# Clear cache and try again
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### ❌ "Cannot find module"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## File Structure After Fix

```
Web3-Casino-Crash-Game-Gamefi/
├── start.sh                 ← Run this (Linux/Mac)
├── start.bat                ← Run this (Windows)  
├── check-health.sh          ← Verify services
├── backend/
│   ├── .env                 ← Configuration (NEW)
│   ├── config.js            ← Uses .env now (UPDATED)
│   ├── server.js            ← Main API
│   ├── management/
│   │   ├── config.js        ← Updated
│   │   └── ManagementService.js
│   ├── userchat/
│   │   ├── config.js        ← Updated
│   │   └── UserChatService.js
│   ├── crash/config.js      ← Updated
│   ├── dice/config.js       ← Updated
│   ├── mines/config.js      ← Updated
│   ├── slot/config.js       ← Updated
│   ├── plinko/config.js     ← Updated
│   ├── turtlerace/config.js ← Updated
│   └── scissors/config.js   ← Updated
├── frontend/
│   ├── .env                 ← Updated with socket URLs
│   ├── src/
│   │   ├── App.js           ← Fixed (useEffect added)
│   │   ├── index.js         ← Fixed (Router flags added)
│   │   ├── config/
│   │   │   └── baseConfig.js ← Fixed (port 5000, URLs complete)
│   │   ├── redux/
│   │   │   └── actions/
│   │   │       ├── base/index.js    ← Enhanced error handling
│   │   │       └── chat/index.js    ← Enhanced error handling
│   │   └── utils/
│   │       └── walletUtils.js       ← New MetaMask utilities
│   └── public/
├── admin/
│   └── .env                 ← New configuration
└── README_ANALYSIS.md       ← Full analysis docs
```

---

## Services Overview

| Service | Port | Purpose | Start Command |
|---------|------|---------|---|
| Main API | 5000 | REST API endpoints | `npm start` |
| Management | 4000 | WebSocket for main updates | `npm run manage` |
| Chat | 4900 | WebSocket for chat | `npm run chatroom` |
| Frontend | 3000 | React UI | `npm start` (in frontend/) |
| Crash Game | 5700 | (Optional) | `npm run crash` |
| Dice Game | 5400 | (Optional) | `npm run dice` |
| Mines Game | 5300 | (Optional) | `npm run mines` |
| Slot Game | 5500 | (Optional) | `npm run slot` |
| Plinko Game | 5600 | (Optional) | `npm run plinko` |
| Turtlerace | 5100 | (Optional) | `npm run turtlerace` |
| Scissors | 5200 | (Optional) | `npm run scissors` |

---

## Testing the Platform

Once everything is running:

1. **Login:**
   - Click "Sign In" button
   - Try email login or MetaMask

2. **Select Currency:**
   - Should show dropdown with no warnings

3. **Play a Game:**
   - Click on any game (Mines, Crash, Dice, etc.)
   - Place a bet
   - Game should work without connection errors

4. **Chat:**
   - Try sending a message
   - Should appear in real-time

---

## Stopping Services

### Option 1: Ctrl+C Method
- In each terminal running a service, press `Ctrl+C`
- Or close the terminal windows

### Option 2: Kill Command
**Linux / macOS:**
```bash
killall node
```

**Windows Command Prompt:**
```bash
taskkill /F /IM node.exe
```

---

## Next Steps

### For Development:
1. ✅ Services running
2. ✅ Frontend loaded
3. ► Make code changes
4. ► Frontend auto-reloads
5. ► Backend may need restart

### For Production Deployment:
- See [IMPLEMENTATION_GUIDE.md](../IMPLEMENTATION_GUIDE.md) for production steps
- Update production URLs in configs
- Set secure JWT secret
- Restrict CORS to your domain
- Enable HTTPS

---

## Documentation

| File | Purpose |
|------|---------|
| DOCUMENTATION_INDEX.md | Overview of all docs |
| README_ANALYSIS.md | Executive summary |
| ISSUES_ANALYSIS.md | Detailed issue breakdown |
| QUICK_FIXES.md | Code snippets |
| ARCHITECTURE.md | System design |
| IMPLEMENTATION_GUIDE.md | Step-by-step setup |
| THIS FILE | Quick start |

---

## Support

**If services won't start:**
1. Read the error message carefully
2. Check relevant section in "Common Issues" above
3. Check browser console (F12) for clues
4. Review backend terminal output for errors

**If you need more help:**
- Check the detailed docs mentioned above
- Review error messages in browser console
- Check backend service terminal output

---

## Success! 🎉

If you see:
- ✅ Frontend loading at `http://localhost:3000`
- ✅ Socket connection messages in console
- ✅ No errors
- ✅ Can interact with the UI

**Congratulations! The platform is fully operational!**

```
╔════════════════════════════════════════╗
║  Web3 Casino Platform - Ready to Play  ║
║  Frontend:  http://localhost:3000      ║
║  API:       http://localhost:5000      ║
║  Sockets:   ws://localhost:4000        ║
╚════════════════════════════════════════╝
```

Now you can:
- Test games
- Test chat
- Test authentication
- Test wallets
- Monitor admin panel
- Deploy to production

Enjoy! 🚀
