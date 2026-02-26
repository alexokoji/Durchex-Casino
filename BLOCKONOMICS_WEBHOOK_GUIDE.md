# Blockonomics Webhook Integration

## 📡 Overview
Blockonomics sends HTTP POST callbacks to your server when a USDT transaction is detected and confirmed on the TRC20 network.

## 🔗 Webhook Endpoint
```
POST https://yourdomain.com/api/v0/payments/webhook/blockonomics
```

## 📨 Webhook Payload Format

### When Transaction Arrives
```json
{
  "crypto": "USDT",
  "status": 0,
  "address": "0x1234...abcd",
  "txid": "0xabc...def",
  "confirmations": 0,
  "value": 50000000
}
```

### After First Confirmation
```json
{
  "crypto": "USDT",
  "status": 1,
  "address": "0x1234...abcd",
  "txid": "0xabc...def",
  "confirmations": 1,
  "value": 50000000
}
```

### After 6 Confirmations (CONFIRMED)
```json
{
  "crypto": "USDT",
  "status": 2,
  "address": "0x1234...abcd",
  "txid": "0xabc...def",
  "confirmations": 6,
  "value": 50000000
}
```

## 📝 Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `crypto` | String | Currency code: "USDT" |
| `status` | Integer | 0=unconfirmed, 1=confirmed, 2=safe (6+ confirmations) |
| `address` | String | USDT wallet address that received payment |
| `txid` | String | Transaction hash on blockchain |
| `confirmations` | Integer | Current confirmation count |
| `value` | Integer | Amount in smallest units (satoshi-equivalent for USDT) |

## 🎯 Processing Logic

```javascript
// Webhook handler pseudocode
POST /webhook/blockonomics (req, body) => {
  const { crypto, status, address, txid, confirmations, value } = req.body;
  
  // 1. Verify it's USDT
  if (crypto !== 'USDT') return 200;  // Ignore non-USDT
  
  // 2. Find payment by address
  const payment = DB.find({ depositAddress: address });
  if (!payment) return 200;  // Unknown address
  
  // 3. Update transaction info
  payment.transactionHash = txid;
  payment.confirmations = confirmations;
  payment.amount = value / 1e6;  // Convert from smallest units
  
  // 4. Check if confirmed (status >= 2 or confirmations >= 6)
  if (confirmations >= 6) {
    payment.status = 'confirmed';
    
    // 5. Credit user balance
    const user = DB.getUser(payment.userId);
    user.walletBalances.USDT += payment.amount;
    DB.save(user);
    
    // 6. Send notification (optional)
    sendEmailNotification(user, payment.amount);
  } else {
    payment.status = 'processing';  // Still waiting for more confirmations
  }
  
  // 7. Always return 200 to acknowledge
  return 200;
}
```

## 🧪 Testing Webhooks

### Option 1: Blockonomics Dashboard
1. Go to Blockonomics → Settings → Webhooks
2. Click "Test Delivery"
3. Server should receive test webhook

### Option 2: Manual cURL Test
```bash
curl -X POST http://localhost:5000/api/v0/payments/webhook/blockonomics \
  -H "Content-Type: application/json" \
  -d '{
    "crypto": "USDT",
    "status": 0,
    "address": "0xTRC20_ADDRESS_HERE",
    "txid": "0x1234567890abcdefg",
    "confirmations": 0,
    "value": 50000000
  }'
```

### Option 3: Progressive Confirmation Test
Simulate multiple confirmations:

```bash
# Transaction arrives (0 confirmations)
curl -X POST http://localhost:5000/api/v0/payments/webhook/blockonomics \
  -H "Content-Type: application/json" \
  -d '{"crypto":"USDT","status":0,"address":"0x...","txid":"0x...","confirmations":0,"value":50000000}'

# Wait a moment, then 3 confirmations
curl -X POST http://localhost:5000/api/v0/payments/webhook/blockonomics \
  -H "Content-Type: application/json" \
  -d '{"crypto":"USDT","status":1,"address":"0x...","txid":"0x...","confirmations":3,"value":50000000}'

# Finally 6+ confirmations (CONFIRMED)
curl -X POST http://localhost:5000/api/v0/payments/webhook/blockonomics \
  -H "Content-Type: application/json" \
  -d '{"crypto":"USDT","status":2,"address":"0x...","txid":"0x...","confirmations":6,"value":50000000}'
```

