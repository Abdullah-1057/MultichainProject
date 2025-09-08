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

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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

    // Check if Apple Pay is available
    pr.canMakePayment().then((result) => {
      if (result && result.applePay) {
        setCanMakePayment(true);
        setPaymentRequest(pr);
      }
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
    return (
      <Card className="bg-slate-800/70 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <Apple className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-slate-400">Apple Pay is not available on this device</p>
            <p className="text-xs text-slate-500">
              Make sure you're using Safari on iOS/macOS with Apple Pay set up
            </p>
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

  useEffect(() => {
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

        const { clientSecret: secret } = await response.json();
        setClientSecret(secret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        onPaymentError('Failed to initialize Apple Pay');
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount, onPaymentError]);

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