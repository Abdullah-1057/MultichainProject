# Stripe Integration Guide

This guide explains how to set up and use the Stripe payment integration in the MultiChain Token Purchase application.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Stripe API keys (publishable and secret keys)

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Getting Stripe API Keys

1. Log in to your Stripe Dashboard
2. Go to Developers > API Keys
3. Copy your Publishable key and Secret key
4. For testing, use the test keys (they start with `pk_test_` and `sk_test_`)
5. For production, use the live keys (they start with `pk_live_` and `sk_live_`)

## Features

### Stripe Payment Component
- **Location**: `components/stripe-payment.tsx`
- **Features**:
  - Secure card input using Stripe Elements
  - Support for multiple payment methods (Visa, Mastercard, Amex, etc.)
  - Real-time payment processing
  - Error handling and success feedback
  - Dark theme integration

### API Routes
- **Create Payment Intent**: `app/api/stripe/create-payment-intent/route.ts`
  - Creates a payment intent with the specified amount
  - Returns client secret for frontend confirmation
- **Confirm Payment**: `app/api/stripe/confirm-payment/route.ts`
  - Verifies payment completion
  - Returns payment status

### Integration with Buy Tokens
- Stripe is integrated as a payment option in the main buy-tokens component
- Users can select "Credit Card" as their payment method
- No wallet connection required for Stripe payments
- Payment success automatically creates a transaction record

## Usage

1. **Select Payment Method**: Choose "Credit Card" from the wallet/chain dropdown
2. **Enter Amount**: Specify the number of tokens to purchase
3. **Payment Details**: Enter card information in the secure Stripe form
4. **Process Payment**: Click "Pay with Stripe" to complete the transaction
5. **Confirmation**: Payment success creates a transaction record in the backend

## Security Features

- **PCI Compliance**: Card details never touch your servers
- **Secure Elements**: Uses Stripe's secure input components
- **Tokenization**: Card details are tokenized by Stripe
- **3D Secure**: Automatic support for 3D Secure authentication

## Testing

### Test Cards
Use these test card numbers for testing:

- **Successful Payment**: 4242 4242 4242 4242
- **Declined Payment**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

Use any future expiry date and any 3-digit CVC.

### Test Mode
- All test payments use Stripe's test mode
- No real money is charged
- Test payments appear in your Stripe Dashboard test data

## Production Deployment

1. **Switch to Live Keys**: Update environment variables with live keys
2. **Webhook Setup**: Configure webhooks for production events
3. **Domain Verification**: Add your production domain to Stripe
4. **SSL Certificate**: Ensure HTTPS is enabled

## Troubleshooting

### Common Issues

1. **"No publishable key" error**: Check that `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
2. **Payment fails**: Verify `STRIPE_SECRET_KEY` is correct
3. **CORS errors**: Ensure API routes are properly configured
4. **Card declined**: Use valid test card numbers

### Debug Mode
Enable Stripe debug mode by adding `?debug=true` to your URL to see detailed error messages.

## Next Steps

After Stripe integration, the next step is to implement Apple Pay integration for a complete payment solution.