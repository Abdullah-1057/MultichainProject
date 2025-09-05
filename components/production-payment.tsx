'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, Clock, Wallet, Send, Loader2, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';
import { SimpleAddressRotator } from '@/lib/address-generator';

// Production configuration
const ADMIN_ADDRESS = '0xDF3A93fa50eb88806879eC568017a39300eB13F7';
const ROTATION_INTERVAL_MINUTES = 5; // Change every 5 minutes

interface ProductionPaymentProps {
  onPaymentComplete?: (txHash: string) => void;
}

export default function ProductionPayment({ onPaymentComplete }: ProductionPaymentProps) {
  const [userAccount, setUserAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [nextAddress, setNextAddress] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('0.001');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [addressInfo, setAddressInfo] = useState<{
    address: string;
    expiresAt: Date;
    timeLeft: number;
  } | null>(null);

  // Initialize address rotator
  const [rotator] = useState(() => new SimpleAddressRotator(ADMIN_ADDRESS, ROTATION_INTERVAL_MINUTES));

  // Update address and timer
  const updateAddress = () => {
    const info = rotator.getCurrentAddress();
    setAddressInfo(info);
    setCurrentAddress(info.address);
    setTimeLeft(info.timeLeft);
    setNextAddress(rotator.getNextAddress());
  };

  // Connect wallet
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setUserAccount(accounts[0]);
        setIsConnected(true);
        setError('');
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setError('Failed to connect wallet. Please try again.');
      }
    } else {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
    }
  };

  // Send payment
  const sendPayment = async () => {
    if (!userAccount || !currentAddress) return;

    try {
      setIsLoading(true);
      setError('');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Validate payment amount
      const amount = ethers.parseEther(paymentAmount);
      if (amount <= 0) {
        throw new Error('Invalid payment amount');
      }

      // Get user's balance
      const balance = await provider.getBalance(userAccount);
      if (balance < amount) {
        throw new Error(`Insufficient balance. You need at least ${paymentAmount} ETH.`);
      }

      // Estimate gas
      const gasEstimate = await provider.estimateGas({
        to: currentAddress,
        value: amount
      });
      const gasLimit = gasEstimate * 120n / 100n; // Add 20% buffer

      // Send transaction
      const tx = await signer.sendTransaction({
        to: currentAddress,
        value: amount,
        gasLimit: gasLimit
      });

      console.log('Payment sent, tx hash:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      setError('');
      onPaymentComplete?.(tx.hash);

    } catch (error: any) {
      console.error('Payment failed:', error);
      setError(`Payment failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!currentAddress) return;
    try {
      await navigator.clipboard.writeText(currentAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  // Format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update timer every second
  useEffect(() => {
    updateAddress();
    
    const interval = setInterval(() => {
      updateAddress();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-slate-800/70 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="h-5 w-5" /> Production Payment System
        </CardTitle>
        <CardDescription className="text-slate-400">
          Send ETH to rotating addresses that forward to admin. Address changes every {ROTATION_INTERVAL_MINUTES} minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isConnected ? (
          <div className="text-center space-y-4">
            <Wallet className="h-16 w-16 text-gray-400 mx-auto" />
            <Button
              onClick={connectWallet}
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Connect MetaMask
            </Button>
            <p className="text-sm text-slate-400">
              Connect your wallet to make a payment
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connected Status */}
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Wallet Connected</span>
            </div>

            {/* User Account */}
            <div className="bg-slate-700/60 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Your Account</p>
              <p className="font-mono text-sm text-slate-200">
                {userAccount.slice(0, 6)}...{userAccount.slice(-4)}
              </p>
            </div>

            {/* Current Deposit Address */}
            {currentAddress && (
              <div className="space-y-4">
                <div className="bg-slate-700/60 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-400">Current Payment Address</p>
                    <Badge className="bg-blue-500 text-white">
                      Changes every {ROTATION_INTERVAL_MINUTES}min
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono text-sm text-slate-200 flex-1 break-all">
                      {currentAddress}
                    </p>
                    <Button
                      onClick={copyAddress}
                      size="sm"
                      variant="outline"
                      className="border-slate-500 text-slate-200"
                    >
                      {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Time Left */}
                <div className="bg-blue-500/10 rounded-lg p-4 text-center border border-blue-500/20">
                  <div className="flex items-center justify-center space-x-2 text-blue-400 mb-2">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">Time Left</span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-blue-300">
                    {formatTime(timeLeft)}
                  </div>
                  <p className="text-sm text-blue-400 mt-1">
                    Address will change automatically
                  </p>
                </div>

                {/* Next Address Preview */}
                <div className="bg-slate-700/60 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-2">Next Address (Preview)</p>
                  <p className="font-mono text-xs text-slate-300 break-all">
                    {nextAddress}
                  </p>
                </div>

                {/* Payment Amount Input */}
                <div className="bg-slate-700/60 rounded-lg p-4">
                  <Label className="text-sm text-slate-400 mb-2">Payment Amount (ETH)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="bg-slate-600 border-slate-500 text-white placeholder-slate-400"
                    placeholder="0.001"
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <Alert className="border-red-500/40 bg-red-500/10">
                    <AlertDescription className="text-red-300">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Send Payment Button */}
                <Button
                  onClick={sendPayment}
                  disabled={isLoading || !paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Send {paymentAmount} ETH Payment</span>
                    </>
                  )}
                </Button>

                {/* Admin Address Info */}
                <div className="bg-slate-700/60 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-1">Admin Address (Receives Funds)</p>
                  <p className="font-mono text-sm text-slate-200">
                    {ADMIN_ADDRESS}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    All payments are forwarded to this address
                  </p>
                </div>
              </div>
            )}

            {/* Refresh Button */}
            <Button
              onClick={updateAddress}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Refresh Address</span>
            </Button>
          </div>
        )}

        {/* Production Info */}
        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
          <div className="flex items-center space-x-2 text-green-400 mb-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Production Ready</span>
          </div>
          <div className="text-sm text-green-300 space-y-1">
            <p>• No smart contracts needed</p>
            <p>• Addresses rotate every {ROTATION_INTERVAL_MINUTES} minutes</p>
            <p>• All funds forwarded to admin: {ADMIN_ADDRESS.slice(0, 6)}...{ADMIN_ADDRESS.slice(-4)}</p>
            <p>• Deterministic address generation</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
