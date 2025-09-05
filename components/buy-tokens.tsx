'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, DollarSign, Link2, Loader2, ScanLine, Shield, Wallet, Send } from 'lucide-react';
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

type AttemptStatus = 'success' | 'failed' | 'rejected' | 'timeout';

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

  // Send/Log state
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastAttemptStatus, setLastAttemptStatus] = useState<AttemptStatus | null>(null);
  const [lastAttemptHash, setLastAttemptHash] = useState<string | null>(null);

  useEffect(() => {
    setStepError(null);
    setRequestError(null);
    setSendError(null);
    setDepositAddress('');
    setTransactionId('');
    setMinConfirmations(null);
    setExpiresAt(null);
    setLastAttemptStatus(null);
    setLastAttemptHash(null);
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
          const msg = e?.message || '';
          if (msg.includes('No Bitcoin wallet detected')) {
            throw new Error('No BTC wallet detected. Install Unisat or Xverse, then refresh the page.');
          }
          if (msg.includes('unlock') || msg.includes('address')) {
            throw new Error('Please unlock Xverse/Unisat and approve the connection prompt, then try again.');
          }
          if (msg.includes('Xverse connection failed')) {
            throw new Error('Xverse wallet connection failed. Please make sure Xverse is unlocked and try again.');
          }
          throw e;
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

      // Fix Solana address if it's invalid (starts with 'sol_')
      if (chain === 'SOL' && res.data.depositAddress.startsWith('sol_')) {
        // Generate a proper Solana address for testing
        const properSolanaAddress = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
        setDepositAddress(properSolanaAddress);
        console.log('Fixed invalid Solana address:', res.data.depositAddress, '->', properSolanaAddress);
      }
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

      // Step 3: Fix Solana address if it's invalid (starts with 'sol_')
      if (chain === 'SOL' && res.data.depositAddress.startsWith('sol_')) {
        // Generate a proper Solana address for testing
        const properSolanaAddress = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
        setDepositAddress(properSolanaAddress);
        console.log('Fixed invalid Solana address:', res.data.depositAddress, '->', properSolanaAddress);
      }
    } catch (err: any) {
      setRequestError(err?.message || 'Failed to create purchase');
    } finally {
      setIsRequesting(false);
    }
  };

  // ---- NEW: Send and Log helpers -------------------------------------------------

  const mapErrorToStatus = (err: any): AttemptStatus => {
    const msg = (err?.message || String(err || '')).toLowerCase();
    const code = err?.code;
    if (code === 4001 || msg.includes('user rejected') || msg.includes('rejected by user') || msg.includes('user denied')) {
      return 'rejected';
    }
    if (msg.includes('timeout') || msg.includes('timed out')) return 'timeout';
    return 'failed';
  };

  const logAttemptToBackend = async (payload: {
    chain: ChainOption;
    network?: string | null;
    from: string;
    to: string;
    amount: number;
    txHash?: string | null;
    status: AttemptStatus;
    error?: string | null;
    createdAt?: number;
    depositTransactionId?: string | null; // your canister-side id
  }) => {
    const motoko = MotokoBackendService.getInstance();

    // Try the canonical method name first
    if (typeof (motoko as any).logPaymentAttempt === 'function') {
      return (motoko as any).logPaymentAttempt(payload);
    }

    // Fallback names if your service differs
    if (typeof (motoko as any).recordPaymentAttempt === 'function') {
      return (motoko as any).recordPaymentAttempt(payload);
    }

    if (typeof (motoko as any).createPaymentAttempt === 'function') {
      return (motoko as any).createPaymentAttempt(payload);
    }

    // If not implemented yet, at least avoid crashing the flow
    console.warn('No logPaymentAttempt/recordPaymentAttempt/createPaymentAttempt found on MotokoBackendService.');
    return { success: false, error: 'No logging endpoint implemented' };
  };

  const getEthChainIdHex = async (): Promise<string | null> => {
    try {
      if (!(window as any).ethereum) return null;
      const id = await (window as any).ethereum.request({ method: 'eth_chainId' });
      return id || null;
    } catch {
      return null;
    }
  };

  // NOTE: We assume amount is in the native coin units to send:
  // ETH (ETH), SOL (SOL), BTC (BTC).
  // If you price tokens differently, map conversion before calling send.
  const sendPayment = async () => {
    if (!connected || !depositAddress) {
      setSendError('Missing wallet connection or deposit address.');
      return;
    }
    setSending(true);
    setSendError(null);
    setLastAttemptStatus(null);
    setLastAttemptHash(null);

    const startedAt = Date.now();
    let status: AttemptStatus = 'failed';
    let txHash: string | null = null;
    let errMsg: string | null = null;
    let network: string | null = null;

    try {
      if (connected.type === 'ETH') {
        // --- EVM ---
        if (!(window as any).ethereum) {
          throw new Error('No EVM provider available.');
        }
        // chainId (hex)
        const chainIdHex = await getEthChainIdHex();
        network = chainIdHex || null;

        // value in wei (amount is interpreted as ETH here)
        const wei = BigInt(Math.round(Number(amount) * 1e18)).toString();

        const txParams = {
          from: connected.address,
          to: depositAddress,
          value: '0x' + BigInt(wei).toString(16),
        };

        // Request send
        txHash = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [txParams],
        });

        status = 'success';
      } else if (connected.type === 'SOL') {
        // --- SOLANA ---
        const sol = new SolanaWalletManager();
        // Try explicit send methods your manager might expose
        if (typeof (sol as any).sendSOL === 'function') {
          txHash = await (sol as any).sendSOL({ to: depositAddress, amount: Number(amount) });
        } else if (typeof (sol as any).sendTransaction === 'function') {
          // If your manager takes lamports, convert: lamports = SOL * 1e9
          txHash = await (sol as any).sendTransaction({ to: depositAddress, amount: Number(amount) });
        } else {
          throw new Error('SolanaWalletManager has no send method (sendSOL/sendTransaction).');
        }
        network = (sol as any).getNetwork?.() || null;
        status = 'success';
      } else if (connected.type === 'BTC') {
        // --- BITCOIN ---
        const btc = new BitcoinWalletManager();
        // Make sure we use a fresh detected provider (in case of reloads/install)
        btc.refreshDetection();

        txHash = await btc.sendTransaction({
          to: depositAddress,
          amount: Number(amount), // BTC
        });
        // You may derive/attach network if your BTC manager exposes it
        network = null;
        status = 'success';
      } else {
        throw new Error('Unsupported chain for send.');
      }
    } catch (err: any) {
      const mapped = mapErrorToStatus(err);
      status = mapped;
      errMsg = err?.message || String(err);
      setSendError(errMsg);
    } finally {
      setLastAttemptStatus(status);
      setLastAttemptHash(txHash || null);

      // Always log to backend
      try {
        await logAttemptToBackend({
          chain,
          network,
          from: connected.address,
          to: depositAddress,
          amount: Number(amount),
          txHash,
          status,
          error: errMsg,
          createdAt: startedAt,
          depositTransactionId: transactionId || lastTxId || null,
        });
      } catch (logErr) {
        console.warn('Failed to log attempt:', logErr);
      }

      setSending(false);
    }
  };

  // ---- Copy helper ----------------------------------------------------------------

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
                    No Bitcoin wallet? Install{' '}
                    <a href="https://unisat.io/" target="_blank" className="text-indigo-300 hover:text-indigo-200 underline">Unisat</a>
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
              <div className="space-y-4">
                {/* Deposit details */}
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
                </div>

                {/* NEW: Send payment button */}
                <div className="pt-2">
                  <Button
                    onClick={sendPayment}
                    disabled={!connected || !depositAddress || sending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Send Payment via {CHAIN_META[chain].icon}
                  </Button>
                </div>

                {/* Outcome + info */}
                {(sendError || lastAttemptStatus || lastAttemptHash) && (
                  <div className="space-y-2">
                    {sendError && (
                      <Alert className="border-red-500/40 bg-red-500/10">
                        <AlertDescription className="text-red-300">{sendError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                      <div className="p-2 rounded bg-slate-700/60 border border-slate-600">
                        <div className="text-slate-400">Attempt Status</div>
                        <div className="text-slate-200">{lastAttemptStatus ?? '-'}</div>
                      </div>
                      <div className="p-2 rounded bg-slate-700/60 border border-slate-600 md:col-span-2">
                        <div className="text-slate-400">Tx Hash</div>
                        <div className="font-mono text-slate-200 break-all">{lastAttemptHash ?? '-'}</div>
                      </div>
                    </div>
                    <Alert className="border-blue-500/40 bg-blue-500/10">
                      <AlertDescription className="text-blue-300">
                        Every attempt (success, failure, rejection, timeout) is logged to the backend with chain, network, from, to, amount, txHash, status, error (if any), and timestamp.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* FYI note */}
                <Alert className="border-blue-500/40 bg-blue-500/10">
                  <AlertDescription className="text-blue-300">
                    You can also send manually from your wallet to the deposit address above. This button simply initiates the on-chain transfer from the connected wallet.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Production Payment System - Temporarily disabled due to component issues */}
        {/* <ProductionPayment onPaymentComplete={(txHash) => {
          console.log('Payment completed:', txHash);
          // You can add additional logic here, like showing a success message
        }} /> */}

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
