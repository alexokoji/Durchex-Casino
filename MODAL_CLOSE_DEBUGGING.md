# 🆘 Modal Not Closing & Header Not Updating - Diagnostic Guide

## Problem Summary

- Modal stays open after wallet login
- Header doesn't show authenticated state
- Redux not updating properly

## Root Cause Analysis

### Issue 1: Response Inconsistency
**Fixed**: Changed `res.send()` to `res.json()` in authController.js for consistent response format

### Issue 2: Missing profileSet on New Users
**Fixed**: Added `profileSet: false` to newuser saveData in metamaskLogin

### Issue 3: Modal Close Logic Race Condition  
**Fixed**: Separated modal close trigger from state reset to avoid timing issues

## 🔍 Debugging Steps

### Step 1: Check Browser Console

Open browser DevTools → Console tab and look for these logs after clicking "Connect":

**✅ Expected Logs:**
```
✅ Wallet connected: 0x1234...5678
Active: true Account: 0x1234...5678
🔐 Logging in with wallet account... { address: '0x...', type: 'eth', campaignData: {...} }
📡 Wallet login response: {status: true, userData: {...}, setting: {...}}
Response.data status: true
✅ Login successful - Response data: {userData: {...}, setting: {...}}
📤 Dispatching SET_AUTH...
🔐 Setting token: eyJhbGciOi...
📤 Dispatching SET_USERDATA with: {_id: '...', userName: '...', profileSet: true/false, ...}
📋 Profile status will be set to: 2 or 1 (2=existing, 1=new)
📤 Dispatching INIT_SETTING...
📤 Dispatching SET_BALANCEDATA...
✅ Balances loaded

// For existing users:
🎉 Existing user - profileSet will trigger modal close
🎉 Profile setup complete - Closing modal now

// For new users:
⏳ New user - showing profile setup form
👀 Header watching authData changes: { isAuth: true, hasUserData: true, ... }
```

### Step 2: Check Network Tab

1. In DevTools → Network tab
2. Filter by XHR/Fetch
3. Look for request to `/api/auth/metamask-login`
4. Click on it and check:
   - Request: Should have `{ address: '0x...', type: 'eth', campaignData: {...} }`
   - Response: Should be JSON with `{ "status": true, "userData": {...}, "setting": {...} }`
   - Status: Should be **200 OK**

**❌ If response is not 200:**
- Check backend is running
- Check port is 5000 (or configured port)
- Check error in response body

### Step 3: Check Redux State

In Console, run:
```javascript
// Check Redux store (if Redux DevTools installed)
// Or install Redux logger to see all dispatch actions
localStorage.getItem('PlayZelo'); // Should have token
```

**✅ Expected tokens:**
```javascript
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTmFtZSI6IjB4..."
```

### Step 4: Manual State Check

After login, run in console:
```javascript
// If you have Redux installed
// Check using Redux DevTools Extension

// Or manually check by button click:
// Open Auth modal, login, then run:
console.log(document.querySelector('[data-testid="auth-modal"]')); // Should be null if closed
```

## 🔧 Common Issues & Fixes

### Issue: Modal still open
**Debug:**
```javascript
// Check if profileSet is updating
// In AuthModal component:
console.log('profileSet state:', profileSet); // Should be 2 after login
console.log('open prop:', open); // Should be false after profileSet effect
```

**Solutions:**
1. Check browser console for errors
2. Verify profileSet response from API
3. Clear browser cache and reload
4. Check Redux is installed properly

### Issue: Header shows "Login" button still
**Debug:**
```javascript
// Check if Redux auth state updated
// Look for these logs in console:
// "📤 Dispatching SET_AUTH..."
// "👀 Header watching authData changes:"
```

**Solutions:**
1. Verify `dispatch({ type: 'SET_AUTH' })` log appears
2. Check Redux reducer (frontend/src/redux/reducers/auth/index.js)
3. Verify token saved in localStorage
4. Check if header component re-renders

### Issue: "Failed to login with wallet"
**Causes & Fixes:**
- Backend not running → Start backend: `npm start` in `/backend`
- Wrong API URL → Check `frontend/src/config/baseConfig.js`
- Network error → Check browser Network tab
- Invalid address → Check console for exact error message

### Issue: API returns status: false
**Debug:**
```javascript
// Check response in Network tab
// Response should show error message
```

**Common errors:**
- "User not found" → Normal for new users, should continue
- "Invalid Request" → Missing address or type in  request
- "Server Error" → Check backend logs

### Issue: New user doesn't see profile setup form
**Debug:**
- Check if `profileSet: false` returned from backend
- Verify PROFILE_STATUS constant: `PROFILE_STATUS.UNSET === 1`
- Check if form markup exists in AuthModal render

**Solution:**
```jsx
// The modal should show this form:
{
    profileSet === PROFILE_STATUS.UNSET &&
    <>
        <Box className={classes.ModalInputBox}>
            <input value={userNickName} onChange={(e) => setUserNickName(e.target.value)} 
                   className={classes.EmailInput} type="text"></input>
        </Box>
        <Box className={classes.ModalInputBox}>
            <input disabled={campaignData.exist} value={promotionCode} 
                   placeholder="Promotion Code(optional)" 
                   onChange={(e) => setPromotionCode(e.target.value)} 
                   className={clsx(classes.EmailInput, classes.PromotionCode)} 
                   style={{ textAlign: 'left' }} type="text"></input>
        </Box>
        <Button className={clsx(classes.NextButton, classes.AuthButton)} 
                onClick={handleProfileSet}>
            <span>Start Game</span>
        </Button>
    </>
}
```

