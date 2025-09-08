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

    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      return NextResponse.json({
        success: true,
        paymentIntent,
        message: 'Payment confirmed successfully',
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: `Payment not completed. Status: ${paymentIntent.status}` 
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}