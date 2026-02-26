# Authentication & Wallet Connection Revamp Guide

## Overview

This document outlines the improved authentication system for the Durchex Casino Web3 platform, featuring:
- ✅ Clean separation of concerns
- ✅ Unified authentication flow
- ✅ Proper wallet signature verification
- ✅ Better error handling and validation
- ✅ Improved user experience

## New Components & Services

### 1. Frontend Services

#### `WalletAuthService` (`frontend/src/services/WalletAuthService.js`)
Handles all wallet connection and verification logic:
- **connectMetaMask()** - Connect to MetaMask wallet
- **connectWalletConnect(connector)** - Connect via WalletConnect
- **connectCoinbase(connector)** - Connect via Coinbase Wallet
- **generateVerificationMessage()** - Create signature message
- **requestSignature()** - Request user signature
- **isValidAddress()** - Validate wallet address
- **formatAddress()** - Format address for display

```javascript
import WalletAuthService from 'services/WalletAuthService';

// Connect MetaMask
const walletData = await WalletAuthService.connectMetaMask();
// Result: { address, provider, walletType }
```

#### `ValidationService` (`frontend/src/services/ValidationService.js`)
Provides input validation:
- **isValidEmail()** - Email validation
- **isValidUsername()** - 3-20 chars, alphanumeric + _ -
- **isValidPassword()** - Strong password validation
- **isValidVerificationCode()** - 6-digit code validation
- **getErrorMessage()** - User-friendly error messages

```javascript
import ValidationService from 'services/ValidationService';

if (!ValidationService.isValidEmail(email)) {
    // Show error
}
```

### 2. Frontend Components

#### `AuthModalNew` (`frontend/src/views/main/modals/AuthModalNew.jsx`)
Improved authentication modal with clean flow:

**Features:**
- Step-based registration/login
- Email verification flow
- Wallet connection
- Google OAuth integration
- Profile setup wizard
- Clear error messages
- Loading states

**Steps:**
1. **LOGIN_CHOICE** - Choose auth method
2. **EMAIL_INPUT** - Enter email
3. **EMAIL_CODE** - Verify code
4. **PROFILE_SETUP** - Set username
5. **SUCCESS** - Completion

```javascript
<AuthModal open={open} setOpen={setOpen} />
```

### 3. Backend Endpoints

#### New/Improved Routes (add to `backend/routes/authRouter.js`):

```javascript
// Email authentication
Router.post('/email-login', authController.emailLogin);
Router.post('/verify-email-code', authController.verifyEmailCode);

// Wallet authentication  
Router.post('/wallet-verification-message', authController.getWalletVerificationMessage);
Router.post('/wallet-login', authController.walletLogin);

// Profile
Router.post('/update-profile', authController.updateProfileSet);

// Logout
Router.post('/logout', authController.logout);
```

#### Backend Auth Controller Updates

The new `authControllerNew.js` includes:

**Key Improvements:**
1. **Better Error Handling**
   - Clear error messages
   - Proper validation
   - Consistent response format

2. **Unified User Creation**
   - Single function for all auth types
   - Automatic campaign code generation
   - Game settings initialization

3. **Profile Completion**
   - Username uniqueness check
   - Proper validation
   - Required before gameplay

4. **Helper Functions**
   - `generateUserToken()` - JWT generation
   - `createCampaignCode()` - Campaign code creation
   - `getOrCreateGameSettings()` - Settings management

## Integration Steps

### Step 1: Update Routes

Replace the old auth routes in `backend/routes/authRouter.js`:

```javascript
const routerx = require('express-promise-router');
const authController = require('../controllers/authControllerNew');
const rewardController = require('../controllers/rewardController');

const Router = routerx();

// Email authentication
Router.post('/email-login', authController.emailLogin);
Router.post('/verify-email-code', authController.verifyEmailCode);

// Wallet authentication
Router.post('/wallet-verification-message', authController.getWalletVerificationMessage);
Router.post('/wallet-login', authController.walletLogin);

// Social login
Router.post('/google-login', authController.userGoogleLogin);

// Profile management
Router.post('/update-profile', authController.updateProfileSet);
Router.post('/get-auth-data', authController.getAuthData);

// Logout
Router.post('/logout', authController.logout);

// ... other routes

module.exports = Router;
```

### Step 2: Update Frontend Config

Add new API endpoints to `frontend/src/config/apiConfig.js`:

```javascript
export default class GamblingService {
    constructor() {
        // ... existing config
    }

    // New endpoints
    emailLogin = (...args) => axios.post(ApiConfig.request.emailLogin, ...args);
    verifyEmailCode = (...args) => axios.post(ApiConfig.request.verifyEmailCode, ...args);
    walletLogin = (...args) => axios.post(ApiConfig.request.walletLogin, ...args);
    getWalletVerificationMessage = (...args) => axios.post(ApiConfig.request.walletVerificationMessage, ...args);
    updateProfileSet = (...args) => axios.post(ApiConfig.request.updateProfileSet, ...args);
    logout = (...args) => axios.post(ApiConfig.request.logout, ...args);
    
    // Add to request paths
}
```

### Step 3: Update API Request Paths

In `frontend/src/config/apiConfig.js` constants:

```javascript
const ApiConfig = {
    request: {
        emailLogin: '/auth/email-login',
        verifyEmailCode: '/auth/verify-email-code',
        walletLogin: '/auth/wallet-login',
        walletVerificationMessage: '/auth/wallet-verification-message',
        updateProfileSet: '/auth/update-profile',
        getAuthData: '/auth/get-auth-data',
        logout: '/auth/logout',
        // ... other endpoints
    }
};
```

### Step 4: Replace Auth Modal

