# Quick Code Implementation Reference

## Copy-Paste Ready Code Changes

This guide contains exact code changes needed for quick implementation.

---

## 1. Update Backend Routes

**File:** `backend/routes/authRouter.js`

**Current Code:**
```javascript
const routerx = require('express-promise-router');
const authController = require('../controllers/authController');
// ... rest of file
```

**Change To:**
```javascript
const routerx = require('express-promise-router');
const authController = require('../controllers/authControllerNew');
// ... rest of file
```

---

## 2. Update API Configuration

**File:** `frontend/src/config/apiConfig.js`

**Add These Methods:**
```javascript
// Add to GamblingService class
emailLogin = (...args) => axios.post(ApiConfig.request.emailLogin, ...args);

verifyEmailCode = (...args) => axios.post(ApiConfig.request.verifyEmailCode, ...args);

walletLogin = (...args) => axios.post(ApiConfig.request.walletLogin, ...args);

getWalletVerificationMessage = (...args) => axios.post(ApiConfig.request.walletVerificationMessage, ...args);

updateProfileSet = (...args) => axios.post(ApiConfig.request.updateProfileSet, ...args);

logout = (...args) => axios.post(ApiConfig.request.logout, ...args);
```

**Add These Endpoints:**
```javascript
const ApiConfig = {
    token: 'userToken',
    request: {
        // ... existing endpoints
        
        // NEW ENDPOINTS
        emailLogin: '/auth/email-login',
        verifyEmailCode: '/auth/verify-email-code',
        walletLogin: '/auth/wallet-login',
        walletVerificationMessage: '/auth/wallet-verification-message',
        updateProfileSet: '/auth/update-profile',
        logout: '/auth/logout',
    }
};
```

---

## 3. Update Header Component

**File:** `frontend/src/layout/MainLayout/header.jsx`

**Find This Line:**
```javascript
import AuthModal from 'views/main/modals/AuthModal';
```

**Replace With:**
```javascript
import AuthModal from 'views/main/modals/AuthModalNew';
```

---

## 4. Update Redux Imports

**Search All Files For:**
```javascript
import { userGoogleLogin, metamaskLogin } from 'redux/actions/auth';
```

**Replace With:**
```javascript
import { userGoogleLogin, walletLogin, emailLogin, verifyEmailCode, updateProfileSet, getMyBalances } from 'redux/actions/authNew';
```

---

## 5. Update User Model (Optional but Recommended)

**File:** `backend/models/UserModel.js`

**Find This Section:**
```javascript
const ModelSchema = mongoose.Schema({
    userName: { type: String },
    userAvatar: { type: String, default: 'avatar1.png' },
    userLevel: { type: Number, default: '0' },
    userEmail: { type: String },
    userPassword: { type: String },
    userToken: { type: String },
    loginType: { type: String, enum: ['Google', 'Wallet', 'Email', 'Apple'], default: 'Email' },
    userNickName: { type: String, required: [true, 'Please input userNickName'] },
    type: { type: String, enum: ['user', 'admin'], default: 'user' },
    // ... more fields
```

**Add This Field After userToken:**
```javascript
    profileSet: { type: Boolean, default: false },
```

**Full Section Should Look Like:**
```javascript
const ModelSchema = mongoose.Schema({
    userName: { type: String },
    userAvatar: { type: String, default: 'avatar1.png' },
    userLevel: { type: Number, default: '0' },
    userEmail: { type: String },
    userPassword: { type: String },
    userToken: { type: String },
    profileSet: { type: Boolean, default: false },  // NEW LINE
    loginType: { type: String, enum: ['Google', 'Wallet', 'Email', 'Apple'], default: 'Email' },
    userNickName: { type: String, required: [true, 'Please input userNickName'] },
    type: { type: String, enum: ['user', 'admin'], default: 'user' },
    // ... more fields
```

---

## 6. Quick Testing Commands

### Test Email Login
```bash
# Send verification code
curl -X POST http://localhost:7000/auth/email-login \
  -H "Content-Type: application/json" \
  -d '{"emailAddress":"test@example.com"}'

# Verify code (use code from email)
curl -X POST http://localhost:7000/auth/verify-email-code \
  -H "Content-Type: application/json" \
  -d '{"emailAddress":"test@example.com","code":"123456","campaignData":{"exist":false,"code":""}}'
```

### Test Wallet Login
```bash
curl -X POST http://localhost:7000/auth/wallet-login \
  -H "Content-Type: application/json" \
  -d '{
    "address":"0x123456789abcdef",
    "signature":"0x...",
    "campaignData":{"exist":false,"code":""}
  }'
```

### Test Google Login
```bash
curl -X POST http://localhost:7000/auth/google-login \
  -H "Content-Type: application/json" \
  -d '{"accessToken":"YOUR_TOKEN","campaignData":{"exist":false,"code":""}}'
```

### Test Profile Update
```bash
curl -X POST http://localhost:7000/auth/update-profile \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","userNickName":"coolname123"}'
```

---

## 7. Environment Variables (Optional)

**File:** `backend/.env`

No new environment variables needed. The system uses:
```
DB=mongodb://...
SERVER_PORT=7000
JWT.secret=your_secret
JWT.expireIn=30d
```

---

## 8. Database Migration (Optional)

If you want to add the profileSet field to existing users:

**MongoDB Query:**
```javascript
db.users.updateMany(
    { profileSet: { $exists: false } },
    { $set: { profileSet: false } }
);
```

Or via Mongoose in Node:
```javascript
await User.updateMany(
    { profileSet: { $exists: false } },
    { $set: { profileSet: false } }
);
```

