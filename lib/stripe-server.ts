import Stripe from 'stripe';

// Validate and get Stripe configuration
function getStripeConfig() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    // In development, provide a helpful error message
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ STRIPE_SECRET_KEY is not set in environment variables');
      console.error('Please add STRIPE_SECRET_KEY to your .env.local file');
    }
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }

  return {
    secretKey: stripeSecretKey,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  };
}

// Create Stripe instance with proper error handling
export function createStripeInstance(): Stripe {
  try {
    const config = getStripeConfig();
    
    return new Stripe(config.secretKey, {
      apiVersion: '2025-08-27.basil',
    });
  } catch (error) {
    // Log the error for debugging
    console.error('Failed to initialize Stripe:', error);
    throw error;
  }
}

// Export configuration for other uses
export function getStripeConfigSafe() {
  try {
    return getStripeConfig();
  } catch {
    return null;
  }
}

// Check if Stripe is properly configured
export function isStripeConfigured(): boolean {
  return getStripeConfigSafe() !== null;
}
