import { NextRequest, NextResponse } from 'next/server';
import { createStripeInstance, isStripeConfigured } from '@/lib/stripe-server';

// Initialize Stripe with proper error handling
let stripe: any = null;
try {
  stripe = createStripeInstance();
} catch (error) {
  console.error('Stripe initialization failed:', error);
}

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is properly configured
    if (!stripe || !isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not properly configured. Please check environment variables.' },
        { status: 500 }
      );
    }

    const { amount, currency = 'usd', metadata = {} } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Convert amount to cents (Stripe expects amounts in cents)
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      // Only allow card payments
      payment_method_types: ['card'],
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}