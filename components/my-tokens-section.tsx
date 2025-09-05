'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Coins,
  ExternalLink,
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  DollarSign,
  Hash
} from 'lucide-react';
import { MotokoBackendService, Transaction } from '@/lib/motoko-backend-real';

interface MyTokensSectionProps {
  userAddress?: string;
  className?: string;
}

/** ===== Helpers to normalize Candid values ===== **/

// Unwrap a Candid variant like { ETH: null } → "ETH"
function unwrapVariant(v: any, fallback = 'UNKNOWN'): string {
  if (!v || typeof v !== 'object') return fallback;
  const keys = Object.keys(v);
  return keys.length ? keys[0] : fallback;
}

// Unwrap Candid opt like [] | ["val"] → undefined | "val"
function unwrapOpt<T = string>(v: any): T | undefined {
  return Array.isArray(v) ? (v.length ? (v[0] as T) : undefined) : (v as T | undefined);
}

// Convert Candid time ns (bigint) → JS ms (number)
function nsBigIntToMsNumber(ns: bigint | number | undefined | null): number | undefined {
  if (ns === undefined || ns === null) return undefined;
  if (typeof ns === 'bigint') return Number(ns / 1_000_000n); // ns → ms
  if (typeof ns === 'number') {
    // If value looks like seconds, lift to ms; if already ms, keep it.
    return ns < 10 ** 12 ? ns * 1000 : ns;
  }
  return undefined;
}

// Type used by the UI after normalization
type UITransaction = {
  id: string;
  amount: number;
  chain: string;
  status: string;
  createdAt?: number; // ms
  depositAddress?: string;
  userAddress?: string;
  fundingTxHash?: string;
  rewardTxHash?: string;
  explorerUrl?: string;
};

const STATUS_ICONS: Record<string, JSX.Element> = {
  PENDING: <Clock className="h-4 w-4 text-yellow-400" />,
  CONFIRMED: <CheckCircle className="h-4 w-4 text-green-400" />,
  REWARD_SENT: <Coins className="h-4 w-4 text-emerald-400" />,
  FAILED: <XCircle className="h-4 w-4 text-red-400" />,
  EXPIRED: <AlertCircle className="h-4 w-4 text-orange-400" />,
  PAID: <CheckCircle className="h-4 w-4 text-blue-400" />,
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  CONFIRMED: 'bg-green-500/20 text-green-300 border-green-500/40',
  REWARD_SENT: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  FAILED: 'bg-red-500/20 text-red-300 border-red-500/40',
  EXPIRED: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  PAID: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
};

const CHAIN_ICONS: Record<string, string> = {
  ETH: '⟠',
  BTC: '₿',
  SOL: '◎',
  POLYGON: '⬟',
  ARBITRUM: '🔷',
  OPTIMISM: '🔴',
};

