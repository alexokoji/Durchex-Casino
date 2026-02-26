# Quick Fixes - Copy & Paste Solutions

## 1. Fix React App.js - Add useEffect for Socket Initialization

**File:** `frontend/src/App.js`

**Replace the current code:**
```javascript
import { useSelector } from "react-redux";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, StyledEngineProvider } from "@mui/material";
import themes from "./themes";
import { LoadingProvider } from "./layout/Context/loading";
import ContextLoading from "./ui-component/loading";
import MainRoutes from "./routes/main";
import { GoogleOAuthProvider } from '@react-oauth/google'
import chatRoomConnect from "redux/actions/chat";
import baseInit from "redux/actions/base";
import { useEffect } from "react";

const App = () => {
    const customization = useSelector((state) => state.customization);
    
    // Initialize sockets only once on mount
    useEffect(() => {
        chatRoomConnect();
        baseInit();
    }, []);

    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    const children = (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={themes(customization)}>
                <CssBaseline />
                <LoadingProvider>
                    <ContextLoading />
                    <MainRoutes />
                </LoadingProvider>
            </ThemeProvider>
        </StyledEngineProvider>
    );

    if (googleClientId) {
        return (
            <GoogleOAuthProvider clientId={googleClientId}>
                {children}
            </GoogleOAuthProvider>
        );
    }

    return children;
};

export default App;
```

---

## 2. Fix React Router Future Flags

**File:** `frontend/src/index.js`

**Replace the BrowserRouter line:**
```javascript
// OLD:
<BrowserRouter>
    <ToastProvider>
        <Web3ReactProvider getLibrary={getLibrary}>
            <App />
        </Web3ReactProvider>
    </ToastProvider>
</BrowserRouter>

// NEW:
<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <ToastProvider>
        <Web3ReactProvider getLibrary={getLibrary}>
            <App />
        </Web3ReactProvider>
    </ToastProvider>
</BrowserRouter>
```

---

## 3. Fix Frontend Base URL

**File:** `frontend/src/config/baseConfig.js`

**Replace line 8:**
```javascript
// OLD:
baseUrl: isLocal ? 'http://localhost:8800' : 'https://memewarsx.com',

// NEW:
baseUrl: isLocal ? 'http://localhost:5000' : 'https://backend.memewarsx.com',
```

---

## 4. Create Backend .env File

**File:** `backend/.env` (Create new file)

```env
NODE_ENV=development
API_PORT=5000
JWT_SECRET=PLAYZELOSECRET
JWT_EXPIRE=1h

# MongoDB Configuration
MONGODB_URL=mongodb+srv://victoryfox1116:kzBPFHRoRfxdDGVO@cluster0.iknukbk.mongodb.net/PlayZelo?authSource=admin&replicaSet=atlas-10v8gb-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true

# Tatum Configuration
TATUM_API_KEY_TESTNET=t-64ddb376ba1bfa001cda4484-64de0f87946f4c001cc79647
TATUM_API_KEY_MAINNET=t-64ddb376ba1bfa001cda4484-64de0f6a143e73001c21f64d
TATUM_VIRTUAL_ACCOUNT_TESTNET=PlayZeloPaymentTestnet
TATUM_VIRTUAL_ACCOUNT_MAINNET=PlayZeloPaymentMainnet

# Infura Configuration
INFURA_API_KEY_TESTNET=69b01f7c51d044c0a7883220a2104df3
INFURA_API_KEY_MAINNET=69b01f7c51d044c0a7883220a2104df3
```

---

## 5. Fix Backend Config to Use Environment Variables

**File:** `backend/config.js`

**Replace with:**
```javascript
require('dotenv').config({ path: __dirname + '/.env' });

module.exports = {
    SERVER_PORT: process.env.API_PORT || 5000,
    JWT: {
        expireIn: process.env.JWT_EXPIRE || '1h',
        secret: process.env.JWT_SECRET || 'PLAYZELOSECRET'
    },
    DB: process.env.MONGODB_URL || 'mongodb+srv://victoryfox1116:kzBPFHRoRfxdDGVO@cluster0.iknukbk.mongodb.net/PlayZelo?authSource=admin&replicaSet=atlas-10v8gb-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true',
    MANAGEMENT_OPTION: {
        port: 4000
    },
    TATUM_OPTION: {
        testnet: {
            apikey: process.env.TATUM_API_KEY_TESTNET || 't-64ddb376ba1bfa001cda4484-64de0f87946f4c001cc79647',
            virtualAccount: process.env.TATUM_VIRTUAL_ACCOUNT_TESTNET || 'PlayZeloPaymentTestnet',
            withdrawFee: '0.00001'
        },
        mainnet: {
            apikey: process.env.TATUM_API_KEY_MAINNET || 't-64ddb376ba1bfa001cda4484-64de0f6a143e73001c21f64d',
            virtualAccount: process.env.TATUM_VIRTUAL_ACCOUNT_MAINNET || 'PlayZeloPaymentMainnet',
            withdrawFee: '0.00001'
        }
    },
    INFURA_OPTION: {
        testnet: {
            providerUrl: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY_TESTNET || '69b01f7c51d044c0a7883220a2104df3'}`
        },
        mainnet: {
            providerUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY_MAINNET || '69b01f7c51d044c0a7883220a2104df3'}`
        }
    },
    TRONWEB_OPTION: {
        testnet: {
            providerUrl: 'https://api.shasta.trongrid.io'
        },
        mainnet: {
            providerUrl: 'https://api.trongrid.io'
        }
    },
    BINANCE_URL: {
        testnet: {
            providerUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545'
        },
        mainnet: {
            providerUrl: 'https://bsc-dataseed.binance.org/'
        }
    }
};
```

