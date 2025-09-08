# Payment Integration Test Guide

## ✅ Configuration Status

You have successfully added the required Stripe API keys:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ✅
- `STRIPE_SECRET_KEY` ✅

## 🧪 Testing Steps

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test Stripe Integration
1. Open your browser and go to `http://localhost:3000`
2. Navigate to the buy tokens page
3. Select "Credit Card" from the payment method dropdown
4. Enter an amount (e.g., 10)
5. You should see the Stripe payment form with card input fields

### 3. Test Apple Pay Integration
1. On the same page, select "Apple Pay" from the payment method dropdown
2. If you're on iOS/macOS with Safari and have Apple Pay set up, you should see the Apple Pay button
3. If not, you'll see a message that Apple Pay is not available

### 4. Test with Stripe Test Cards
Use these test card numbers:
- **Successful Payment**: `4242 4242 4242 4242`
- **Declined Payment**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

## 🔧 Additional Configuration (Optional)

### Webhook Secret (Optional for Testing)
The `STRIPE_WEBHOOK_SECRET` is only needed if you want to set up webhooks for production. For testing, you can leave it empty or add a placeholder:

```bash
STRIPE_WEBHOOK_SECRET=whsec_test_placeholder
```

### Environment File Location
Make sure your `.env.local` file is in the root directory of your project (same level as `package.json`).

## 🚨 Troubleshooting

### If Stripe Payment Form Doesn't Load
1. Check that `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is correctly set
2. Verify the key starts with `pk_test_` for test mode
3. Check browser console for any error messages

### If Apple Pay Button Doesn't Show
1. Make sure you're using Safari on iOS/macOS
2. Verify Apple Pay is set up on your device
3. Check that you have cards added to Apple Wallet

### If Payment Fails
1. Check that `STRIPE_SECRET_KEY` is correctly set
2. Verify the key starts with `sk_test_` for test mode
3. Check the server console for error messages

## ✅ Success Indicators

When everything is working correctly, you should see:
1. **Stripe**: Card input form with validation
2. **Apple Pay**: Apple Pay button (on supported devices)
3. **Payment Processing**: Loading states and success/error messages
4. **Backend Integration**: Transaction records created in your Motoko backend

## 🎉 You're Ready!

Your payment integration is now complete and ready for testing. The setup you have is sufficient for development and testing purposes.