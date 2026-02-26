# Architecture & Service Dependencies Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                               │
│                    Port: 3000 (npm start)                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐     ┌──────────────────────────────────────┐ │
│  │  Redux Store         │     │  Socket.IO Clients                  │ │
│  │  - Auth State        │     │  - Base Socket (port 4000)          │ │
│  │  - Games State       │────→│  - Chat Socket (port 4900)          │ │
│  │  - Wallet State      │     │  - Game Sockets (5100-5700)         │ │
│  └──────────────────────┘     └──────────────────────────────────────┘ │
│           ↓                                    ↓                         │
│  ┌──────────────────────┐     ┌──────────────────────────────────────┐ │
│  │  HTTP Requests       │     │  WebSocket Connections               │ │
│  │  (Axios)             │────→│  (Socket.io-client)                  │ │
│  │  - POST /auth        │     │  - Real-time game updates            │ │
│  │  - GET /user         │     │  - Chat messages                     │ │
│  │  - POST /bet         │     │  - Multiplayer synchronization       │ │
│  └──────────────────────┘     └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓↓↓ (HTTP + WebSocket)
┌─────────────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES (Node.js)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────┐    ┌─────────────────────────────────────┐ │
│  │  Main API Server       │    │  Management Service                 │ │
│  │  Port: 5000            │    │  Port: 4000                         │ │
│  │  npm start             │    │  npm run manage                     │ │
│  ├────────────────────────┤    ├─────────────────────────────────────┤ │
│  │ Routes:                │    │ Socket Handlers:                    │ │
│  │ - /api/auth            │    │ - User connections                  │ │
│  │ - /api/user            │    │ - Game notifications                │ │
│  │ - /api/payment         │    │ - Real-time data updates            │ │
│  │ - /api/rewards         │    │ - Broadcasting to all users         │ │
│  └────────────────────────┘    └─────────────────────────────────────┘ │
│           ↓                                    ↓                         │
│  ┌────────────────────────┐    ┌─────────────────────────────────────┐ │
│  │  Chat Service          │    │  Game Services (Microservices)      │ │
│  │  Port: 4900            │    │                                     │ │
│  │  npm run chatroom      │    │  ┌─────────────────────────────┐   │ │
│  ├────────────────────────┤    │  │ Crash Game Service          │   │ │
│  │ Socket Handlers:       │    │  │ Port: 5700                  │   │ │
│  │ - Chat messages        │    │  │ npm run crash               │   │ │
│  │ - User notifications   │    │  ├─────────────────────────────┤   │ │
│  │ - Room management      │    │  │ Dice Game Service           │   │ │
│  └────────────────────────┘    │  │ Port: 5400                  │   │ │
│                                │  │ npm run dice                │   │ │
│                                │  ├─────────────────────────────┤   │ │
│                                │  │ Mines Game Service          │   │ │
│                                │  │ Port: 5300                  │   │ │
│                                │  │ npm run mines               │   │ │
│                                │  ├─────────────────────────────┤   │ │
│                                │  │ Slot Game Service           │   │ │
│                                │  │ Port: 5500                  │   │ │
│                                │  │ npm run slot                │   │ │
│                                │  └─────────────────────────────┘   │ │
│                                │  + Other games (Plinko, Turtlerace,│ │
│                                │    Scissors, Blackjack, etc.)      │ │
│                                └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓↓↓
┌─────────────────────────────────────────────────────────────────────────┐
│                     DATA LAYER (MongoDB)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  MongoDB Atlas (Cloud Database)                                         │
│  URL: mongodb+srv://victoryfox1116:***@cluster0.iknukbk.mongodb.net/... │
│                                                                          │
│  Collections:                                                            │
│  ├─ Users                                                               │
│  ├─ Auth Tokens                                                         │
│  ├─ Bet History (Crash)                                                │
│  ├─ Bet History (Dice)                                                 │
│  ├─ Bet History (Mines)                                                │
│  ├─ Bet History (Slot)                                                 │
│  ├─ Bet History (Plinko)                                               │
│  ├─ Game Results                                                        │
│  ├─ Wallets                                                             │
│  ├─ Transactions                                                        │
│  └─ Chat Messages                                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Service Startup Sequence