---

## 9. Troubleshooting Common Issues

### Issue: "AuthModal not found"
**Solution:** Verify file path: `frontend/src/views/main/modals/AuthModalNew.jsx`

### Issue: "API endpoint 404"
**Solution:** 
1. Verify route in `backend/routes/authRouter.js`
2. Verify controller import uses `authControllerNew`
3. Restart backend server

### Issue: "Email code not received"
**Solution:**
1. Check email configuration in `.env`
2. Check spam/junk folder
3. Verify SMTP credentials

### Issue: "Wallet connection fails"
**Solution:**
1. Ensure MetaMask is installed
2. Refresh page
3. Check browser console for errors
4. Verify correct network selected

### Issue: "User profile not updating"
**Solution:**
1. Verify userId is correct
2. Verify username format (3-20 chars)
3. Check if username already taken
4. Check MongoDB connection

---

## 10. Rollback Instructions

If you need to revert:

### Revert Routes
```javascript
// Change back to
const authController = require('../controllers/authController');
```

### Revert Header
```javascript
// Change back to
import AuthModal from 'views/main/modals/AuthModal';
```

### Revert Redux Imports
```javascript
// Change back to
import { userGoogleLogin, metamaskLogin } from 'redux/actions/auth';
```

### Restart Services
```bash
# Backend
npm start  # or restart your backend process

# Frontend
npm start  # or restart dev server
```

---

## 11. Performance Optimization Tips

### Reduce Bundle Size
```javascript
// Use tree-shaking for unused services
import { ValidationService } from 'services/ValidationService';
// Not: import ValidationService from 'services'
```

### Optimize Re-renders
```javascript
// In AuthModalNew.jsx, already optimized with:
// - Controlled components
// - useContext for shared state
// - Minimal re-renders
```

### Cache API Responses
```javascript
// Add to Redux store
const cachedToken = localStorage.getItem('userToken');
if (cachedToken) {
    // Validate and use cached token
}
```

---

## 12. Security Checklist

- [ ] All inputs validated on frontend AND backend
- [ ] No sensitive data logged to console in production
- [ ] JWT tokens have expiration
- [ ] HTTPS enforced in production
- [ ] CORS properly configured
- [ ] Rate limiting on auth endpoints (implement middleware)
- [ ] Email codes expire after 10 minutes
- [ ] Passwords never stored in plain text
- [ ] No hardcoded secrets in code
- [ ] Database queries use parameterized statements (Mongoose does this)

---

## 13. Deployment Checklist

### Pre-Deployment
- [ ] Run local tests
- [ ] Check for console errors
- [ ] Verify all imports
- [ ] Test on multiple browsers
- [ ] Test on mobile
- [ ] Performance testing

### Stage 1: Backend
- [ ] Deploy authControllerNew.js
- [ ] Update routes
- [ ] Verify endpoints work
- [ ] Check logs

### Stage 2: Frontend
- [ ] Deploy new services
- [ ] Deploy AuthModalNew.jsx
- [ ] Deploy redux actions
- [ ] Update header component
- [ ] Clear cache if needed

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check user feedback
- [ ] Monitor performance
- [ ] Keep rollback ready
- [ ] Document any issues

---

## 14. Support Matrix

| Component | Owner | Status | Support |
|-----------|-------|--------|---------|
| WalletAuthService.js | Frontend | Complete | Frontend Team |
| ValidationService.js | Frontend | Complete | Frontend Team |
| AuthModalNew.jsx | Frontend | Complete | Frontend Team |
| authNew/index.js | Frontend | Complete | Frontend Team |
| authControllerNew.js | Backend | Complete | Backend Team |
| Implementation | Both | Ready | Both Teams |

---

## 15. Version Control Tips

### Before Implementation
```bash
# Create feature branch
git checkout -b feature/auth-revamp

# Keep original files
git mv controllers/authController.js controllers/authController.js.old
```

### After Testing
```bash
# Commit changes
git add .
git commit -m "refactor: revamp authentication system

- Added WalletAuthService for wallet connections
- Added ValidationService for input validation
- Created new AuthModalNew component
- Updated backend controller
- Improved error handling and UX"
```

### During Rollback
```bash
# Revert specific commit
git revert <commit-hash>

# Or switch branch
git checkout old-auth-system
```

---

## 16. Progress Tracking

Use these checkmarks as you implement:

```
BACKEND (30 mins)
- [ ] Copy authControllerNew.js
- [ ] Update routes
- [ ] Test endpoints
- [ ] Verify error responses

FRONTEND - Services (10 mins)
- [ ] Copy WalletAuthService.js
- [ ] Copy ValidationService.js
- [ ] Verify imports work

FRONTEND - Component (20 mins)
- [ ] Copy AuthModalNew.jsx
- [ ] Update header component
- [ ] Test rendering

FRONTEND - Redux (10 mins)
- [ ] Copy authNew actions
- [ ] Update imports in header
- [ ] Test action calls

FRONTEND - Config (10 mins)
- [ ] Update apiConfig.js
- [ ] Add endpoints
- [ ] Test API calls

TESTING (45 mins)
- [ ] Email flow
- [ ] Wallet flow
- [ ] Google flow
- [ ] Profile setup
- [ ] Balance loading
- [ ] Mobile responsive

DEPLOYMENT (30 mins)
- [ ] Staging test
- [ ] Production deploy
- [ ] Monitor logs
- [ ] User verification

TOTAL: ~155 minutes = ~2.5 hours
```

---

**Last Updated:** February 20, 2026
**Version:** 1.0
**Status:** Ready for Copy-Paste Implementation