---

## 6. Enhanced Socket Initialization with Error Handling

**File:** `frontend/src/redux/actions/base/index.js`

**Replace with:**
```javascript
import { io } from 'socket.io-client';
import Config from "config/index";

const baseInit = async () => {
    try {
        Config.Root.socket = io(Config.Root.socketServerUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            path: '/socket.io',
            autoConnect: true
        });

        Config.Root.socket.on('connect', () => {
            console.log('✓ Base socket connected successfully');
        });

        Config.Root.socket.on('connect_error', (error) => {
            console.error('✗ Base socket connection error:', error.message);
        });

        Config.Root.socket.on('disconnect', (reason) => {
            console.warn('Base socket disconnected:', reason);
        });

        Config.Root.socket.on('reconnect_attempt', () => {
            console.log('Attempting to reconnect base socket...');
        });

    } catch (error) {
        console.error('Error initializing base socket:', error);
    }
}

export default baseInit;
```

---

## 7. Enhanced Chat Socket Initialization with Error Handling

**File:** `frontend/src/redux/actions/chat/index.js`

**Replace with:**
```javascript
import { io } from 'socket.io-client';
import Config from "config/index";

const chatRoomConnect = async () => {
    try {
        Config.Root.chatSocket = io(Config.Root.chatSocketUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            path: '/socket.io',
            autoConnect: true
        });

        Config.Root.chatSocket.on('connect', () => {
            console.log('✓ Chat socket connected successfully');
        });

        Config.Root.chatSocket.on('connect_error', (error) => {
            console.error('✗ Chat socket connection error:', error.message);
        });

        Config.Root.chatSocket.on('disconnect', (reason) => {
            console.warn('Chat socket disconnected:', reason);
        });

        Config.Root.chatSocket.on('reconnect_attempt', () => {
            console.log('Attempting to reconnect chat socket...');
        });

    } catch (error) {
        console.error('Error initializing chat socket:', error);
    }
}

export default chatRoomConnect;
```

---

## 8. Update All Game Service Configs to Use Cloud MongoDB

**Files to update:**
- `backend/crash/config.js`
- `backend/dice/config.js`
- `backend/mines/config.js`
- `backend/plinko/config.js`
- `backend/slot/config.js`
- `backend/scissors/config.js`
- `backend/turtlerace/config.js`

**Example - File: `backend/crash/config.js`**

**Replace with:**
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

---

## 9. Create Frontend .env File

**File:** `frontend/.env`

```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:4000
REACT_APP_CHAT_SOCKET_URL=http://localhost:4900
GENERATE_SOURCEMAP=false
```

---

## 10. Create Admin .env File

**File:** `admin/.env`

```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
REACT_APP_API_URL=http://localhost:5000
GENERATE_SOURCEMAP=false
```

---

## 11. Fix MUI Select Component in Header (Example)

**File:** `frontend/src/layout/MainLayout/header.jsx`

**Look for the currency select and ensure it has a valid initial value:**

```javascript
// OLD:
const [currency, setCurrency] = useState("");

<Select value={currency} onChange={handleCurrencyChange}>
    {currencyList.map(c => <MenuItem key={c.coinType} value={c.coinType}>{c.name}</MenuItem>)}
</Select>

// NEW:
const [currency, setCurrency] = useState("DEMO");

useEffect(() => {
    if (currencyList.length > 0 && !currencyList.find(c => c.coinType === currency)) {
        setCurrency(currencyList[0].coinType);
    }
}, [currencyList]);

{currencyList.length > 0 && (
    <Select value={currency} onChange={handleCurrencyChange}>
        {currencyList.map(c => <MenuItem key={c.coinType} value={c.coinType}>{c.name}</MenuItem>)}
    </Select>
)}
```

---

## 12. Update MetaMask Integration (in wallet/auth components)

**File:** `frontend/src/views/main/modals/WalletModal.jsx` (or wherever metamask is connected)

**Add this utility function:**

```javascript
export const getMetaMaskProvider = () => {
    if (typeof window === 'undefined') return null;
    
    // Prefer window.ethereum (new standard)
    if (window.ethereum) {
        return window.ethereum;
    }
    
    // Fallback to web3.currentProvider (deprecated but still works)
    if (window.web3) {
        return window.web3.currentProvider;
    }
    
    console.error('MetaMask not detected. Please install MetaMask extension.');
    return null;
};

// Usage:
const provider = getMetaMaskProvider();
if (provider) {
    // Use provider for Web3 connections
}
```

---

## Quick Start Commands

```bash
# 1. Install dependencies
cd /home/alex/Desktop/My\ Projects/Durchex\ Casino/Web3-Casino-Crash-Game-Gamefi/backend
npm install

cd /home/alex/Desktop/My\ Projects/Durchex\ Casino/Web3-Casino-Crash-Game-Gamefi/frontend
npm install

cd /home/alex/Desktop/My\ Projects/Durchex\ Casino/Web3-Casino-Crash-Game-Gamefi/admin
npm install

# 2. Start services (in separate terminals)

# Terminal 1 - Main API
cd backend
npm start

# Terminal 2 - Management Service
cd backend
npm run manage

# Terminal 3 - Chat Service
cd backend
npm run chatroom

# Terminal 4 - Frontend
cd frontend
npm start

# Terminal 5 - Admin (Optional)
cd admin
npm start
```

---

## Verification Checklist

After applying fixes:

- [ ] All 4 backend services starting without errors
- [ ] Frontend starting without console errors
- [ ] No WebSocket connection errors in browser console
- [ ] Currency select working without MUI warnings
- [ ] No React Router warnings
- [ ] MetaMask connection working
- [ ] Database connections successful
- [ ] Games loading and connecting to proper sockets

