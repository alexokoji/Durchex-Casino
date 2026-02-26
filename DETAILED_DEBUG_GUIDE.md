# 🔍 DETAILED DEBUGGING GUIDE - Modal & Header Issues

## What's Happening

You've added enhanced logging throughout the auth flow. This guide will help you understand the expected console output and identify where the flow breaks.

## Expected Console Output Flow

### Step 1: Click "Connect with MetaMask"
```
🔄 Attempting to connect wallet...
✅ Wallet connected, waiting for login effect to handle login...
```

### Step 2: Approve in MetaMask Wallet
```
✅ Wallet connected: 0x1234...
Active: true Account: 0x1234...
⏳ Showing loader - starting wallet login
```

### Step 3: Wallet Login API Call Initiates
```
🔐 Logging in with wallet account... {address: '0x1234...', type: 'eth', campaignData: {...}}
📡 Wallet login response: {data: {...}, status: 200}
Response.data status: true
```

### Step 4: Response Received & Logged
```
✅ Login successful - Response data: {status: true, userData: {...}, setting: {...}}
📦 Full response.data.userData: {_id: '...', userName: '0x1234...', profileSet: false, ...}
🔍 userData.profileSet value: false Type: boolean
```

**CRITICAL INSPECTION POINT:**
- ✅ Should show `userData.profileSet: false` (or true for existing users)
- ✅ Should show `Type: boolean`
- ❌ If shows `undefined` or `Type: undefined` → Backend not returning profileSet!

### Step 5: Redux Dispatch
```
📤 Dispatching SET_AUTH...
🔐 Setting token: eyJ0eXAiO...
📤 Dispatching SET_USERDATA with: {_id: '...', ...}
📊 Profile logic: hasProfile= false , newProfileStatus= 1 (PROFILE_STATUS.SET= 2 , UNSET= 1 )
🎯 About to call setProfileSet(1)
```

**CRITICAL LOGIC CHECK:**
- NEW user: `hasProfile=false` → `newProfileStatus=1` (UNSET) → Will show profile form
- EXISTING user: `hasProfile=true` → `newProfileStatus=2` (SET) → Will close modal

### Step 6: setProfileSet State Update
```
👁️ profileSet effect triggered - current value: 1 PROFILE_STATUS.SET: 2 Match: false
⏳ Profile not set yet - profileSet: 1 (expected 2 for close)
```
For new users this is CORRECT - shows profile form.

OR (for existing users):
```
👁️ profileSet effect triggered - current value: 2 PROFILE_STATUS.SET: 2 Match: true
🎉✅ Profile setup complete (profileSet === 2) - Closing modal now
🔴 Calling setOpen(false)
```

### Step 7: Modal Close Propagates to Header
```
👀 open effect triggered - open: false
👋 Modal closed - Resetting local states
```

### Step 8: Header Redux Monitoring
```
👀 Header watching authData changes: {isAuth: true, hasUserData: true, balanceDataCount: 8, userData_id: '...'}
📱 Full authData object: {isAuth: true, userData: {...}, balanceData: {...}}
🔧 authModalOpen changed to: false
```

---

## Troubleshooting by Symptom

### Symptom 1: userProfileSet Shows as `undefined`
```
🔍 userData.profileSet value: undefined Type: undefined
```

**Problem:** Backend is not returning the `profileSet` field!

**Solution:**
1. Check backend response:
```bash
# In backend terminal, look for successful login
# Should see something like:
[console output showing userId is saved with profileSet]
```

2. Verify backend code returns profileSet in response:
```javascript
// In backend/controllers/authController.js metamaskLogin function
// Should have: profileSet: false  in saveData for new users
// Should return: userData.profileSet in response
```

3. Restart backend:
```bash
cd backend
npm start
```

### Symptom 2: Modal Doesn't Close (profileSet: 2 but modal stays open)
```
🎉✅ Profile setup complete (profileSet === 2) - Closing modal now
🔴 Calling setOpen(false)
👪 open effect triggered - open: true  ← SHOULD BE false!
```

**Problem:** `setOpen(false)` not working. The parent component isn't responding.

**Solution:**
1. Check if header is actually receiving the updated state:
```
🔧 authModalOpen changed to: false
```
If this appears, then the problem is rendering, not state update.

2. Check Modal component:
- Is the `open` prop being used to control visibility?
- Material-UI Modal should respond to `open={false}` automatically

3. Add manual close in setTimeout:
```javascript
// In AuthModal wallet login effect finally block, add:
setTimeout(() => {
    console.log('🔔 Manual close attempt - setOpen(false)');
    setOpen(false);
}, 100);
```

