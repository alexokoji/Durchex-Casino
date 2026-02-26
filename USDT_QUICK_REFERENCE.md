# USDT Integration - Quick Reference

## 🎯 What Changed
Your casino now accepts **USDT (TRC20) ONLY** for crypto deposits.

## ⚡ Key Changes

### Backend
| File | Changes |
|------|---------|
| `.env` | Added `BASE_URL`, `USDT_*` config |
| `blockonomicsController.js` | **Complete rewrite** - USDT-only functions |
| `cryptoPaymentController.js` | Re-exports blockonomics functions |
| `paymentRouterV2.js` | Added `/usdt/*` routes, mapped `/crypto/*` to USDT |

### Frontend
| File | Changes |
|------|---------|
| `CryptoDepositModal.jsx` | Complete redesign - USDT-only UI with QR codes |

## 📡 Blockonomics Integration

### API Flow
1. **Generate Address**: `POST /api/v0/payments/usdt/generate-address`
   - Returns: Address + QR code

2. **User Sends USDT**: Send to address on TRC20 network

3. **Blockonomics Monitors**: Detects transaction

4. **Webhook Callback**: `POST /webhook/blockonomics`
   - Triggered after 6 confirmations

5. **System Processes**: Credits user wallet

### Endpoints (New)
```
POST   /api/v0/payments/usdt/generate-address     - Create deposit address
GET    /api/v0/payments/usdt/status/:paymentId    - Check payment status
POST   /api/v0/payments/usdt/simulate-deposit     - Demo deposit
GET    /api/v0/payments/usdt/transactions/:userId - Transaction history
POST   /webhook/blockonomics                       - Blockonomics callback
```

## 🔧 Configuration

Required in `.env`:
```env
BLOCKONOMICS_API_KEY=your_key_here
BLOCKONOMICS_API_URL=https://www.blockonomics.co/api
BASE_URL=https://yourdomain.com
BLOCKONOMICS_ENVIRONMENT=testnet  # or mainnet
```

## 🎬 Demo Mode

Frontend modal includes demo testing:
1. Generate address
2. Enter USDT amount
3. Click "Simulate Deposit"
4. Instant confirmation (no blockchain wait)

## 💡 Important

⚠️ **TRC20 ONLY** - Users must send USDT on TRON network
⚠️ **Minimum 1 USDT** per transaction
⚠️ **6 confirmations required** - ~5-15 minutes typical
⚠️ **24-hour address expiry** - Auto-expire if unused

## 📊 Database
All crypto deposits stored in `CryptoPaymentV2Model` with:
- `coinType: "USDT"` (always)
- `chain: "TRC20"` (always)
- `status: "pending|processing|confirmed|expired"`
- User balance credited on confirmation

## 🧪 Quick Test

```bash
# Generate demo address
curl -X POST http://localhost:5000/api/v0/payments/usdt/generate-address \
  -H "Content-Type: application/json" \
  -d '{"userId": "test123", "isDemo": true}'

# Simulate deposit
curl -X POST http://localhost:5000/api/v0/payments/usdt/simulate-deposit \
  -H "Content-Type: application/json" \
  -d '{"userId": "test123", "address": "DEMO_...", "amount": 50}'
```

## ✅ Deployment

1. Set `BLOCKONOMICS_API_KEY` in production
2. Configure webhook URL in Blockonomics dashboard
3. Set `BASE_URL` to production domain
4. Switch `BLOCKONOMICS_ENVIRONMENT` to `mainnet`
5. Test with small amount first

## 🔗 Resources

- Blockonomics: https://www.blockonomics.co/
- Full Guide: See `USDT_INTEGRATION_GUIDE.md`
- Migration Notes: See `BLOCKONOMICS_MIGRATION_COMPLETE.md`

---
**Status**: ✅ Ready for Testing
**Version**: 1.0
**Date**: Feb 24, 2025
