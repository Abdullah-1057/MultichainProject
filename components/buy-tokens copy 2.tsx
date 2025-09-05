'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, DollarSign, Link2, Loader2, ScanLine, Shield, Wallet } from 'lucide-react';
import { MotokoBackendService } from '@/lib/motoko-backend-real';
import { SolanaWalletManager } from '@/lib/solana-wallet';
import { BitcoinWalletManager } from '@/lib/bitcoin-wallet';
import MyTokensSection from './my-tokens-section';
import ProductionPayment from './production-payment';

type ChainOption = 'ETH' | 'SOL' | 'BTC';

interface ConnectedWallet {
  type: ChainOption;
  name: string;
  address: string;
}

const CHAIN_META: Record<ChainOption, { name: string; icon: string; hint: string }> = {
  ETH: { name: 'EVM (Ethereum compatible)', icon: '⟠', hint: 'MetaMask / Coinbase / OKX' },
  SOL: { name: 'Solana', icon: '◎', hint: 'Phantom / Solflare' },
  BTC: { name: 'Bitcoin', icon: '₿', hint: 'Unisat / Xverse / OKX' },
};

export default function BuyTokens() {
  const [amount, setAmount] = useState<string>('');
  const [chain, setChain] = useState<ChainOption>('ETH');
  const [connecting, setConnecting] = useState<boolean>(false);
  const [connected, setConnected] = useState<ConnectedWallet | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [btcDetected, setBtcDetected] = useState<{ unisat: boolean; xverse: boolean; okx: boolean; raw: string[] }>({ unisat: false, xverse: false, okx: false, raw: [] });

  // Deposit details returned by the canister
  const [isRequesting, setIsRequesting] = useState(false);
  const [depositAddress, setDepositAddress] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [minConfirmations, setMinConfirmations] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastTxId, setLastTxId] = useState<string | null>(null);

  useEffect(() => {
    setStepError(null);
    setRequestError(null);
    setDepositAddress('');
    setTransactionId('');
    setMinConfirmations(null);
    setExpiresAt(null);
    if (chain === 'BTC') detectBTCProviders();
  }, [chain]);

  const isReadyToRequest = useMemo(() => {
    return !!connected && !!amount && Number(amount) > 0;
  }, [connected, amount]);

  const detectBTCProviders = () => {
    if (typeof window === 'undefined') return;
    const raw: string[] = [];
    const has = (k: string, v: any) => {
      if (v) raw.push(k);
      return Boolean(v);
    };
    
    console.log('Detecting BTC providers...');
    console.log('Window object keys:', Object.keys(window).filter(k => 
      k.toLowerCase().includes('btc') || 
      k.toLowerCase().includes('bitcoin') || 
      k.toLowerCase().includes('unisat') || 
      k.toLowerCase().includes('xverse') || 
      k.toLowerCase().includes('okx')
    ));
    
    const unisat = has('window.unisat', (window as any).unisat);
    const xverseDirect = has('window.xverse', (window as any).xverse);
    const xverseProviders = has('window.xverse.providers.bitcoin', (window as any).xverse?.providers?.bitcoin);
    const xverseBtc = has('window.btc', (window as any).btc);
    const xverseAlt = has('window.XverseProviders.bitcoin', (window as any).XverseProviders?.bitcoin);
    const okx = has('window.okxwallet.bitcoin', (window as any).okxwallet?.bitcoin);
    
    console.log('Detection results:', { unisat, xverseDirect, xverseProviders, xverseBtc, xverseAlt, okx });
    
    setBtcDetected({ unisat, xverse: xverseDirect || xverseProviders || xverseBtc || xverseAlt, okx, raw });
  };

  useEffect(() => {
    if (chain === 'BTC') detectBTCProviders();
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && chain === 'BTC') detectBTCProviders();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [chain]);

  const connectWallet = async () => {
    try {
      setConnecting(true);
      setStepError(null);

      if (chain === 'ETH') {
        if (typeof window === 'undefined' || !(window as any).ethereum) {
          throw new Error('No EVM wallet detected. Please install MetaMask.');
        }
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts?.[0];
        if (!address) throw new Error('Failed to get EVM account');
        setConnected({ type: 'ETH', name: 'EVM Wallet', address });
      } else if (chain === 'SOL') {
        const sol = new SolanaWalletManager();
        const info = await sol.connect();
        if (!info.address) throw new Error('Failed to get Solana address');
        setConnected({ type: 'SOL', name: info.name, address: info.address });
      } else if (chain === 'BTC') {
        console.log('Connecting to BTC wallet...');
        const btc = new BitcoinWalletManager();
        // Ensure detection is refreshed in case the tab was open before install
        btc.refreshDetection();
        detectBTCProviders();
        
        console.log('BTC wallet manager created, attempting connection...');
        try {
          const info = await btc.connect();
          console.log('BTC connection successful:', info);
          if (!info.address) throw new Error('Failed to get Bitcoin address');
          setConnected({ type: 'BTC', name: info.name, address: info.address });
        } catch (e: any) {
          console.error('BTC connection failed:', e);
          // Provide actionable hints for Xverse
          const msg = e?.message || ''
          if (msg.includes('No Bitcoin wallet detected')) {
            throw new Error('No BTC wallet detected. Install Unisat or Xverse, then refresh the page.')
          }
          if (msg.includes('unlock') || msg.includes('address')) {
            throw new Error('Please unlock Xverse/Unisat and approve the connection prompt, then try again.')
          }
          if (msg.includes('Xverse connection failed')) {
            throw new Error('Xverse wallet connection failed. Please make sure Xverse is unlocked and try again.')
          }
          throw e
        }
      }
    } catch (err: any) {
      setStepError(err?.message || 'Failed to connect wallet');
      setConnected(null);
    } finally {
      setConnecting(false);
    }
  };

  const requestDeposit = async () => {
    if (!isReadyToRequest || !connected) {
      setRequestError('Please enter amount and connect your wallet');
      return;
    }

    try {
      setIsRequesting(true);
      setRequestError(null);

      const motoko = MotokoBackendService.getInstance();
      const res = await motoko.requestDeposit({
        userAddress: connected.address,
        chain,
        amount: Number(amount),
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to create deposit');
      }

      setDepositAddress(res.data.depositAddress);
      setTransactionId(res.data.transactionId);
      setLastTxId(res.data.transactionId);
      setMinConfirmations(res.data.minConfirmations);
      setExpiresAt(res.data.expiresAt);
    } catch (err: any) {
      setRequestError(err?.message || 'Failed to request deposit');
      setDepositAddress('');
      setTransactionId('');
      setMinConfirmations(null);
      setExpiresAt(null);
    } finally {
      setIsRequesting(false);
    }
  };

  const createPurchaseAndStore = async () => {
    try {
      setIsRequesting(true);
      setRequestError(null);
      const motoko = MotokoBackendService.getInstance();
      // Step 1: Always create a placeholder (requestDeposit already does this on failure)
      const res = await motoko.requestDeposit({ userAddress: connected?.address || '0x', chain, amount: Number(amount || '0') });
      if (!res.success || !res.data) throw new Error(res.error || 'Could not create purchase');
      setTransactionId(res.data.transactionId);
      setLastTxId(res.data.transactionId);
      setDepositAddress(res.data.depositAddress);
      setMinConfirmations(res.data.minConfirmations);
      setExpiresAt(res.data.expiresAt);

      // Step 2: If it was a placeholder (ph_), try persisting to canister immediately
      if (String(res.data.transactionId).startsWith('ph_')) {
        const persisted = await motoko.persistPlaceholderById(res.data.transactionId);
        if (persisted.success && persisted.newId) {
          setTransactionId(persisted.newId);
          setLastTxId(persisted.newId);
          if (persisted.depositAddress) setDepositAddress(persisted.depositAddress);
          if (persisted.minConfirmations != null) setMinConfirmations(persisted.minConfirmations);
          if (persisted.expiresAt != null) setExpiresAt(persisted.expiresAt);
        }
      }
    } catch (err: any) {
      setRequestError(err?.message || 'Failed to create purchase');
    } finally {
      setIsRequesting(false);
    }
  };

  const copyDeposit = async () => {
    if (!depositAddress) return;
    try {
      await navigator.clipboard.writeText(depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Buy Tokens</h1>
          <p className="text-slate-300">Enter the amount, select your wallet type, generate a deposit address, and pay.</p>
        </div>

        {/* Step 1: Amount and Chain */}
        <Card className="bg-slate-800/70 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Amount & Chain
            </CardTitle>
            <CardDescription className="text-slate-400">Specify how many tokens you want to buy and your wallet network.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Amount (tokens)</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                min="0"
                placeholder="100"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Wallet / Chain</Label>
              <Select value={chain} onValueChange={(v) => setChain(v as ChainOption)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['ETH', 'SOL', 'BTC'] as ChainOption[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{CHAIN_META[key].icon}</span>
                        <span>{CHAIN_META[key].name}</span>
                        <span className="ml-2 text-xs text-slate-500">{CHAIN_META[key].hint}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Connect Wallet */}
        <Card className="bg-slate-800/70 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Wallet className="h-5 w-5" /> Connect Wallet
            </CardTitle>
            <CardDescription className="text-slate-400">Connect a {CHAIN_META[chain].name} wallet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {connected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/60 border border-slate-600">
                  <div>
                    <div className="text-slate-200 text-sm">{connected.name}</div>
                    <div className="font-mono text-xs text-slate-400">{connected.address}</div>
                  </div>
                  <Badge className="bg-green-500 text-white">Connected</Badge>
                </div>
                <Button 
                  onClick={() => setConnected(null)} 
                  variant="outline" 
                  size="sm"
                  className="border-red-500/40 text-red-300 hover:bg-red-500/10"
                >
                  Disconnect Wallet
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Button onClick={connectWallet} disabled={connecting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {connecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                    Connect {CHAIN_META[chain].icon}
                  </Button>
                  <div className="text-xs text-slate-400">{CHAIN_META[chain].hint}</div>
                </div>
                {chain === 'BTC' && (
                  <div className="flex items-center flex-wrap gap-2 text-xs">
                    <span className="text-slate-400">Detected:</span>
                    <Badge variant="outline" className={btcDetected.unisat ? 'border-green-500 text-green-400' : 'border-slate-600 text-slate-400'}>Unisat {btcDetected.unisat ? '✓' : '—'}</Badge>
                    <Badge variant="outline" className={btcDetected.xverse ? 'border-green-500 text-green-400' : 'border-slate-600 text-slate-400'}>Xverse {btcDetected.xverse ? '✓' : '—'}</Badge>
                    <Badge variant="outline" className={btcDetected.okx ? 'border-green-500 text-green-400' : 'border-slate-600 text-slate-400'}>OKX {btcDetected.okx ? '✓' : '—'}</Badge>
                    <Button size="sm" variant="outline" onClick={detectBTCProviders} className="h-7 px-2 border-slate-600 text-slate-200">Retry detection</Button>
                  </div>
                )}
                {chain === 'BTC' && (
                  <div className="text-xs text-slate-400">
                    No Bitcoin wallet? Install
                    {' '}<a href="https://unisat.io/" target="_blank" className="text-indigo-300 hover:text-indigo-200 underline">Unisat</a>
                    {' '}or{' '}
                    <a href="https://www.xverse.app/" target="_blank" className="text-indigo-300 hover:text-indigo-200 underline">Xverse</a>.
                  </div>
                )}
              </div>
            )}

            {stepError && (
              <Alert className="border-red-500/40 bg-red-500/10">
                <AlertDescription className="text-red-300">{stepError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Generate Deposit Address (stores tx in canister) */}
        <Card className="bg-slate-800/70 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5" /> Generate Deposit Details
            </CardTitle>
            <CardDescription className="text-slate-400">Creates a transaction record in the canister and returns a deposit address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button onClick={requestDeposit} disabled={!isReadyToRequest || isRequesting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isRequesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ScanLine className="h-4 w-4 mr-2" />}
                Generate Deposit
              </Button>
              <Button onClick={createPurchaseAndStore} disabled={isRequesting || !amount} variant="outline" className="border-slate-600 text-slate-200">
                {isRequesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Purchase (Store)
              </Button>
            </div>

            {requestError && (
              <Alert className="border-red-500/40 bg-red-500/10">
                <AlertDescription className="text-red-300">{requestError}</AlertDescription>
              </Alert>
            )}

            {depositAddress && (
              <div className="space-y-3">
                <div className="text-sm text-slate-300">Deposit Address</div>
                <div className="p-3 bg-slate-700/60 rounded-lg border border-slate-600 flex items-start justify-between gap-3">
                  <div className="font-mono text-xs text-slate-200 break-all">{depositAddress}</div>
                  <Button size="sm" variant="outline" onClick={copyDeposit} className="border-slate-500 text-slate-200">
                    {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                  <div className="p-2 rounded bg-slate-700/60 border border-slate-600">
                    <div className="text-slate-400">Transaction ID</div>
                    <div className="font-mono text-slate-200 truncate">{transactionId}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-700/60 border border-slate-600">
                    <div className="text-slate-400">Min Confirms</div>
                    <div className="text-slate-200">{minConfirmations ?? '-'}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-700/60 border border-slate-600">
                    <div className="text-slate-400">Expires</div>
                    <div className="text-slate-200">{expiresAt ? new Date(expiresAt).toLocaleTimeString() : '-'}</div>
                  </div>
                </div>

                <Alert className="border-blue-500/40 bg-blue-500/10">
                  <AlertDescription className="text-blue-300">
                    Use your connected wallet to send funds to the deposit address above. This demo does not perform on-chain payments from the UI.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Production Payment System */}
        <ProductionPayment onPaymentComplete={(txHash) => {
          console.log('Payment completed:', txHash);
          // You can add additional logic here, like showing a success message
        }} />

        {/* My Tokens Section */}
        <MyTokensSection userAddress={connected?.address} />

        {/* Footer / Admin Link */}
        <div className="text-center">
          <a href="/admin" className="text-sm text-indigo-300 hover:text-indigo-200 underline">Open Admin Panel</a>
        </div>
      </div>
    </div>
  );
}


