# 🚀 Quick Test Reference

## ⚡ Fast Testing Cards

### ✅ Quick Success Tests
```
Visa: 4242 4242 4242 4242
Mastercard: 5555 5555 5555 4444
Amex: 3782 822463 10005
Discover: 6011 1111 1111 1117
```

### ❌ Quick Error Tests
```
Generic Decline: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
Expired Card: 4000 0000 0000 0069
Wrong CVC: 4242 4242 4242 4242 (use CVC: 999)
```

### 🔐 3D Secure Test
```
Card: 4000 0025 0000 3155
Process: Enter card → Click Pay → 3D Secure popup → Any password → Success
```

## 📱 Payment Methods to Test

### 1. Credit Cards
- **Visa**: `4242 4242 4242 4242`
- **Mastercard**: `5555 5555 5555 4444`
- **Amex**: `3782 822463 10005`

### 2. Digital Wallets
- **Apple Pay**: iOS/macOS Safari (automatic detection)
- **Google Pay**: Chrome/Android (automatic detection)

### 3. Different Card Types
- **Debit**: `4000 0566 5566 5556`
- **Credit**: `4242 4242 4242 4242`
- **Corporate**: `4000 0566 5566 5556`

## 🎯 Test Flow

1. **Select Payment Method**: Credit Card or Apple Pay
2. **Enter Amount**: Any amount (e.g., 10)
3. **Enter Card Details**: Use test cards above
4. **Click Pay**: Watch for success/error messages
5. **Check Backend**: Verify transaction is recorded

## 🔧 Common Test Scenarios

### Scenario 1: Basic Success
- Card: `4242 4242 4242 4242`
- Expiry: `12/25`
- CVC: `123`
- Expected: ✅ Success

### Scenario 2: 3D Secure
- Card: `4000 0025 0000 3155`
- Expiry: `12/25`
- CVC: `123`
- Expected: 🔐 3D Secure popup → Success

### Scenario 3: Error Handling
- Card: `4000 0000 0000 0002`
- Expiry: `12/25`
- CVC: `123`
- Expected: ❌ Decline error

### Scenario 4: Apple Pay
- Device: iOS/macOS Safari
- Method: Apple Pay
- Expected: 🍎 Apple Pay button → Success

## 🚨 Troubleshooting

### If Cards Don't Work
1. Check API keys are test keys (`pk_test_`, `sk_test_`)
2. Clear browser cache
3. Check console for errors
4. Verify amount is > 0

### If Apple Pay Doesn't Show
1. Use Safari on iOS/macOS
2. Check Apple Pay is set up
3. Verify cards in Apple Wallet
4. Check device compatibility

### If 3D Secure Fails
1. Use correct test card
2. Wait for popup to load
3. Use any password in popup
4. Check popup isn't blocked

## 🎉 Happy Testing!

Start with the basic success card (`4242 4242 4242 4242`) and work your way through the different scenarios. All test cards are safe to use and won't charge real money!