# Complete Stripe Test Cards & Payment Methods Guide

## 🧪 Test Card Numbers

### ✅ Successful Payments

| Card Number | Brand | Description |
|-------------|-------|-------------|
| `4242 4242 4242 4242` | Visa | Basic Visa card |
| `4000 0566 5566 5556` | Visa (debit) | Visa debit card |
| `5555 5555 5555 4444` | Mastercard | Basic Mastercard |
| `2223 0031 2200 3222` | Mastercard (2-series) | Mastercard 2-series |
| `3782 822463 10005` | American Express | Amex card |
| `3714 496353 98431` | American Express | Amex card |
| `6011 1111 1111 1117` | Discover | Discover card |
| `3056 9309 0259 04` | Diners Club | Diners Club card |
| `3622 720627 0671` | JCB | JCB card |

### ❌ Declined Payments

| Card Number | Brand | Error Type |
|-------------|-------|------------|
| `4000 0000 0000 0002` | Visa | Generic decline |
| `4000 0000 0000 9995` | Visa | Insufficient funds |
| `4000 0000 0000 9987` | Visa | Lost card |
| `4000 0000 0000 9979` | Visa | Stolen card |
| `4000 0000 0000 0069` | Visa | Expired card |
| `4000 0000 0000 0127` | Visa | Incorrect CVC |
| `4000 0000 0000 0119` | Visa | Processing error |

### 🔐 Authentication Required (3D Secure)

| Card Number | Brand | Description |
|-------------|-------|-------------|
| `4000 0025 0000 3155` | Visa | Requires authentication |
| `4000 0027 6000 3184` | Visa | Requires authentication |
| `4000 0000 0000 3220` | Visa | Requires authentication |
| `5555 5555 5555 4444` | Mastercard | May require authentication |

## 💳 Payment Methods Available

### 1. Credit/Debit Cards
- **Visa** (including Visa Debit)
- **Mastercard** (including Maestro)
- **American Express**
- **Discover**
- **Diners Club**
- **JCB**
- **UnionPay**

### 2. Digital Wallets
- **Apple Pay** (iOS/macOS Safari)
- **Google Pay** (Chrome/Android)
- **Microsoft Pay** (Edge/Windows)
- **Samsung Pay** (Samsung devices)

### 3. Bank Transfers
- **ACH Direct Debit** (US)
- **SEPA Direct Debit** (Europe)
- **Bacs Direct Debit** (UK)

### 4. Buy Now, Pay Later
- **Klarna**
- **Afterpay**
- **Affirm**

## 🧪 Testing Scenarios

### Basic Payment Flow
1. **Card**: `4242 4242 4242 4242`
2. **Expiry**: Any future date (e.g., `12/25`)
3. **CVC**: Any 3 digits (e.g., `123`)
4. **Expected**: ✅ Payment successful

### International Cards
1. **UK Card**: `4000 0566 5566 5556`
2. **German Card**: `4000 0566 5566 5556`
3. **French Card**: `4000 0566 5566 5556`

### Different Card Types
1. **Debit Card**: `4000 0566 5566 5556`
2. **Credit Card**: `4242 4242 4242 4242`
3. **Corporate Card**: `4000 0566 5566 5556`

## 🔐 3D Secure Testing

### Test Authentication
1. **Card**: `4000 0025 0000 3155`
2. **Process**: 
   - Enter card details
   - Click "Pay"
   - You'll see a 3D Secure popup
   - Use test authentication (any password works)
   - Payment completes

### Authentication Failure
1. **Card**: `4000 0025 0000 3155`
2. **Process**: 
   - Enter card details
   - Click "Pay"
   - In 3D Secure popup, enter wrong password
   - Payment fails

## 🌍 Currency Testing

### Different Currencies
- **USD**: Default (no changes needed)
- **EUR**: Change currency in payment intent
- **GBP**: Change currency in payment intent
- **CAD**: Change currency in payment intent

## 📱 Mobile Testing

### iOS Safari
1. **Apple Pay**: Should show Apple Pay button
2. **Card Input**: Should work with touch keyboard
3. **3D Secure**: Should work in popup

### Android Chrome
1. **Google Pay**: Should show Google Pay button
2. **Card Input**: Should work with mobile keyboard
3. **3D Secure**: Should work in popup

## 🚨 Error Testing

### Test These Error Scenarios
1. **Invalid Card**: `1234 5678 9012 3456`
2. **Expired Card**: `4000 0000 0000 0069`
3. **Wrong CVC**: `4242 4242 4242 4242` with CVC `999`
4. **Insufficient Funds**: `4000 0000 0000 9995`
5. **Lost Card**: `4000 0000 0000 9987`

## 🎯 Quick Test Checklist

### ✅ Basic Functionality
- [ ] Visa card works
- [ ] Mastercard works
- [ ] Amex works
- [ ] Error handling works
- [ ] Success message shows

### ✅ Advanced Features
- [ ] 3D Secure works
- [ ] Apple Pay shows (iOS)
- [ ] Google Pay shows (Android)
- [ ] Mobile responsive
- [ ] Error messages clear

### ✅ Edge Cases
- [ ] Invalid card numbers
- [ ] Expired cards
- [ ] Wrong CVC
- [ ] Network errors
- [ ] Empty forms

## 🔧 Testing Tips

1. **Use Test Mode**: Make sure you're using test keys (`pk_test_` and `sk_test_`)
2. **Clear Browser Cache**: Sometimes old data can interfere
3. **Check Console**: Look for any JavaScript errors
4. **Test Different Browsers**: Chrome, Firefox, Safari, Edge
5. **Test Mobile**: Use browser dev tools mobile view

## 📊 Expected Results

### Successful Payment
- ✅ Green success message
- ✅ Payment intent ID displayed
- ✅ Transaction recorded in backend
- ✅ No console errors

### Failed Payment
- ❌ Red error message
- ❌ Specific error reason shown
- ❌ Form remains filled
- ❌ User can retry

## 🎉 Ready to Test!

You now have all the test cards and scenarios needed to thoroughly test your Stripe integration. Start with the basic successful payment (`4242 4242 4242 4242`) and then work through the different scenarios to ensure everything works perfectly!