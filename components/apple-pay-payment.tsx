'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Apple, CheckCircle, XCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  useStripe,
  useElements,
  PaymentRequestButtonElement,
} from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface ApplePayPaymentProps {
  amount: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  disabled?: boolean;
}

interface ApplePayFormProps {
  amount: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  disabled?: boolean;
}

const ApplePayForm: React.FC<ApplePayFormProps> = ({
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
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (!stripe || !elements || disabled) {
      return;
    }

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Token Purchase',
        amount: Math.round(amount * 100), // Convert to cents
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Check if Apple Pay is available with better error handling
    pr.canMakePayment().then((result) => {
      console.log('Apple Pay availability check:', result);
      if (result && result.applePay) {
        setCanMakePayment(true);
        setPaymentRequest(pr);
      } else {
        console.log('Apple Pay not available. Result:', result);
        // Check for specific reasons why Apple Pay might not be available
        const userAgent = navigator.userAgent;
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
        const isMac = /Mac/.test(userAgent);
        const isIOS = /iPhone|iPad|iPod/.test(userAgent);
        
        console.log('Browser detection:', { userAgent, isSafari, isMac, isIOS });
      }
    }).catch((error) => {
      console.error('Error checking Apple Pay availability:', error);
    });

    // Handle payment method
    pr.on('paymentmethod', async (ev) => {
      setIsProcessing(true);
      setPaymentStatus('processing');
      setErrorMessage('');

      try {
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
              source: 'apple-pay-token-purchase',
              timestamp: new Date().toISOString(),
            },
          }),
        });

        const { clientSecret, error: apiError } = await response.json();

        if (apiError) {
          throw new Error(apiError);
        }

        // Confirm payment with Apple Pay
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (error) {
          ev.complete('fail');
          throw new Error(error.message);
        }

        if (paymentIntent?.status === 'succeeded') {
          ev.complete('success');
          setPaymentStatus('success');
          onPaymentSuccess(paymentIntent.id);
        } else {
          ev.complete('fail');
          throw new Error('Payment was not successful');
        }
      } catch (error: any) {
        ev.complete('fail');
        setPaymentStatus('error');
        setErrorMessage(error.message || 'Payment failed');
        onPaymentError(error.message || 'Payment failed');
      } finally {
        setIsProcessing(false);
      }
    });
  }, [stripe, elements, amount, onPaymentSuccess, onPaymentError, disabled]);

  if (!canMakePayment) {
    // Detect the current environment for better error messages
    const userAgent = navigator.userAgent;
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isMac = /Mac/.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);

    return (
      <Card className="bg-slate-800/70 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Apple className="h-8 w-8 text-slate-400 mx-auto" />
            <div>
              <p className="text-slate-400 font-medium">Apple Pay is not available</p>
              <p className="text-xs text-slate-500 mt-1">
                Current browser: {isSafari ? 'Safari' : isChrome ? 'Chrome' : isFirefox ? 'Firefox' : 'Other'} on {isMac ? 'macOS' : isIOS ? 'iOS' : 'Unknown OS'}
              </p>
            </div>
            
            <div className="text-left text-xs text-slate-500 space-y-2">
              <p className="font-medium text-slate-400">Requirements for Apple Pay:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Use Safari browser (not Chrome, Firefox, or Edge)</li>
                <li>macOS 10.12+ with Apple Pay set up in Wallet app</li>
                <li>Valid payment method added to Apple Wallet</li>
                <li>HTTPS connection (required for Apple Pay)</li>
              </ul>
              
              <div className="mt-3 p-3 bg-slate-700/50 rounded-lg">
                <p className="font-medium text-slate-300 mb-2">For Mac users:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open Safari (not Chrome/Firefox)</li>
                  <li>Go to System Preferences → Wallet & Apple Pay</li>
                  <li>Add a credit/debit card</li>
                  <li>Refresh this page in Safari</li>
                </ol>
              </div>
              
              <div className="mt-2 text-center">
                <p className="text-slate-400">Alternative: Use Stripe Credit Card payment instead</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/70 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Apple className="h-5 w-5" />
          Apple Pay
        </CardTitle>
        <CardDescription className="text-slate-400">
          Pay securely with Apple Pay using Touch ID, Face ID, or your passcode
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {paymentRequest && (
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-slate-300 text-sm mb-3">
                Pay ${amount.toFixed(2)} with Apple Pay
              </p>
              <PaymentRequestButtonElement
                options={{
                  paymentRequest,
                  style: {
                    paymentRequestButton: {
                      theme: 'dark',
                      height: '48px',
                    },
                  },
                }}
              />
            </div>
            
            {isProcessing && (
              <div className="flex items-center justify-center space-x-2 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing payment...</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ApplePayPayment: React.FC<ApplePayPaymentProps> = ({
  amount,
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
}) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [stripeError, setStripeError] = useState<string>('');

  useEffect(() => {
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
              source: 'apple-pay-token-purchase',
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
        const errorMessage = error.message || 'Failed to initialize Apple Pay';
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
            <p className="text-red-300 font-medium">Apple Pay Initialization Failed</p>
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
            <span className="ml-2 text-slate-400">Initializing Apple Pay...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
      <ApplePayForm
        amount={amount}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
        disabled={disabled}
      />
    </Elements>
  );
};

export default ApplePayPayment;