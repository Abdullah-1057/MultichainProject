# Stripe Environment Setup Guide

## The Issue
You're seeing "Failed to initialize Apple Pay" because the Stripe environment variables are not configured. Both Apple Pay and Stripe payments depend on Stripe's API.

## Quick Fix

1. **Create a `.env.local` file** in your project root:
   ```bash
   touch .env.local
   ```

2. **Add the following content** to `.env.local`:
   ```bash
   # Stripe Configuration
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef
   STRIPE_SECRET_KEY=sk_test_51234567890abcdef
   STRIPE_WEBHOOK_SECRET=whsec_test_1234567890abcdef
   ```

3. **Get your actual Stripe keys**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Copy your **Secret key** (starts with `sk_test_`)
   - Replace the placeholder values in `.env.local`

4. **Restart your development server**:
   ```bash
   npm run dev
   ```

## What I Fixed

✅ **Apple Pay Component**: Added proper error handling for missing Stripe configuration
✅ **Stripe Payment Component**: Added proper error handling for missing Stripe configuration  
✅ **Better Error Messages**: Both components now show clear instructions when Stripe is not configured
✅ **Graceful Degradation**: Components won't crash when environment variables are missing

## Testing

After setting up the environment variables:

1. Select "Apple Pay" from the payment method dropdown
2. Enter an amount (e.g., 100)
3. You should see the Apple Pay button (if on Safari/iOS) or a clear error message

## Production Notes

- For production, use live keys (starting with `pk_live_` and `sk_live_`)
- Never commit `.env.local` to version control
- Set up webhooks for production payment processing

## Troubleshooting

If you still see errors:
1. Check that `.env.local` is in the project root (same level as `package.json`)
2. Verify the keys are correct (no extra spaces or quotes)
3. Restart the development server after making changes
4. Check the browser console for detailed error messages
