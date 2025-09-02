"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Activity, DollarSign, Clock, AlertTriangle, CheckCircle } from "lucide-react"

interface ChainStatus {
  chain: string
  status: "online" | "offline" | "degraded"
  blockHeight: number
  lastCheck: string
  pendingFundings: number
}

interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  totalProcessed: number
}

interface TokenInfo {
  address: string
  symbol: string
  decimals: number
  balance: string
  balanceUSD: string
}

export function AdminDashboard() {
  const [chainStatuses, setChainStatuses] = useState<ChainStatus[]>([])
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchData = async () => {
    try {
      setError(null)

      // Fetch chain statuses
      const chainResponse = await fetch("/api/admin/chain-status")
      if (!chainResponse.ok) throw new Error("Failed to fetch chain status")
      const chainData = await chainResponse.json()
      setChainStatuses(chainData.chains || [])

      // Fetch reward info
      const rewardResponse = await fetch("/api/admin/reward-info")
      if (!rewardResponse.ok) throw new Error("Failed to fetch reward info")
      const rewardData = await rewardResponse.json()
      setQueueStats(rewardData.queueStats)
      setTokenInfo(rewardData.tokenInfo)

      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleBatchCheck = async () => {
    try {
      setError(null)
      const response = await fetch("/api/admin/batch-check-fundings", { method: "POST" })
      if (!response.ok) throw new Error("Batch check failed")

      const result = await response.json()
      alert(`Batch check completed: ${result.confirmed} fundings confirmed`)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch check failed")
    }
  }

  const handleProcessQueue = async () => {
    try {
      setError(null)
      const response = await fetch("/api/admin/process-reward-queue", { method: "POST" })
      if (!response.ok) throw new Error("Queue processing failed")

      const result = await response.json()
      alert("Reward queue processed successfully")
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Queue processing failed")
    }
  }

  const handleRetryFailed = async () => {
    try {
      setError(null)
      const response = await fetch("/api/admin/retry-failed-rewards", { method: "POST" })
      if (!response.ok) throw new Error("Retry failed")

      const result = await response.json()
      alert(`Retry completed: ${result.results.length} rewards processed`)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed")
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "degraded":
        return "bg-yellow-500"
      case "offline":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400">Multi-chain funding system monitoring</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Last updated: {lastUpdate.toLocaleTimeString()}</span>
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="border-red-500 bg-red-500/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Chain Status</CardTitle>
              <Activity className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {chainStatuses.map((chain) => (
                  <div key={chain.chain} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(chain.status)}`} />
                    <span className="text-xs text-slate-400">{chain.chain}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Reward Queue</CardTitle>
              <Clock className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{queueStats?.pending || 0}</div>
              <p className="text-xs text-slate-400">Pending rewards</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Token Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${tokenInfo?.balanceUSD || "0"}</div>
              <p className="text-xs text-slate-400">
                {tokenInfo?.balance || "0"} {tokenInfo?.symbol || "TOKENS"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Total Processed</CardTitle>
              <CheckCircle className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{queueStats?.totalProcessed || 0}</div>
              <p className="text-xs text-slate-400">Rewards sent</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="chains" className="space-y-6">
          <TabsList className="bg-slate-800/50 border-slate-700">
            <TabsTrigger value="chains">Chain Status</TabsTrigger>
            <TabsTrigger value="rewards">Reward System</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="chains" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {chainStatuses.map((chain) => (
                <Card key={chain.chain} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-200">{chain.chain}</CardTitle>
                      <Badge
                        variant={chain.status === "online" ? "default" : "destructive"}
                        className={chain.status === "online" ? "bg-green-500" : ""}
                      >
                        {chain.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Block Height:</span>
                      <span className="text-white">{chain.blockHeight?.toLocaleString() || "N/A"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Pending:</span>
                      <span className="text-white">{chain.pendingFundings || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Last Check:</span>
                      <span className="text-white text-xs">
                        {chain.lastCheck ? new Date(chain.lastCheck).toLocaleTimeString() : "Never"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-slate-200">Queue Statistics</CardTitle>
                  <CardDescription className="text-slate-400">Current reward processing status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {queueStats && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pending:</span>
                        <Badge variant="outline">{queueStats.pending}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Processing:</span>
                        <Badge variant="outline">{queueStats.processing}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Completed:</span>
                        <Badge className="bg-green-500">{queueStats.completed}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Failed:</span>
                        <Badge variant="destructive">{queueStats.failed}</Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-slate-200">Token Information</CardTitle>
                  <CardDescription className="text-slate-400">Reward token details and balance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tokenInfo && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Symbol:</span>
                        <span className="text-white">{tokenInfo.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Balance:</span>
                        <span className="text-white">{tokenInfo.balance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">USD Value:</span>
                        <span className="text-white">${tokenInfo.balanceUSD}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Address:</span>
                        <span className="text-white text-xs font-mono">
                          {tokenInfo.address.slice(0, 6)}...{tokenInfo.address.slice(-4)}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-slate-200">Chain Operations</CardTitle>
                  <CardDescription className="text-slate-400">Manual chain monitoring and processing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleBatchCheck} className="w-full">
                    <Activity className="w-4 h-4 mr-2" />
                    Batch Check Fundings
                  </Button>
                  <p className="text-xs text-slate-400">Manually check all pending fundings for confirmations</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-slate-200">Reward Operations</CardTitle>
                  <CardDescription className="text-slate-400">Manual reward processing and recovery</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleProcessQueue} className="w-full">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Process Reward Queue
                  </Button>
                  <Button onClick={handleRetryFailed} variant="outline" className="w-full bg-transparent">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Failed Rewards
                  </Button>
                  <p className="text-xs text-slate-400">Manually process pending rewards or retry failed transfers</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