```
Step 1: Start Main Backend
┌─────────────────────────────────────────┐
│ cd backend && npm start                 │
│ ✓ API Server on port 5000              │
│ ✓ Connects to MongoDB                  │
│ ✓ Initializes Tatum/Infura clients     │
└─────────────────────────────────────────┘
                 ↓
Step 2: Start Management Service (new terminal)
┌─────────────────────────────────────────┐
│ cd backend && npm run manage             │
│ ✓ Management Service on port 4000       │
│ ✓ Socket.IO server listening            │
│ ✓ Connects to MongoDB                  │
└─────────────────────────────────────────┘
                 ↓
Step 3: Start Chat Service (new terminal)
┌─────────────────────────────────────────┐
│ cd backend && npm run chatroom           │
│ ✓ Chat Service on port 4900             │
│ ✓ Socket.IO server listening            │
│ ✓ Connects to MongoDB                  │
└─────────────────────────────────────────┘
                 ↓
Step 4: Start Frontend (new terminal)
┌─────────────────────────────────────────┐
│ cd frontend && npm start                │
│ ✓ React App on port 3000                │
│ ✓ Connects to API (5000)               │
│ ✓ Connects to Management Socket (4000) │
│ ✓ Connects to Chat Socket (4900)       │
└─────────────────────────────────────────┘
                 ↓
Step 5: (Optional) Start Game Services (if playing specific games)
┌─────────────────────────────────────────┐
│ New terminal for each game:             │
│ cd backend && npm run crash   (5700)    │
│ cd backend && npm run dice    (5400)    │
│ cd backend && npm run mines   (5300)    │
│ cd backend && npm run slot    (5500)    │
└─────────────────────────────────────────┘
```

---

## Service Connection Matrix

| Service | Port | Protocol | Type | Status |
|---------|------|----------|------|--------|
| Main API | 5000 | HTTP | REST API | **MUST RUN** |
| Management | 4000 | WS | Socket.IO | **MUST RUN** |
| Chat | 4900 | WS | Socket.IO | **MUST RUN** |
| Crash Game | 5700 | WS | Socket.IO | Optional |
| Dice Game | 5400 | WS | Socket.IO | Optional |
| Mines Game | 5300 | WS | Socket.IO | Optional |
| Slot Game | 5500 | WS | Socket.IO | Optional |
| Plinko Game | 5600 | WS | Socket.IO | Optional |
| Turtlerace | 5100 | WS | Socket.IO | Optional |
| Scissors | 5200 | WS | Socket.IO | Optional |
| Admin Panel | 3002 | HTTP | React App | Optional |
| Frontend | 3000 | HTTP | React App | **MUST RUN** |
| MongoDB | N/A | TCP | Database | **MUST RUN** |

---

## Directory Structure with Service Mapping

```
backend/
├── server.js                      ← Main API Server (Port 5000)
├── config.js                      ← Configuration
├── package.json
├── models/                        ← Database Models
│   ├── UserModel.js
│   ├── BetHistoryModel.js
│   ├── TransactionModel.js
│   └── ... (30+ models)
├── controllers/                   ← Business Logic
│   ├── authController.js
│   ├── cryptoController.js
│   ├── rewardController.js
│   └── tatumController.js
│
├── management/                    ← Management Service (Port 4000)
│   ├── ManagementService.js
│   ├── config.js
│   ├── app.js
│   ├── manager/
│   │   └── SocketManager.js
│   ├── socket/
│   │   └── ManageSocket.js
│   ├── controllers/
│   └── routes/
│
├── userchat/                      ← Chat Service (Port 4900)
│   ├── UserChatService.js
│   ├── config.js
│   ├── app.js
│   ├── manager/
│   │   └── SocketManager.js
│   ├── socket/
│   │   └── ChatSocket.js
│   └── controllers/
│
├── crash/                         ← Crash Game (Port 5700)
│   ├── CrashService.js
│   ├── config.js
│   ├── app.js
│   ├── manager/
│   │   └── SocketManager.js
│   ├── socket/
│   │   └── CrashSocket.js
│   └── controller/
│
├── dice/                          ← Dice Game (Port 5400)
│   ├── DiceService.js
│   └── ... (similar structure)
│
├── mines/                         ← Mines Game (Port 5300)
│   ├── MinesService.js
│   └── ... (similar structure)
│
├── slot/                          ← Slot Game (Port 5500)
│   ├── SlotService.js
│   └── ... (similar structure)
│
└── ... (other game services)

frontend/
├── src/
│   ├── App.js                     ← Main React Component
│   ├── index.js                   ← React DOM Entry
│   ├── config/
│   │   ├── baseConfig.js          ← Backend URLs & Socket URLs
│   │   └── apiConfig.js
│   ├── redux/
│   │   ├── actions/
│   │   │   ├── base/index.js      ← Base Socket Initialization
│   │   │   └── chat/index.js      ← Chat Socket Initialization
│   │   └── reducers/
│   ├── routes/
│   │   ├── main.js                ← Main Routes
│   │   └── mainRoutes.js
│   ├── views/
│   │   └── main/game/
│   │       ├── crash/
│   │       ├── dice/
│   │       ├── mines/
│   │       ├── slot/
│   │       └── ... (other games)
│   └── layout/
└── public/

admin/
├── src/
│   └── ... (Admin Management Interface)
└── public/
```

