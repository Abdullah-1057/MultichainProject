'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, Clock, Wallet, Send, Loader2 } from 'lucide-react';
// import QRCode from 'qrcode.react';
import { ethers } from 'ethers';

// Contract addresses - UPDATE THESE AFTER DEPLOYMENT
const FACTORY_ADDRESS = '0x0000000000000000000000000000000000000000'; // Update after deployment
const ADMIN_ADDRESS = '0x23f8F22bC0ED154a9eA7cB581c6E15eD93Be9708'; // Your admin address

// Factory contract ABI
const FACTORY_ABI = [
  "function predictAddress(bytes32 salt) external view returns (address)",
  "function createForwarder(bytes32 salt) external returns (address)",
  "function getForwarder(bytes32 salt) external view returns (address)"
];

interface HourlyPaymentProps {
  onPaymentComplete?: (txHash: string) => void;
}

export default function HourlyPayment({ onPaymentComplete }: HourlyPaymentProps) {
  const [userAccount, setUserAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentDepositAddress, setCurrentDepositAddress] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [hourBucket, setHourBucket] = useState('');
  const [factoryContract, setFactoryContract] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('0.001');
  const [copied, setCopied] = useState(false);

  // Initialize contract
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined' && FACTORY_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      setFactoryContract(contract);
    }
  }, []);

  // Generate deterministic deposit address for current hour
  const generateHourlyDepositAddress = async (hourBucket: string) => {
    if (!factoryContract) {
      console.warn('Factory contract not deployed, using admin address');
      return ADMIN_ADDRESS;
    }

    try {
      setIsLoading(true);
      setError('');

      // Create salt from hour bucket
      const salt = ethers.keccak256(ethers.toUtf8Bytes(`hour_${hourBucket}`));

      // Check if forwarder exists
      let forwarderAddress = await factoryContract.getForwarder(salt);

      if (forwarderAddress === '0x0000000000000000000000000000000000000000') {
        // Create new forwarder for this hour
        const signer = await new ethers.BrowserProvider(window.ethereum).getSigner();
        const factoryWithSigner = factoryContract.connect(signer);

        // Estimate gas for contract creation
        const gasEstimate = await factoryWithSigner.createForwarder.estimateGas(salt);
        const gasLimit = gasEstimate * 120n / 100n; // Add 20% buffer

        const tx = await factoryWithSigner.createForwarder(salt, {
          gasLimit: gasLimit
        });

        console.log('Creating forwarder, tx hash:', tx.hash);
        const receipt = await tx.wait();

        if (!receipt || receipt.status !== 1) {
          throw new Error('Transaction failed');
        }

        forwarderAddress = await factoryContract.getForwarder(salt);
        console.log('Forwarder created at:', forwarderAddress);
      }

      return forwarderAddress;
    } catch (error: any) {
      console.error('Error generating address:', error);
      setError(`Failed to generate address: ${error.message}`);
      // Fallback to admin address
      return ADMIN_ADDRESS;
    } finally {
      setIsLoading(false);
    }
  };

  // Get current hour bucket
  const getCurrentHourBucket = () => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hour = String(now.getUTCHours()).padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:00:00Z`;
  };

  // Calculate time left in current hour
  const calculateTimeLeft = () => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);

    return Math.max(0, Math.floor((nextHour.getTime() - now.getTime()) / 1000));
  };

  // Connect user wallet
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setUserAccount(accounts[0]);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setError('Failed to connect wallet. Please try again.');
      }
    } else {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
    }
  };

  // Generate new deposit address for current hour
  const generateDepositAddress = async () => {
    const currentHour = getCurrentHourBucket();
    const depositAddress = await generateHourlyDepositAddress(currentHour);

    setCurrentDepositAddress(depositAddress);
    setHourBucket(currentHour);
  };

  // Send payment from user to admin
  const sendPayment = async () => {
    if (!userAccount || !currentDepositAddress) return;

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

      // Estimate gas for transaction
      const gasEstimate = await provider.estimateGas({
        to: currentDepositAddress,
        value: amount
      });
      const gasLimit = gasEstimate * 120n / 100n; // Add 20% buffer

      // Send transaction
      const tx = await signer.sendTransaction({
        to: currentDepositAddress,
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
    if (!currentDepositAddress) return;
    try {
      await navigator.clipboard.writeText(currentDepositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  // Update time left every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Generate deposit address on load
  useEffect(() => {
    generateDepositAddress();
  }, []);

  // Regenerate deposit address every hour
  useEffect(() => {
    const interval = setInterval(() => {
      generateDepositAddress();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Generate address when user connects
  useEffect(() => {
    if (isConnected) {
      generateDepositAddress();
    }
  }, [isConnected]);

  // Generate address when contract is ready
  useEffect(() => {
    if (factoryContract) {
      generateDepositAddress();
    }
  }, [factoryContract]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-slate-800/70 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="h-5 w-5" /> Hourly Rotating Payment
        </CardTitle>
        <CardDescription className="text-slate-400">
          Send ETH to a rotating address that changes every hour. Funds are automatically forwarded to admin.
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
            {currentDepositAddress && (
              <div className="space-y-4">
                <div className="bg-slate-700/60 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-2">Payment Address (Changes Every Hour)</p>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono text-sm text-slate-200 flex-1 break-all">
                      {currentDepositAddress}
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

                {/* QR Code - Temporarily disabled */}
                <div className="text-center">
                  <div className="bg-slate-600 p-8 rounded-lg inline-block">
                    <p className="text-slate-300 text-sm">QR Code temporarily disabled</p>
                    <p className="text-slate-400 text-xs mt-1">Copy address above to send payment</p>
                  </div>
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

                {/* Time Left */}
                <div className="bg-blue-500/10 rounded-lg p-4 text-center border border-blue-500/20">
                  <div className="flex items-center justify-center space-x-2 text-blue-400 mb-2">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">Time Left in Current Hour</span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-blue-300">
                    {formatTime(timeLeft)}
                  </div>
                  <p className="text-sm text-blue-400 mt-1">
                    New address will be generated automatically
                  </p>
                </div>

                {/* Hour Bucket */}
                <div className="bg-slate-700/60 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-1">Current Hour Bucket</p>
                  <p className="font-mono text-sm text-slate-200">
                    {hourBucket}
                  </p>
                </div>
              </div>
            )}

            {/* Refresh Address Button */}
            <Button
              onClick={generateDepositAddress}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Refresh Address
            </Button>
          </div>
        )}

        {/* Contract Warning */}
        {FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000' && (
          <Alert className="border-yellow-500/40 bg-yellow-500/10">
            <AlertDescription className="text-yellow-300">
              ⚠️ Contract Not Deployed - Update FACTORY_ADDRESS in components/hourly-payment.tsx after deploying contracts
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