### Symptom 3: Header Shows "Login" Button Instead of Auth Buttons
```
👀 Header watching authData changes: {isAuth: false, hasUserData: false, ...}
```

**Problem:** Redux SET_AUTH not working properly.

**Solution:**
1. Verify Redux dispatch is happening:
```
📤 Dispatching SET_AUTH...  ← Should appear
```

2. Check Redux state in browser DevTools:
- Open browser DevTools (F12)
- Install Redux DevTools extension (if not installed)
- Check if `isAuth` is true after login

3. Verify Redux reducer:
```bash
# Check: frontend/src/redux/reducers/auth/index.js
# Should have case 'SET_AUTH': return { ...state, isAuth: true }
```

### Symptom 4: Loader Never Hides (Spinning Forever)
```
⏳ Showing loader - starting wallet login
[no logs after this]
```

**Problem:** Async operation hanging or error occurring.

**Solution:**
1. Look for error logs:
```
❌ Metamask login error: [error message]
```

2. Check Network tab in DevTools:
- Open DevTools → Network tab
- Click Connect Wallet
- Look for API request
- Check if it returns status 200
- Check response body has userData with profileSet

3. Check backend logs:
```bash
# Terminal running backend
# Should show successful login
# Should not show errors
```

---

## Step-by-Step Testing Procedure

### For Existing User (With Previous Login)
1. Clear browser:
```javascript
// In console:
localStorage.clear()
location.reload()
```

2. Log in again:
   - Click Connect Wallet
   - Watch for: `hasProfile= true` and `newProfileStatus= 2`
   - Watch for: `👁️ profileSet effect triggered - current value: 2`
   - Expected: Modal closes immediately

3. Check header:
   - Should show: Chat, Balance, Profile, etc. buttons
   - Should NOT show: Login button

### For New User (First Time Login)
1. Use NEW wallet address (one you haven't used before)
   - In MetaMask, create new account or switch to account never used on site
   
2. Log in:
   - Click Connect Wallet
   - Watch for: `hasProfile= false` and `newProfileStatus= 1`
   - Expected: Modal stays open, shows username input

3. Enter username:
   - Type in username
   - Click "Start Game"
   - Watch for: `⏳ Showing loader - starting wallet login`
   - Wait for complete logs
   - Expected: Modal closes

---

## Reading Console Output Like a Pro

### Key Log Sections to Check

**1. Response Structure Check:**
```javascript
📦 Full response.data.userData: 
{
  _id: '507f1f77bcf86cd799439011',
  userName: '0xAbCd1234...',
  profileSet: false,              ← 🔍 CHECK THIS
  userToken: 'eyJ0eXAiOiJKV...',
  ...
}
```

**2. Profile Logic Check:**
```
📊 Profile logic: hasProfile= false , newProfileStatus= 1
   ↑ This tells you if profileSet was detected from response
```

**3. Modal Close Trigger Check:**
```
🎉✅ Profile setup complete (profileSet === 2) - Closing modal now
🔴 Calling setOpen(false)
```
If you see both, state IS being set to close the modal.

**4. Header Update Check:**
```
👀 Header watching authData changes: {isAuth: true, ...}
```
If isAuth is true here, Redux is working.

---

## Common Issues Checklist

### Backend Response
- [ ] API returns status: true
- [ ] userData includes profileSet field
- [ ] profileSet is boolean (true/false), not string
- [ ] New users have profileSet: false
- [ ] Existing users have profileSet: true

### Frontend State Management
- [ ] Redux dispatch SET_AUTH appears in logs
- [ ] Redux dispatch SET_USERDATA appears in logs
- [ ] profileSet local state changes logged
- [ ] setOpen(false) is called

### Modal Closure
- [ ] profileSet effect fires with correct value
- [ ] setOpen(false) call logged
- [ ] Header receives modal close (open=false effect fires)
- [ ] Header re-renders showing authModalOpen: false

### Header Update
- [ ] Header receives authData with isAuth=true
- [ ] Header re-renders (effect logs show isAuth: true)
- [ ] Conditional rendering shows auth buttons not login button

---

## Quick Debug Checklist

Before testing, run through this:

```bash
# 1. Clear both terminals
Ctrl+C  # stop backend
Ctrl+C  # stop frontend

# 2. Start fresh
cd backend && npm start
# Wait for "Server running on port: 5000"

# In new terminal:
cd frontend && npm start
# Wait for "Compiled successfully"

# 3. Clear browser state
# In browser console:
localStorage.clear()
```

Then follow the flow and watch console logs carefully!

---

**Last Updated:** February 20, 2026
**Status:** Ready for testing with enhanced logging
