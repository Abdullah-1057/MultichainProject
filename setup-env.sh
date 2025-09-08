#!/bin/bash

echo "🔧 Setting up Stripe environment variables..."

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Backing up to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Create .env.local with placeholder values
cat > .env.local << EOF
# Stripe Configuration
# Replace these with your actual Stripe test keys from https://dashboard.stripe.com/test/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Note: These are placeholder values. You need to replace them with your actual Stripe keys.
EOF

echo "✅ Created .env.local with placeholder values"
echo ""
echo "📝 Next steps:"
echo "1. Go to https://dashboard.stripe.com/test/apikeys"
echo "2. Copy your Publishable key and Secret key"
echo "3. Replace the placeholder values in .env.local"
echo "4. Restart your development server with: npm run dev"
echo ""
echo "🔍 The Apple Pay initialization error should be resolved once you add your actual Stripe keys."