In your layout where you use the modal:

```javascript
// Old
import AuthModal from 'views/main/modals/AuthModal';

// New
import AuthModal from 'views/main/modals/AuthModalNew';
```

### Step 5: Update Redux Actions

Use new actions from `redux/actions/authNew/index.js`:

```javascript
// Old
import { userGoogleLogin, metamaskLogin } from 'redux/actions/auth';

// New
import { userGoogleLogin, walletLogin, emailLogin, verifyEmailCode, updateProfileSet } from 'redux/actions/authNew';
```

## Authentication Flow Diagrams

### Email Flow
```
1. User enters email
   ↓
2. System sends verification code to email
   ↓
3. User enters 6-digit code
   ↓
4. System creates or logs in user
   ↓
5. If new user, requires profile setup
   ↓
6. Authentication complete
```

### Wallet Flow
```
1. User clicks wallet icon
   ↓
2. System opens wallet extension
   ↓
3. User approves connection
   ↓
4. System gets wallet address
   ↓
5. System creates or logs in user
   ↓
6. If new user, requires profile setup
   ↓
7. Authentication complete
```

### Google Flow
```
1. User clicks Google button
   ↓
2. Google OAuth dialog appears
   ↓
3. User authorizes access
   ↓
4. System verifies token
   ↓
5. System creates or logs in user
   ↓
6. If new user, requires profile setup
   ↓
7. Authentication complete
```

## Data Model Updates

### User Model (`backend/models/UserModel.js`)

```javascript
const ModelSchema = mongoose.Schema({
    userName: String,                    // Email or wallet address
    userEmail: String,                   // Email address
    userPassword: String,                // Password (if applicable)
    userToken: String,                   // JWT token
    loginType: {
        type: String,
        enum: ['Google', 'Wallet', 'Email', 'Apple'],
        default: 'Email'
    },
    userNickName: {
        type: String,
        required: true
    },
    profileSet: {
        type: Boolean,
        default: false                   // NEW: Track if profile is complete
    },
    type: { type: String, enum: ['user', 'admin'], default: 'user' },
    address: mongoose.Schema.Types.Mixed,
    balance: Array,
    // ... other fields
}, { autoIndex: true, timestamps: true });
```

## Error Handling

All endpoints return consistent error responses:

```json
{
    "status": false,
    "message": "User-friendly error message"
}
```

Common errors:
- **Invalid email format** - "Please enter a valid email address."
- **Code expired** - "Verification code has expired. Please request a new one."
- **Invalid code** - "Invalid verification code."
- **Username taken** - "Username is already taken."
- **Wallet not connected** - "Failed to connect wallet."
- **Server error** - "Server Error"

## Best Practices

### Security
1. ✅ Always validate input on both frontend and backend
2. ✅ Use JWT tokens with expiration
3. ✅ Store tokens securely (httpOnly cookies preferred)
4. ✅ Implement rate limiting on auth endpoints
5. ✅ Verify email addresses
6. ✅ Implement wallet signature verification

### UX
1. ✅ Show clear error messages
2. ✅ Provide loading states
3. ✅ Allow users to go back
4. ✅ Save campaign codes in URL
5. ✅ Auto-login after successful auth
6. ✅ Show profile setup immediately

### Performance
1. ✅ Cache user data after login
2. ✅ Pre-load balances async
3. ✅ Optimize database queries
4. ✅ Use proper indexing
5. ✅ Implement session management

## Testing

### Email Flow Test
```javascript
1. Send verification code: POST /auth/email-login
2. Verify code: POST /auth/verify-email-code
3. Check user created or logged in
4. Check balance data loaded
```

### Wallet Flow Test
```javascript
1. Get verification message: POST /auth/wallet-verification-message
2. Sign message in wallet
3. Wallet login: POST /auth/wallet-login
4. Check user created or logged in
5. Check balance data loaded
```

### Profile Setup Test
```javascript
1. Update profile: POST /auth/update-profile
2. Verify username uniqueness
3. Check profileSet flag updated
4. Verify user can proceed to game
```

## Migration Checklist

- [ ] Create new service files (WalletAuthService, ValidationService)
- [ ] Create new auth controller (authControllerNew.js)
- [ ] Create new auth modal component (AuthModalNew.jsx)
- [ ] Create new redux actions (authNew/index.js)
- [ ] Update API config with new endpoints
- [ ] Update routes in authRouter.js
- [ ] Update user model with profileSet field
- [ ] Replace old AuthModal with new one
- [ ] Update imports in header component
- [ ] Test email authentication flow
- [ ] Test wallet authentication flow
- [ ] Test Google authentication flow
- [ ] Test profile setup
- [ ] Test balance loading
- [ ] Deploy and monitor

## Rollback Plan

If issues occur:
1. Keep old auth components (AuthModal.jsx, authController.js)
2. Update imports to point to old versions
3. Set old routes as primary endpoints
4. New components available as fallback

## Support & Troubleshooting

### Common Issues

**Q: "MetaMask not installed"**
A: Ensure MetaMask extension is installed and enabled

**Q: "Verification code not received"**
A: Check email spam folder, verify email configuration

**Q: "Login successful but balance not loaded"**
A: Check if getMyBalances endpoint is working properly

**Q: "Profile setup stuck"**
A: Check username validation rules, ensure unique username

## Future Enhancements

- [ ] Add SMS 2FA
- [ ] Implement social login (Apple, GitHub)
- [ ] Add biometric authentication
- [ ] Implement session management
- [ ] Add account recovery flow
- [ ] Add email preferences management
- [ ] Implement notification preferences

---

**Last Updated:** February 20, 2026
**Version:** 1.0
**Status:** Production Ready