export default function MyTokensSection({ userAddress, className = '' }: MyTokensSectionProps) {
  const [transactions, setTransactions] = useState<UITransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const motoko = MotokoBackendService.getInstance();

  // Normalize a raw Motoko transaction (Candid) into a UI-friendly record
  const normalizeTx = (raw: Transaction): UITransaction => {
    const chain = typeof (raw as any).chain === 'string'
      ? (raw as any).chain
      : unwrapVariant((raw as any).chain, 'UNKNOWN');

    const status = typeof (raw as any).status === 'string'
      ? (raw as any).status
      : unwrapVariant((raw as any).status, 'UNKNOWN');

    const createdAtMs = nsBigIntToMsNumber((raw as any).createdAt);

    return {
      id: (raw as any).id ?? '',
      amount: Number((raw as any).amount ?? 0),
      chain,
      status,
      createdAt: createdAtMs,
      depositAddress: (raw as any).depositAddress ?? '',
      userAddress: (raw as any).userAddress ?? '',
      fundingTxHash: unwrapOpt<string>((raw as any).fundingTxHash),
      rewardTxHash: unwrapOpt<string>((raw as any).rewardTxHash),
      explorerUrl: unwrapOpt<string>((raw as any).explorerUrl),
    };
  };

  const loadTransactions = async () => {
    if (!userAddress) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userTxs = await motoko.getTransactionsByUser(userAddress);
      // Normalize and sort safely by ms number (newest first)
      const normalized = (userTxs || []).map(normalizeTx).sort((a, b) => {
        const ams = a.createdAt ?? 0;
        const bms = b.createdAt ?? 0;
        return bms - ams;
      });
      setTransactions(normalized);
    } catch (err: any) {
      setError(err?.message || 'Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (timestampMs?: number) => {
    if (!timestampMs) return '-';
    return new Date(timestampMs).toLocaleString();
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getExplorerUrl = (chain: string, txHash?: string) => {
    if (!txHash) return null;

    const urls = {
      ETH: `https://etherscan.io/tx/${txHash}`,
      BTC: `https://www.blockchain.com/btc/tx/${txHash}`,
      SOL: `https://solscan.io/tx/${txHash}`,
      POLYGON: `https://polygonscan.com/tx/${txHash}`,
      ARBITRUM: `https://arbiscan.io/tx/${txHash}`,
      OPTIMISM: `https://optimistic.etherscan.io/tx/${txHash}`,
    } as const;

    return (urls as any)[chain] || null;
  };

  // Safe totals (amount is normalized to number)
  const totalSpent = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const successfulTxs = transactions.filter(tx => tx.status === 'REWARD_SENT').length;
  const pendingTxs = transactions.filter(tx => tx.status === 'PENDING').length;

  if (!userAddress) {
    return (
      <Card className={`bg-slate-800/70 border-slate-700 ${className}`}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Coins className="h-5 w-5" /> My Tokens
          </CardTitle>
          <CardDescription className="text-slate-400">
            Connect your wallet to view your token purchase history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-blue-500/40 bg-blue-500/10">
            <AlertDescription className="text-blue-300">
              Please connect your wallet to view your token purchase history.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-slate-800/70 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Coins className="h-5 w-5" /> My Tokens
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your token purchase history and transaction details
            </CardDescription>
          </div>
          <Button
            onClick={loadTransactions}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-200"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-500/40 bg-red-500/10">
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-slate-700/60 border border-slate-600">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <DollarSign className="h-4 w-4" />
              Total Spent
            </div>
            <div className="text-xl font-bold text-white">{formatAmount(totalSpent)}</div>
          </div>
          <div className="p-4 rounded-lg bg-slate-700/60 border border-slate-600">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <CheckCircle className="h-4 w-4" />
              Successful
            </div>
            <div className="text-xl font-bold text-white">{successfulTxs}</div>
          </div>
          <div className="p-4 rounded-lg bg-slate-700/60 border border-slate-600">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <Clock className="h-4 w-4" />
              Pending
            </div>
            <div className="text-xl font-bold text-white">{pendingTxs}</div>
          </div>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-400">Loading transactions...</span>
          </div>
        ) : transactions.length === 0 ? (
          <Alert className="border-blue-500/40 bg-blue-500/10">
            <AlertDescription className="text-blue-300">
              No token purchases found. Start by buying some tokens above!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-slate-300 mb-2">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-slate-300">Transaction</TableHead>
                    <TableHead className="text-slate-300">Chain</TableHead>
                    <TableHead className="text-slate-300">Amount</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Deposit Address</TableHead>
                    <TableHead className="text-slate-300">Date</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-slate-900/40">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-slate-400" />
                          <span className="font-mono text-xs text-slate-200 truncate max-w-[120px]">
                            {tx.id}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(tx.id, `id-${tx.id}`)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
                          >
                            {copied === `id-${tx.id}` ? (
                              <CheckCircle className="h-3 w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{CHAIN_ICONS[tx.chain as keyof typeof CHAIN_ICONS] || '?'}</span>
                          <span className="text-slate-200 text-sm">{tx.chain}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-200 font-medium">
                        {formatAmount(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_COLORS[tx.status] || 'bg-slate-600/30 text-slate-200 border-slate-500/40'} flex items-center gap-1 w-fit`}>
                          {STATUS_ICONS[tx.status] || <AlertCircle className="h-4 w-4" />}
                          {tx.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-300 truncate max-w-[160px]">
                            {tx.depositAddress ?? '-'}
                          </span>
                          {tx.depositAddress && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(tx.depositAddress!, `deposit-${tx.id}`)}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
                            >
                              {copied === `deposit-${tx.id}` ? (
                                <CheckCircle className="h-3 w-3 text-green-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {formatDate(tx.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {tx.fundingTxHash && getExplorerUrl(tx.chain, tx.fundingTxHash) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const url = getExplorerUrl(tx.chain, tx.fundingTxHash);
                                if (url) window.open(url, '_blank');
                              }}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
                              title="View on Explorer"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                          {tx.rewardTxHash && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(tx.rewardTxHash!, `reward-${tx.id}`)}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
                              title="Copy Reward TX"
                            >
                              {copied === `reward-${tx.id}` ? (
                                <CheckCircle className="h-3 w-3 text-green-400" />
                              ) : (
                                <Coins className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
