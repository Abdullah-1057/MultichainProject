"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MotokoBackendService } from "@/lib/motoko-backend"
import { RealBlockchainService } from "@/lib/real-blockchain-service"

interface SendFundsModalProps {
  isOpen: boolean
  onClose: () => void
  activeWallet: {
    address: string
    name: string
  } | null
}

const CHAIN_CONFIG = {
  ETH: { 
    name: "Ethereum", 
    icon: "Ξ", 
    color: "bg-blue-500",
    token: "ETH",
    tokenAddress: null, // Native ETH
    decimals: 18,
    symbol: "ETH"
  },
  ETH_USDC: { 
    name: "Ethereum (USDC)", 
    icon: "Ξ", 
    color: "bg-blue-500",
    token: "USDC",
    tokenAddress: "0xA0b86a33E6441b8c4C8C0e4b8b8c4C8C0e4b8b8c4", // USDC on Ethereum
    decimals: 6,
    symbol: "USDC"
  },
  BASE: { 
    name: "Base", 
    icon: "🔵", 
    color: "bg-blue-400",
    token: "ETH",
    tokenAddress: null, // Native ETH on Base
    decimals: 18,
    symbol: "ETH"
  },
  BASE_USDC: { 
    name: "Base (USDC)", 
    icon: "🔵", 
    color: "bg-blue-400",
    token: "USDC",
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    decimals: 6,
    symbol: "USDC"
  },
  BTC: { 
    name: "Bitcoin", 
    icon: "₿", 
    color: "bg-orange-500",
    token: "BTC",
    tokenAddress: null, // Native BTC
    decimals: 8,
    symbol: "BTC"
  },
  SOL: { 
    name: "Solana", 
    icon: "◎", 
    color: "bg-purple-500",
    token: "SOL",
    tokenAddress: null, // Native SOL
    decimals: 9,
    symbol: "SOL"
  },
  SOL_USDC: { 
    name: "Solana (USDC)", 
    icon: "◎", 
    color: "bg-purple-500",
    token: "USDC",
    tokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC on Solana
    decimals: 6,
    symbol: "USDC"
  },
  POLYGON: { 
    name: "Polygon", 
    icon: "⬟", 
    color: "bg-purple-600",
    token: "MATIC",
    tokenAddress: null, // Native MATIC
    decimals: 18,
    symbol: "MATIC"
  },
  POLYGON_USDC: { 
    name: "Polygon (USDC)", 
    icon: "⬟", 
    color: "bg-purple-600",
    token: "USDC",
    tokenAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC on Polygon
    decimals: 6,
    symbol: "USDC"
  },
  ARBITRUM: { 
    name: "Arbitrum", 
    icon: "🔷", 
    color: "bg-blue-600",
    token: "ETH",
    tokenAddress: null, // Native ETH on Arbitrum
    decimals: 18,
    symbol: "ETH"
  },
  ARBITRUM_USDC: { 
    name: "Arbitrum (USDC)", 
    icon: "🔷", 
    color: "bg-blue-600",
    token: "USDC",
    tokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC on Arbitrum
    decimals: 6,
    symbol: "USDC"
  },
  OPTIMISM: { 
    name: "Optimism", 
    icon: "🔴", 
    color: "bg-red-500",
    token: "ETH",
    tokenAddress: null, // Native ETH on Optimism
    decimals: 18,
    symbol: "ETH"
  },
  OPTIMISM_USDC: { 
    name: "Optimism (USDC)", 
    icon: "🔴", 
    color: "bg-red-500",
    token: "USDC",
    tokenAddress: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // USDC on Optimism
    decimals: 6,
    symbol: "USDC"
  },
}

