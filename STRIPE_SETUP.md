# Stripe Setup Guide

## Quick Fix for Build Errors

The build is failing because Stripe environment variables are not configured. Here's how to fix it:

### 1. Create Environment File

Create a `.env.local` file in your project root with the following content:

```bash
# Stripe Configuration (REQUIRED)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Optional Stripe Configuration
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2. Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. Paste them into your `.env.local` file

### 3. For Production Deployment

Set these environment variables in your hosting platform:

- **Vercel**: Add in Project Settings > Environment Variables
- **Netlify**: Add in Site Settings > Environment Variables
- **Railway**: Add in Project Settings > Variables
- **Heroku**: Use `heroku config:set` command

### 4. Test Configuration

Run the environment check script:

```bash
node scripts/check-env.js
```

### 5. Restart Development Server

```bash
npm run dev
```

## Environment Variables Reference

### Required for Stripe
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key

### Optional
- `STRIPE_WEBHOOK_SECRET` - For webhook verification
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - For JWT token signing

## Troubleshooting

### Build Error: "Neither apiKey nor config.authenticator provided"
- **Cause**: `STRIPE_SECRET_KEY` is not set
- **Fix**: Add `STRIPE_SECRET_KEY` to your environment variables

### Build Error: "Failed to collect page data"
- **Cause**: Stripe initialization fails during build
- **Fix**: Ensure all required environment variables are set

### Runtime Error: "Stripe is not properly configured"
- **Cause**: Environment variables are missing at runtime
- **Fix**: Check that your hosting platform has the environment variables set

## Security Notes

- Never commit `.env.local` to version control
- Use test keys (`sk_test_`, `pk_test_`) for development
- Use live keys (`sk_live_`, `pk_live_`) only in production
- Keep your secret keys secure and never expose them in client-side code