## 📋 Checklist for Testing

### Backend Verification
- [ ] Backend running: `npm start` in `/backend` folder
- [ ] Port 5000 is accessible
- [ ] Database connected (check for connection logs)
- [ ] No errors in backend console

### Frontend Verification
- [ ] Frontend running: `npm start` in `/frontend` folder
- [ ] Can see login page
- [ ] MetaMask extension installed and unlocked
- [ ] Redux DevTools installed (optional but helpful)

### Network Verification
- [ ] Can ping backend: http://localhost:5000/api/auth/metamask-login
- [ ] CORS configured (no CORS errors in console)
- [ ] API calls reaching backend (check backend logs)

### Response Verification
- [ ] `/metamask-login` returns `status: true`
- [ ] Response includes `userData` with all fields
- [ ] `userData.profileSet` is `true` or `false` (not missing)
- [ ] `userData.userToken` is present
- [ ] `setting` object is included

### Redux Verification
- [ ] `dispatch({ type: 'SET_AUTH' })` executes
- [ ] `dispatch({ type: 'SET_USERDATA', data: ... })` executes
- [ ] `dispatch({ type: 'SET_BALANCEDATA', data: ... })` executes
- [ ] Redux reducer updates `state.authentication.isAuth = true`

### UI Verification
- [ ] Modal closes after SET_AUTH dispatch
- [ ] Header buttons appear after auth
- [ ] Balance shows in dropdown
- [ ] Profile button visible
- [ ] Chat button visible

## 🚀 Full Test Procedure

### For Existing User (second login)
1. Open DevTools Console
2. Click "Connect with MetaMask"
3. Approve in MetaMask
4. **Watch for logs** - should see all debug logs
5. **Modal should close** within 1 second
6. **Header should update** - show balance and buttons
7. **Check console** - should see `profileSet will trigger modal close`

### For New User (first-time wallet)
1. Open DevTools Console
2. Use NEW wallet address (never logged in before)
3. Click "Connect with MetaMask"
4. Approve in MetaMask
5. **Modal should stay open** showing username input
6. **Console should show** "New user - showing profile setup form"
7. Enter username (e.g., "PlayerName123")
8. Click "Start Game"
9. **Modal should close**
10. **Header should show** authenticated state

## 📊 Expected Console Output

### Complete Login Sequence Logs
```javascript
// 1. Connection detection
✅ Wallet connected: 0xAbCdEf1234567890...
Active: true Account: 0xAbCdEf1234567890...

// 2. Login request
🔐 Logging in with wallet account...
{ address: '0xAbCdEf1234567890...', type: 'eth', campaignData: { exist: false, code: '' } }

// 3. API response received
📡 Wallet login response: {
  status: true,
  userData: {
    _id: '507f1f77bcf86cd799439011',
    userName: '0xAbCdEf1234567890...',
    userNickName: 'RandomName12345',
    profileSet: false,  ← This determines next step
    userToken: 'eyJhbGci...',
    ...
  },
  setting: { sound: true, ... }
}
Response.data status: true

// 4. Redux updates
✅ Login successful - Response data: {...}
📤 Dispatching SET_AUTH...
🔐 Setting token: eyJhbGci...
📤 Dispatching SET_USERDATA with: { _id: '...', ... , profileSet: false, ...}
📋 Profile status will be set to: 1 (UNSET = new user)
📤 Dispatching INIT_SETTING...
📤 Dispatching SET_BALANCEDATA...
✅ Balances loaded

// 5. User routing
⏳ New user - showing profile setup form

// 6. Profile setup (new users only)
📝 Submitting profile setup: { profileSet: true, userNickName: 'PlayerName123', ... }
✅ Profile setup successful
🎉 Profile setup complete - Closing modal now

// 7. Modal closes
👋 Modal closed - Resetting local states

// 8. Header updates
👀 Header watching authData changes: { isAuth: true, hasUserData: true, balanceDataCount: 8 }
```

## 🔗 Related Files to Check

- **Frontend**:
  - [AuthModal.jsx](frontend/src/views/main/modals/AuthModal.jsx) - Main auth component
  - [header.jsx](frontend/src/layout/MainLayout/header.jsx) - Header with auth buttons
  - [auth reducer](frontend/src/redux/reducers/auth/index.js) - Redux auth state
  - [apiConfig.js](frontend/src/config/apiConfig.js) - API configuration

- **Backend**:
  - [authController.js](backend/controllers/authController.js) - metamaskLogin endpoint
  - [UserModel.js](backend/models/UserModel.js) - profileSet field definition
  - [routes/authRouter.js](backend/routes/authRouter.js) - Route configuration

## 💡 Pro Tips

1. **Use Redux DevTools**: Install Redux DevTools Extension to see all actions dispatched
2. **Network Throttling**: Slow down network in DevTools to see loading states
3. **Clear LocalStorage**: `localStorage.clear()` then reload if stuck in auth state
4. **Backend Logs**: Check backend terminal for error messages
5. **Fresh Wallet**: Use wallet address that hasn't signed in before to test new user flow

## 📞 If Still Stuck

Collect this information:
1. Screenshot of console logs
2. Network tab request/response for `/metamask-login`
3. Redux state (use Redux DevTools)
4. Browser/OS version
5. Backend logs
6. Whether it's new user or existing user

Create issue with all above information.

---

**Last Updated**: February 20, 2026
**Status**: Ready for Production
