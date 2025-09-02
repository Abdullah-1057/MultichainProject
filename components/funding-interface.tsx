"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, ExternalLink, Wallet, CheckCircle, Clock, AlertCircle, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/contexts/wallet-context"
import { BlockchainService, BitcoinService, SolanaService } from "@/lib/blockchain-service"
import { MotokoBackendService, ChainType, Transaction } from "@/lib/motoko-backend"
import { SendFundsModal } from "./send-funds-modal"
import { TransactionHistory } from "./transaction-history"

interface DepositRequest {
  depositId: string
  depositAddress: string
  qrData: string
  expiresAt: string
  chain: string
  minConfirmations: number
}

interface FundingStatus {
  status: "pending" | "confirmed" | "reward_sent" | "expired" | "failed"
  confirmations: number
  fundedAmount?: string
  fundingTxHash?: string
  rewardTxHash?: string
  explorerUrl?: string
}

interface ConnectedWallet {
  id: string
  address: string
  name: string
  type: "metamask" | "walletconnect" | "coinbase" | "demo"
  isActive: boolean
}

const CHAIN_CONFIG = {
  BTC: { name: "Bitcoin", icon: "₿", color: "bg-orange-500", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
  ETH: { name: "Ethereum", icon: "Ξ", color: "bg-blue-500", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  BASE: { name: "Base", icon: "🔵", color: "bg-blue-400", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  SOL: { name: "Solana", icon: "◎", color: "bg-purple-500", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
}

export function FundingInterface() {
  const { isConnected, address, walletName, walletIcon } = useWallet()
  const [selectedChain, setSelectedChain] = useState<ChainType>("ETH")
  const [amount, setAmount] = useState("")
  const [depositRequest, setDepositRequest] = useState<DepositRequest | null>(null)
  const [fundingStatus, setFundingStatus] = useState<FundingStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [showSendModal, setShowSendModal] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const { toast } = useToast()
  
  const blockchainService = BlockchainService.getInstance()
  const motokoBackend = MotokoBackendService.getInstance()

  const generateDepositAddress = async () => {
    if (!address || !selectedChain || !amount) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Use Motoko backend to create deposit request
      const response = await motokoBackend.requestDeposit({
        userAddress: address,
        chain: selectedChain,
        amount: parseFloat(amount)
      })

      if (response.success && response.data) {
        const depositData: DepositRequest = {
          depositId: response.data.transactionId,
          depositAddress: response.data.depositAddress,
          qrData: response.data.qrData,
          expiresAt: new Date(response.data.expiresAt).toISOString(),
          chain: selectedChain,
          minConfirmations: response.data.minConfirmations
        }

        setDepositRequest(depositData)
        setFundingStatus({ status: "pending", confirmations: 0 })
        
        toast({
          title: "Deposit Address Generated",
          description: `Generated ${selectedChain} deposit address. Send $${amount} to receive $2 reward tokens.`,
        })
      } else {
        throw new Error(response.error || "Failed to generate deposit address")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate deposit address")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate deposit address",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkStatus = useCallback(async () => {
    if (!depositRequest) return

    try {
      // Use Motoko backend to check status
      const response = await motokoBackend.checkStatus(depositRequest.depositId)

      if (response.success && response.data) {
        const status: FundingStatus = {
          status: response.data.status.toLowerCase() as any,
          confirmations: response.data.confirmations,
          fundedAmount: response.data.fundedAmount?.toString(),
          fundingTxHash: response.data.fundingTxHash,
          rewardTxHash: response.data.rewardTxHash,
          explorerUrl: response.data.explorerUrl,
        }

        setFundingStatus(status)

        // If confirmed, automatically send reward
        if (response.data.status === 'CONFIRMED') {
          const rewardResponse = await motokoBackend.sendReward(depositRequest.depositId)
          if (rewardResponse.success) {
            toast({
              title: "Reward Sent!",
              description: `$${motokoBackend.getRewardAmount()} reward sent to ${motokoBackend.getFixedReceiptAddress()}`,
            })
          }
        }
      } else {
        throw new Error(response.error || "Failed to check status")
      }
    } catch (err) {
      console.error("Failed to check status:", err)
    }
  }, [depositRequest, motokoBackend, toast])

  // Load user transactions
  const loadUserTransactions = useCallback(async () => {
    if (!address) return
    
    try {
      const userTransactions = await motokoBackend.getTransactionsByUser(address)
      setTransactions(userTransactions)
    } catch (err) {
      console.error("Failed to load transactions:", err)
    }
  }, [address, motokoBackend])

  // Load transactions when address changes
  useEffect(() => {
    loadUserTransactions()
  }, [loadUserTransactions])

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "Address copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the address manually",
        variant: "destructive",
      })
    }
  }

  // Update countdown timer
  useEffect(() => {
    if (!depositRequest) return

    const updateTimer = () => {
      const now = new Date().getTime()
      const expiry = new Date(depositRequest.expiresAt).getTime()
      const difference = expiry - now

      if (difference > 0) {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`)
      } else {
        setTimeRemaining("Expired")
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [depositRequest])

  // Poll for status updates
  useEffect(() => {
    if (!depositRequest || fundingStatus?.status === "reward_sent") return

    const pollInterval = setInterval(checkStatus, 8000)
    return () => clearInterval(pollInterval)
  }, [depositRequest, fundingStatus?.status, checkStatus])

  // Reset form
  const resetForm = () => {
    setDepositRequest(null)
    setFundingStatus(null)
    setSelectedChain("ETH")
    setAmount("")
    setError(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "reward_sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "expired":
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "confirmed":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "reward_sent":
        return "bg-green-50 text-green-700 border-green-200"
      case "expired":
      case "failed":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const renderQRCode = () => {
    if (!depositRequest) return null

    return (
      <div className="flex justify-center">
        <div className="apple-card p-6 rounded-xl apple-shadow">
          <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center border border-border">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(depositRequest.qrData)}`}
              alt="Deposit Address QR Code"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div className="text-center mt-3 text-sm text-muted-foreground font-medium">Scan to copy address</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Wallet Connection Status */}
      {!isConnected ? (
        <Card className="apple-card apple-shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl apple-heading">Connect Your Wallet</CardTitle>
            <CardDescription className="apple-text text-base">
              Connect your wallet to start funding projects and receiving rewards
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Please connect your wallet using the wallet connector above to continue.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="apple-card apple-shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl apple-heading flex items-center gap-2">
                  <span className="text-2xl">{walletIcon}</span>
                  {walletName}
                </CardTitle>
                <CardDescription className="apple-text">
                  Your wallet is connected and ready for funding operations
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowSendModal(true)}
                className="apple-button"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Funds
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Wallet Address Display */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Wallet Address</Label>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{walletName}</div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  Connected
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funding Form */}
      {isConnected && !depositRequest && (
        <Card className="apple-card apple-shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl apple-heading">Create Funding Request</CardTitle>
            <CardDescription className="apple-text">
              Choose your payment method and generate a deposit address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Reward Wallet</Label>
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{walletName}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {address}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="chain" className="text-sm font-medium">Payment Method</Label>
              <Select value={selectedChain} onValueChange={(value) => setSelectedChain(value as ChainType)}>
                <SelectTrigger className="apple-input h-12">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CHAIN_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-3">
                        <span className={`w-4 h-4 rounded-full ${config.color}`} />
                        <span className="font-medium">{config.icon} {config.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="amount" className="text-sm font-medium">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount in USD"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="apple-input h-12"
                min="0.01"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                You will receive $2 in reward tokens for each successful transaction
              </p>
            </div>

            <Button
              onClick={generateDepositAddress}
              disabled={!address || !selectedChain || !amount || isLoading}
              className="w-full apple-button py-3 text-base font-medium rounded-lg h-12"
            >
              {isLoading ? "Generating..." : "Generate Deposit Address"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            {error}
            <Button variant="link" onClick={resetForm} className="ml-2 p-0 h-auto text-destructive hover:text-destructive/80">
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Deposit Instructions */}
      {depositRequest && (
        <Card className="apple-card apple-shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-3 text-2xl apple-heading">
                  <span
                    className={`w-4 h-4 rounded-full ${CHAIN_CONFIG[depositRequest.chain as keyof typeof CHAIN_CONFIG].color}`}
                  />
                  Send {CHAIN_CONFIG[depositRequest.chain as keyof typeof CHAIN_CONFIG].name}
                </CardTitle>
                <CardDescription className="apple-text">Send any amount to the address below</CardDescription>
              </div>
              <div className="text-right space-y-1">
                <div className="text-sm text-muted-foreground font-medium">Expires in</div>
                <div className="font-mono text-xl font-semibold text-foreground">{timeRemaining}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Deposit Address */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Deposit Address</Label>
              <div className="flex gap-3">
                <Input 
                  value={depositRequest.depositAddress} 
                  readOnly 
                  className="apple-input font-mono h-12 flex-1" 
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(depositRequest.depositAddress)}
                  className="apple-button-secondary h-12 w-12 rounded-lg"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* QR Code */}
            {renderQRCode()}

            {/* Status */}
            {fundingStatus && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Status</Label>
                  <Badge className={getStatusColor(fundingStatus.status)}>
                    {getStatusIcon(fundingStatus.status)}
                    <span className="ml-1 capitalize">{fundingStatus.status.replace("_", " ")}</span>
                  </Badge>
                </div>

                {fundingStatus.status === "pending" && (
                  <div className="text-sm text-muted-foreground">
                    Waiting for {depositRequest.minConfirmations} confirmations...
                    {fundingStatus.confirmations > 0 && (
                      <span className="ml-2">
                        ({fundingStatus.confirmations}/{depositRequest.minConfirmations})
                      </span>
                    )}
                  </div>
                )}

                {fundingStatus.fundedAmount && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Funded Amount: </span>
                    <span className="font-mono">
                      {fundingStatus.fundedAmount} {depositRequest.chain}
                    </span>
                  </div>
                )}

                {fundingStatus.explorerUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(fundingStatus.explorerUrl, "_blank")}
                    className="apple-button-secondary"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Explorer
                  </Button>
                )}

                {fundingStatus.status === "reward_sent" && (
                  <Alert className="border-green-500/50 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      Reward tokens have been sent to your EVM address!
                      {fundingStatus.rewardTxHash && (
                        <Button
                          variant="link"
                          onClick={() => window.open(`https://etherscan.io/tx/${fundingStatus.rewardTxHash}`, "_blank")}
                          className="ml-2 p-0 h-auto text-green-600 hover:text-green-500"
                        >
                          View reward transaction
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Loading Skeleton */}
            {isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-4 w-1/4 bg-muted" />
                <Skeleton className="h-12 w-full bg-muted" />
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={resetForm} 
              className="w-full apple-button-secondary h-12 text-base font-medium rounded-lg"
            >
              Request New Address
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      {isConnected && (
        <TransactionHistory userAddress={address!} />
      )}

      {/* Send Funds Modal */}
      <SendFundsModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        activeWallet={isConnected ? { address: address!, name: walletName } : null}
      />
    </div>
  )
}

declare global {
  interface Window {
    ethereum?: any
  }
}

