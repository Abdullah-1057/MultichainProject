"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { MotokoBackendService, Transaction, TransactionStats } from "@/lib/motoko-backend"

interface TransactionHistoryProps {
  userAddress: string
}

const CHAIN_CONFIG = {
  BTC: { name: "Bitcoin", icon: "₿", color: "bg-orange-500" },
  ETH: { name: "Ethereum", icon: "Ξ", color: "bg-blue-500" },
  SOL: { name: "Solana", icon: "◎", color: "bg-purple-500" },
  POLYGON: { name: "Polygon", icon: "⬟", color: "bg-purple-600" },
  ARBITRUM: { name: "Arbitrum", icon: "🔷", color: "bg-blue-600" },
  OPTIMISM: { name: "Optimism", icon: "🔴", color: "bg-red-500" },
}

const STATUS_CONFIG = {
  PENDING: { 
    label: "Pending", 
    color: "bg-yellow-500", 
    icon: Clock,
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50"
  },
  CONFIRMED: { 
    label: "Confirmed", 
    color: "bg-blue-500", 
    icon: CheckCircle,
    textColor: "text-blue-700",
    bgColor: "bg-blue-50"
  },
  REWARD_SENT: { 
    label: "Reward Sent", 
    color: "bg-green-500", 
    icon: CheckCircle,
    textColor: "text-green-700",
    bgColor: "bg-green-50"
  },
  FAILED: { 
    label: "Failed", 
    color: "bg-red-500", 
    icon: XCircle,
    textColor: "text-red-700",
    bgColor: "bg-red-50"
  },
  EXPIRED: { 
    label: "Expired", 
    color: "bg-gray-500", 
    icon: AlertCircle,
    textColor: "text-gray-700",
    bgColor: "bg-gray-50"
  },
}

export function TransactionHistory({ userAddress }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const motokoBackend = MotokoBackendService.getInstance()

  useEffect(() => {
    loadTransactions()
    loadStats()
  }, [userAddress])

  const loadTransactions = async () => {
    if (!userAddress) return
    
    try {
      setIsLoading(true)
      const userTransactions = await motokoBackend.getTransactionsByUser(userAddress)
      setTransactions(userTransactions)
    } catch (err) {
      console.error("Failed to load transactions:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const transactionStats = await motokoBackend.getTransactionStats()
      setStats(transactionStats)
    } catch (err) {
      console.error("Failed to load stats:", err)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const displayedTransactions = showAll ? transactions : transactions.slice(0, 5)

  if (isLoading) {
    return (
      <Card className="apple-card apple-shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl apple-heading">Transaction History</CardTitle>
          <CardDescription className="apple-text">
            Loading your transaction history...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-muted/30 rounded-lg border animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-muted rounded-full" />
                    <div>
                      <div className="h-4 bg-muted rounded w-20 mb-2" />
                      <div className="h-3 bg-muted rounded w-32" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-muted rounded w-16 mb-2" />
                    <div className="h-3 bg-muted rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card className="apple-card apple-shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl apple-heading">Transaction History</CardTitle>
          <CardDescription className="apple-text">
            No transactions yet. Start funding to see your history here.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <Card className="apple-card apple-shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl apple-heading">Transaction Overview</CardTitle>
            <CardDescription className="apple-text">
              Your funding activity summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{stats.totalTransactions}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">{stats.rewardSentTransactions}</div>
                <div className="text-sm text-green-600">Rewards Sent</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{stats.confirmedTransactions}</div>
                <div className="text-sm text-blue-600">Confirmed</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-700">{formatAmount(stats.totalRewardAmount)}</div>
                <div className="text-sm text-yellow-600">Total Rewards</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction List */}
      <Card className="apple-card apple-shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl apple-heading">Recent Transactions</CardTitle>
          <CardDescription className="apple-text">
            Your recent funding transactions and rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayedTransactions.map((transaction) => {
              const chainConfig = CHAIN_CONFIG[transaction.chain as keyof typeof CHAIN_CONFIG]
              const statusConfig = STATUS_CONFIG[transaction.status as keyof typeof STATUS_CONFIG]
              const StatusIcon = statusConfig.icon

              return (
                <div key={transaction.id} className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${statusConfig.color}`} />
                      <div className="flex items-center space-x-2">
                        <span className={`w-6 h-6 rounded-full ${chainConfig?.color || 'bg-gray-500'} flex items-center justify-center text-white text-xs font-bold`}>
                          {chainConfig?.icon || '?'}
                        </span>
                        <div>
                          <div className="font-medium text-sm">
                            {chainConfig?.name || transaction.chain}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatAmount(transaction.amount)} → $2 reward
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className={`${statusConfig.bgColor} ${statusConfig.textColor} border-current`}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(transaction.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Transaction Details */}
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Transaction ID:</span>
                        <div className="font-mono text-foreground">{transaction.id}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Deposit Address:</span>
                        <div className="font-mono text-foreground truncate">{transaction.depositAddress}</div>
                      </div>
                      {transaction.fundingTxHash && (
                        <div>
                          <span className="text-muted-foreground">Funding TX:</span>
                          <div className="font-mono text-foreground truncate">{transaction.fundingTxHash}</div>
                        </div>
                      )}
                      {transaction.rewardTxHash && (
                        <div>
                          <span className="text-muted-foreground">Reward TX:</span>
                          <div className="font-mono text-foreground truncate">{transaction.rewardTxHash}</div>
                        </div>
                      )}
                    </div>
                    
                    {transaction.explorerUrl && (
                      <div className="mt-2">
                        <a
                          href={transaction.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View on Explorer
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          {transactions.length > 5 && (
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="apple-button-secondary"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show Less" : `View All ${transactions.length} Transactions`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