---

## Data Flow Diagram

### User Login Flow
```
User → Frontend Login Form
   ↓
POST /api/auth/email-login or /api/auth/metamask-login
   ↓
Main API (5000) validates credentials
   ↓
Returns JWT Token + User Data
   ↓
Frontend stores in Redux
   ↓
Frontend connects to Management Socket (4000) with auth token
   ↓
Management Service validates token
   ↓
Socket connected, user can now play games
```

### Game Bet Flow
```
User places bet → Frontend
   ↓
Frontend connects to Game Socket (5700 for Crash, etc.)
   ↓
Frontend emits 'joinBet' event with bet data
   ↓
Game Service receives bet, validates
   ↓
Game Service connects to MongoDB, saves bet
   ↓
Game Service broadcasts to all players via Socket
   ↓
Players see real-time bet updates
   ↓
Game round completes
   ↓
Game Service calculates results, updates database
   ↓
Game Service broadcasts results via Socket
   ↓
Frontend receives results, updates UI
```

### Real-time Chat Flow
```
User types message → Frontend Chat Component
   ↓
Frontend emits 'sendMessage' to Chat Socket (4900)
   ↓
Chat Service receives message
   ↓
Chat Service saves to MongoDB
   ↓
Chat Service broadcasts to all users in chat room
   ↓
All connected users receive message via Socket
   ↓
Chat Component updates with new message
```

---

## Troubleshooting Connection Issues

### Checklist for Debugging

1. **Check if services are running:**
   ```bash
   # Terminal 1: Check Main API
   curl http://localhost:5000/
   
   # Terminal 2: Check if ports are listening
   netstat -an | grep LISTEN | grep -E "5000|4000|4900"
   ```

2. **Check browser console for errors:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for "WebSocket connection failed" errors
   - Check which URL is failing

3. **Common issues:**
   - ❌ Port already in use → Kill process or change port
   - ❌ Service not starting → Check for config errors or missing .env
   - ❌ MongoDB connection error → Check connection string
   - ❌ CORS errors → Backend CORS not configured properly

4. **Frontend console debug output:**
   ```javascript
   // Add to frontend/src/config/baseConfig.js for debugging
   console.log('Frontend Config:', Config.Root);
   
   // Check socket connection
   console.log('Socket:', Config.Root.socket);
   console.log('Socket Connected:', Config.Root.socket?.connected);
   ```

---

## Production Deployment Structure

```
Production Environment
│
├── Frontend (Nginx/Vercel)
│   └── Port 443 (HTTPS)
│
├── Backend Services
│   ├── Main API (https://backend.memewarsx.com:443)
│   ├── Management (wss://management.memewarsx.com:4001)
│   ├── Chat (wss://chat.memewarsx.com:4901)
│   └── Game Services (wss://[game].memewarsx.com:[port])
│
├── MongoDB Atlas (Cloud)
│   └── Replicated across regions
│
└── Load Balancer
    └── Routes traffic to services
```

