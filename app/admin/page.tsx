'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Loader2, RefreshCw, Download } from 'lucide-react';
import { MotokoBackendService, Transaction } from '@/lib/motoko-backend-real';

const CHAINS = ['ALL', 'ETH', 'BTC', 'SOL', 'POLYGON', 'ARBITRUM', 'OPTIMISM'] as const;
const STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'REWARD_SENT', 'FAILED', 'EXPIRED', 'PAID'] as const;

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // UI state
  const [query, setQuery] = useState('');
  const [chain, setChain] = useState<typeof CHAINS[number]>('ALL');
  const [status, setStatus] = useState<typeof STATUSES[number]>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const motoko = useMemo(() => MotokoBackendService.getInstance(), []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const txs = await motoko.getAllTransactions();
      // Sort newest first
      txs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setTransactions(txs);
    } catch (e: any) {
      setError(e?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchQuery = query
        ? [t.id, t.userAddress, t.depositAddress, t.fundingTxHash, t.rewardTxHash]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(query.toLowerCase()))
        : true;
      const matchChain = chain === 'ALL' ? true : t.chain === chain;
      const matchStatus = status === 'ALL' ? true : t.status === status;
      return matchQuery && matchChain && matchStatus;
    });
  }, [transactions, query, chain, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageTx = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const markAsPaid = async (transactionId: string) => {
    try {
      setLoading(true);
      console.log('Marking transaction as paid:', transactionId);
      const result = await motoko.markAsPaid(transactionId);
      console.log('Mark as paid result:', result);
      
      if (result.success) {
        // Force refresh the data
        await load();
        alert('Transaction marked as paid successfully');
      } else {
        alert(`Failed to mark as paid: ${result.error}`);
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const header = [
      'orderId',
      'chain',
      'amount',
      'status',
      'from',
      'to',
      'txHash',
      'rewardTx',
      'confirmations',
      'createdAt',
    ];
    const rows = filtered.map((t) => [
      t.id,
      t.chain,
      t.amount,
      t.status,
      t.userAddress,
      t.depositAddress,
      t.fundingTxHash || '',
      t.rewardTxHash || '',
      '',
      t.createdAt ? new Date(t.createdAt).toISOString() : '',
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400">Canister y65zg-vaaaa-aaaap-anvnq-cai</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={exportCSV} variant="outline" className="border-slate-600 text-slate-200 text-black">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
            <Button onClick={load} variant="outline" className="border-slate-600 text-slate-200 text-black">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/70 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Filters</CardTitle>
            <CardDescription className="text-slate-400">Search and narrow down transactions</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Search by ID, address, or hash"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-slate-900/60 border-slate-600 text-white placeholder-slate-400"
            />
            <Select value={chain} onValueChange={(v) => setChain(v as typeof CHAINS[number])}>
              <SelectTrigger className="bg-slate-900/60 border-slate-600 text-white">
                <SelectValue placeholder="Chain" />
              </SelectTrigger>
              <SelectContent>
                {CHAINS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof STATUSES[number])}>
              <SelectTrigger className="bg-slate-900/60 border-slate-600 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-slate-800/70 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Token Purchases</CardTitle>
            <CardDescription className="text-slate-400">{filtered.length} transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-500/40 bg-red-500/10">
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}
            {loading ? (
              <div className="text-slate-400">Loading...</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-slate-300">Order ID</TableHead>
                      <TableHead className="text-slate-300">Chain</TableHead>
                      <TableHead className="text-slate-300">Amount (USD)</TableHead>
                      <TableHead className="text-slate-300">From</TableHead>
                      <TableHead className="text-slate-300">Deposit</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Created</TableHead>
                      <TableHead className="text-slate-300">Explorer</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageTx.map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-slate-900/40">
                        <TableCell className="font-mono text-xs text-slate-200">{tx.id}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-slate-600 text-slate-300">{tx.chain}</Badge>
                        </TableCell>
                        <TableCell className="text-slate-200">${tx.amount.toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-300 truncate max-w-[160px]">{tx.userAddress}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-300 truncate max-w-[160px]">{tx.depositAddress}</TableCell>
                        <TableCell>
                          <Badge className="bg-slate-700 text-white">{tx.status}</Badge>
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          {tx.explorerUrl ? (
                            <a href={tx.explorerUrl} target="_blank" className="text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1 text-xs">
                              <ExternalLink className="h-3 w-3" /> View
                            </a>
                          ) : (
                            <span className="text-slate-500 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {String(tx.id).startsWith('ph_') ? (
                              <Button
                                size="sm"
                                onClick={async () => {
                                  setLoading(true);
                                  const res = await motoko.persistPlaceholderToCanister(tx);
                                  await load();
                                  setLoading(false);
                                  if (!res.success) {
                                    alert(`Persist failed: ${res.error}`);
                                  }
                                }}
                                className="h-7 px-3"
                              >
                                Save to Canister
                              </Button>
                            ) : tx.status !== 'PAID' ? (
                              <Button
                                size="sm"
                                onClick={() => markAsPaid(tx.id)}
                                disabled={loading}
                                className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Mark as Paid
                              </Button>
                            ) : (
                              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40">
                                Paid
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 text-slate-400">
                  <div className="text-sm">Page {page} of {totalPages}</div>
                  <div className="flex gap-2">
                    <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="border-slate-600 text-slate-200 text-black">Prev</Button>
                    <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="border-slate-600 text-slate-200 text-black">Next</Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