## 🔐 Security Considerations

1. **Validate Source**: Blockonomics should only send from known IPs
   - Add IP whitelist in your firewall if possible
   - Blockonomics IPs: Check their documentation

2. **Idempotency**: Handle duplicate webhooks gracefully
   - Your code checks if payment already processed
   - Returns success even if already confirmed

3. **Rate Limiting**: Implement rate limits
   - Prevent webhook spam/DDoS
   - E.g., Max 100 webhooks per minute

4. **Logging**: Log all webhooks for debugging
   ```javascript
  console.log(`📦 Blockonomics webhook: ${txid}, ${confirmations} confirmations`);
   ```

## 🚨 Webhook Errors

### Common Issues

**Webhook not received**
- Check webhook URL is publicly accessible
- Verify `BASE_URL` in `.env` is correct
- Check firewall allows port 443 (HTTPS)
- Verify URL in Blockonomics dashboard is exact

**Payment not crediting**
- Check address in payment matches webhook address
- Verify user exists in database
- Check wallet balance field is being updated
- Monitor logs for error messages

**Duplicate processing**
- Ensure payment status is updated
- Check for duplicate transaction hashes
- Implement payment idempotency key

## 📊 Monitoring

Add these logs to track webhook processing:

```javascript
console.log(`📦 Blockonomics webhook received`, {
  crypto,
  txid,
  address,
  confirmations,
  value
});

console.log(`⏳ Payment processing: ${confirmations}/${REQUIRED_CONFIRMATIONS}`);

console.log(`✅ Payment confirmed, crediting user ${userId}`);

console.error(`❌ Webhook error: ${error.message}`);
```

## 🔄 Integration Points

### User Model Update
```javascript
// When webhook confirms payment (status >= 2)
user.walletBalances.USDT += (value / 1e6);
user.demoBalance.data.find(b => b.currency === 'USDT').balance += (value / 1e6);
```

### Email Notification (Optional)
```javascript
// Send confirmation email
sendEmail(user.email, {
  subject: `USDT Deposit Confirmed - ${amount} USDT`,
  body: `Your deposit of ${amount} USDT has been confirmed. 
         New balance: ${user.walletBalances.USDT} USDT`
});
```

### Analytics Tracking (Optional)
```javascript
// Track deposit in analytics
analytics.track('usdt_deposit_confirmed', {
  userId: payment.userId,
  amount: (value / 1e6),
  txid: txid,
  timestamp: new Date()
});
```

## 📝 Example Webhook Log

```
[2025-02-24 14:32:15] 📦 Blockonomics webhook received: {
  crypto: 'USDT',
  status: 0,
  address: '0x1234...abcd',
  txid: '0xabc...def',
  confirmations: 0,
  value: 50000000
}

[2025-02-24 14:32:15] 📋 Found payment: paymentId_123, userId_456

[2025-02-24 14:37:45] 📦 Blockonomics webhook received: {
  crypto: 'USDT',
  status: 2,
  address: '0x1234...abcd',
  txid: '0xabc...def',
  confirmations: 6,
  value: 50000000
}

[2025-02-24 14:37:45] ✅ Payment confirmed after 5 minutes 30 seconds

[2025-02-24 14:37:46] 💰 User_456 credited with 50 USDT
  New balance: 150 USDT

[2025-02-24 14:37:46] 📧 Confirmation email sent to user@example.com
```

## ✅ Webhook Checklist

- [ ] Webhook URL configured in Blockonomics dashboard
- [ ] Server is publicly accessible (HTTPS)
- [ ] BASE_URL environment variable is set correctly
- [ ] Firewall allows incoming webhooks
- [ ] Webhook handler validates crypto === 'USDT'
- [ ] Payment record lookup works correctly
- [ ] Confirmation logic (confirmations >= 6) implemented
- [ ] User balance update logic working
- [ ] Error handling for missing payments
- [ ] Logging/monitoring in place
- [ ] Test webhook delivery from Blockonomics
- [ ] Test with manual cURL commands
- [ ] Production testing with small USDT amount

## 🔗 Resources

- Blockonomics Docs: https://www.blockonomics.co/api
- TRC20 Standard: https://github.com/tronprotocol/TIPs/blob/master/tip-20.md
- USDT on Tron: https://tether.to/

---
**Last Updated**: February 24, 2025
**Status**: ✅ Complete