export function SendFundsModal({ isOpen, onClose, activeWallet }: SendFundsModalProps) {
  const [recipientAddress, setRecipientAddress] = useState("")
  const [usdAmount, setUsdAmount] = useState("")
  const [selectedChain, setSelectedChain] = useState("ETH")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tokenAmount, setTokenAmount] = useState("")
  const { toast } = useToast()

  // Load the fixed receipt address from the backend
  useEffect(() => {
    const loadReceiptAddress = async () => {
      try {
        const motokoBackend = MotokoBackendService.getInstance()
        const address = await motokoBackend.getFixedReceiptAddress()
        setRecipientAddress(address)
      } catch (error) {
        console.error('Failed to load receipt address:', error)
        // Fallback to the known address
        setRecipientAddress("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")
      }
    }

    if (isOpen) {
      loadReceiptAddress()
    }
  }, [isOpen])

  // Calculate token amount when USD amount or chain changes
  useEffect(() => {
    if (usdAmount && selectedChain) {
      const chainConfig = CHAIN_CONFIG[selectedChain as keyof typeof CHAIN_CONFIG]
      if (chainConfig) {
        // For USDC, 1 USD = 1 USDC (6 decimals)
        if (chainConfig.symbol === "USDC") {
          const tokenAmount = (parseFloat(usdAmount) * Math.pow(10, chainConfig.decimals)).toFixed(0)
          setTokenAmount(tokenAmount)
        } else if (chainConfig.symbol === "ETH") {
          // Assuming 1 ETH = $2,000 for demo (in real app, fetch from API)
          const ethPrice = 2000
          const ethAmount = (parseFloat(usdAmount) / ethPrice * Math.pow(10, chainConfig.decimals)).toFixed(0)
          setTokenAmount(ethAmount)
        } else if (chainConfig.symbol === "MATIC") {
          // Assuming 1 MATIC = $0.5 for demo
          const maticPrice = 0.5
          const maticAmount = (parseFloat(usdAmount) / maticPrice * Math.pow(10, chainConfig.decimals)).toFixed(0)
          setTokenAmount(maticAmount)
        } else if (chainConfig.symbol === "SOL") {
          // Assuming 1 SOL = $100 for demo
          const solPrice = 100
          const solAmount = (parseFloat(usdAmount) / solPrice * Math.pow(10, chainConfig.decimals)).toFixed(0)
          setTokenAmount(solAmount)
        } else if (chainConfig.symbol === "BTC") {
          // Assuming 1 BTC = $50,000 for demo
          const btcPrice = 50000
          const btcAmount = (parseFloat(usdAmount) / btcPrice * Math.pow(10, chainConfig.decimals)).toFixed(0)
          setTokenAmount(btcAmount)
        }
      }
    } else {
      setTokenAmount("")
    }
  }, [usdAmount, selectedChain])

  const handleSend = async () => {
    if (!usdAmount || !selectedChain || !activeWallet) {
      setError("Please enter USD amount, select a chain, and ensure wallet is connected")
      return
    }

    const chainConfig = CHAIN_CONFIG[selectedChain as keyof typeof CHAIN_CONFIG]
    if (!chainConfig) {
      setError("Invalid chain selected")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Calculate the exact token amount to send
      const tokenAmountToSend = parseFloat(tokenAmount) / Math.pow(10, chainConfig.decimals)
      
      // Create transaction request for ICP storage
      const transactionRequest = {
        userAddress: activeWallet.address,
        chain: selectedChain,
        token: chainConfig.symbol,
        tokenAddress: chainConfig.tokenAddress,
        usdAmount: parseFloat(usdAmount),
        tokenAmount: tokenAmountToSend,
        recipientAddress: recipientAddress,
        timestamp: Date.now()
      }

      // Store transaction request in ICP backend
      const motokoBackend = MotokoBackendService.getInstance()
      const depositResponse = await motokoBackend.requestDeposit({
        userAddress: activeWallet.address,
        chain: selectedChain as any, // Type assertion for compatibility
        amount: parseFloat(usdAmount),
        tokenAddress: chainConfig.tokenAddress || "",
        timestamp: BigInt(Date.now())
      })

      if (!depositResponse.success) {
        throw new Error(depositResponse.error || "Failed to create transaction request")
      }

      // Execute real blockchain transaction based on chain
      const blockchainService = RealBlockchainService.getInstance()
      let txResult: { txHash: string; explorerUrl: string }
      
      switch (selectedChain) {
        case "ETH":
        case "ETH_USDC":
        case "BASE":
        case "BASE_USDC":
        case "POLYGON":
        case "POLYGON_USDC":
        case "ARBITRUM":
        case "ARBITRUM_USDC":
        case "OPTIMISM":
        case "OPTIMISM_USDC":
          // Extract the base chain name for EVM transactions
          const baseChainName = selectedChain.replace('_USDC', '').replace('_USDC', '')
          txResult = await blockchainService.sendEVMTransaction(
            activeWallet.address, 
            recipientAddress, 
            tokenAmountToSend, 
            baseChainName,
            chainConfig.tokenAddress || undefined
          )
          break
        case "BTC":
          txResult = await blockchainService.sendBitcoinTransaction(
            activeWallet.address, 
            recipientAddress, 
            tokenAmountToSend
          )
          break
        case "SOL":
          txResult = await blockchainService.sendSolanaTransaction(
            activeWallet.address, 
            recipientAddress, 
            tokenAmountToSend
          )
          break
        default:
          throw new Error(`Unsupported chain: ${selectedChain}`)
      }

      // Update transaction status in ICP
      if (depositResponse.data?.transactionId) {
        await motokoBackend.checkStatus(depositResponse.data.transactionId)
      }

      setSuccess(true)
      toast({
        title: "Transaction Sent Successfully!",
        description: `Sent $${usdAmount} worth of ${chainConfig.symbol}. TX: ${txResult.txHash.slice(0, 8)}...${txResult.txHash.slice(-6)}`,
      })

      // Reset form after success
      setTimeout(() => {
        setRecipientAddress("")
        setUsdAmount("")
        setSelectedChain("ETH")
        setTokenAmount("")
        setSuccess(false)
        onClose()
      }, 3000)
    } catch (err: any) {
      console.error("Transaction failed:", err)
      setError(err.message || "Failed to send transaction")
      toast({
        title: "Transaction Failed",
        description: err.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="apple-card apple-shadow-lg w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl apple-heading flex items-center gap-2">
            <Send className="h-6 w-6 text-primary" />
            Send Funds
          </CardTitle>
          <CardDescription className="apple-text">
            Send USD-denominated tokens from your connected wallet to the reward address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Transaction Sent!</h3>
                <p className="text-muted-foreground">Your funds have been sent successfully.</p>
              </div>
            </div>
          ) : (
            <>
              {/* From Wallet */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">From Wallet</Label>
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <div className="text-sm font-medium">{activeWallet?.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {activeWallet?.address.slice(0, 8)}...{activeWallet?.address.slice(-6)}
                  </div>
                </div>
              </div>

              {/* Recipient Address - Fixed */}
              <div className="space-y-3">
                <Label htmlFor="recipient" className="text-sm font-medium">Recipient Address (Fixed)</Label>
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <div className="text-sm font-mono text-foreground">
                    {recipientAddress || "Loading..."}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    This is the fixed receipt address for rewards
                  </div>
                </div>
              </div>

              {/* Amount and Chain */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="amount" className="text-sm font-medium">Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                    placeholder="0.00"
                    className="apple-input h-12"
                    min="0"
                    step="0.01"
                  />
                  {tokenAmount && selectedChain && (
                    <div className="text-sm text-muted-foreground">
                      ≈ {parseFloat(tokenAmount) / Math.pow(10, CHAIN_CONFIG[selectedChain as keyof typeof CHAIN_CONFIG]?.decimals || 6)} {CHAIN_CONFIG[selectedChain as keyof typeof CHAIN_CONFIG]?.symbol}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="chain" className="text-sm font-medium">Chain & Token</Label>
                  <Select value={selectedChain} onValueChange={setSelectedChain}>
                    <SelectTrigger className="apple-input h-12">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHAIN_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${config.color}`} />
                            {config.icon} {config.name} ({config.symbol})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedChain && (
                    <div className="text-sm text-muted-foreground">
                      Will send {CHAIN_CONFIG[selectedChain as keyof typeof CHAIN_CONFIG]?.symbol} to the reward address
                    </div>
                  )}
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert className="border-destructive/50 bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 apple-button-secondary h-12"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !recipientAddress || !usdAmount || !selectedChain}
                  className="flex-1 apple-button h-12"
                >
                  {isLoading ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Funds
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

