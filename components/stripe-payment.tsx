'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface StripePaymentProps {
  amount: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  disabled?: boolean;
}

interface PaymentFormProps {
  amount: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  disabled?: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || disabled) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      // First, submit the elements to validate the form
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'usd',
          metadata: {
            source: 'multichain-token-purchase',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const { clientSecret, error: apiError } = await response.json();

      if (apiError) {
        throw new Error(apiError);
      }

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        setPaymentStatus('success');
        onPaymentSuccess(paymentIntent.id);
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (error: any) {
      setPaymentStatus('error');
      setErrorMessage(error.message || 'Payment failed');
      onPaymentError(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-slate-300">Payment Details</Label>
        <div className="p-4 bg-slate-700/60 rounded-lg border border-slate-600">
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
          />
        </div>
      </div>

      {paymentStatus === 'success' && (
        <Alert className="border-green-500/40 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-300">
            Payment successful! Your tokens will be minted shortly.
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === 'error' && errorMessage && (
        <Alert className="border-red-500/40 bg-red-500/10">
          <XCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing || disabled}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay ${amount.toFixed(2)} with Stripe
          </>
        )}
      </Button>
    </form>
  );
};

const StripePayment: React.FC<StripePaymentProps> = ({
  amount,
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
}) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [stripeError, setStripeError] = useState<string>('');

  React.useEffect(() => {
    // Check if Stripe is properly configured
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setStripeError('Stripe is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable.');
      onPaymentError('Stripe configuration missing');
      return;
    }

    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            currency: 'usd',
            metadata: {
              source: 'multichain-token-purchase',
              timestamp: new Date().toISOString(),
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { clientSecret: secret, error: apiError } = await response.json();
        
        if (apiError) {
          throw new Error(apiError);
        }

        if (!secret) {
          throw new Error('No client secret returned from API');
        }

        setClientSecret(secret);
      } catch (error: any) {
        console.error('Error creating payment intent:', error);
        const errorMessage = error.message || 'Failed to initialize payment';
        setStripeError(errorMessage);
        onPaymentError(errorMessage);
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount, onPaymentError]);

  // Show error if Stripe is not configured
  if (stripeError) {
    return (
      <Card className="bg-slate-800/70 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <XCircle className="h-8 w-8 text-red-400 mx-auto" />
            <p className="text-red-300 font-medium">Stripe Payment Initialization Failed</p>
            <p className="text-slate-400 text-sm">{stripeError}</p>
            <div className="text-xs text-slate-500 mt-2">
              <p>To fix this issue:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Create a .env.local file in your project root</li>
                <li>Add: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here</li>
                <li>Add: STRIPE_SECRET_KEY=sk_test_your_key_here</li>
                <li>Restart the development server</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card className="bg-slate-800/70 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-400">Initializing payment...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/70 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Stripe Payment
        </CardTitle>
        <CardDescription className="text-slate-400">
          Pay with your credit card, debit card, or other payment methods
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'night',
              variables: {
                colorPrimary: '#4f46e5',
                colorBackground: '#1e293b',
                colorText: '#f1f5f9',
                colorDanger: '#ef4444',
                fontFamily: 'system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '8px',
              },
            },
          }}
        >
          <PaymentForm
            amount={amount}
            onPaymentSuccess={onPaymentSuccess}
            onPaymentError={onPaymentError}
            disabled={disabled}
          />
        </Elements>
      </CardContent>
    </Card>
  );
};

export default StripePayment;