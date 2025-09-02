"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, ExternalLink, Wallet, CheckCircle, Clock, AlertCircle, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/contexts/wallet-context"

const CHAIN_CONFIG = {
  ETH: { name: "Ethereum", icon: "Ξ", color: "bg-blue-500", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  BASE: { name: "Base", icon: "🔵", color: "bg-blue-400", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  BTC: { name: "Bitcoin", icon: "₿", color: "bg-orange-500", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
  SOL: { name: "Solana", icon: "◎", color: "bg-purple-500", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
}

export function FundingInterfaceSimple() {
  const { isConnected, address, walletName, walletIcon } = useWallet()
  const [selectedChain, setSelectedChain] = useState("ETH")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSendFunds = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Transaction Successful!",
        description: `Sent ${amount} ${selectedChain} from your wallet`,
      })
      
      // Reset form
      setAmount("")
    } catch (err: any) {
      setError(err.message || "Transaction failed")
      toast({
        title: "Transaction Failed",
        description: err.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address)
        toast({
          title: "Address Copied",
          description: "Wallet address copied to clipboard",
        })
      } catch (err) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy address",
          variant: "destructive",
        })
      }
    }
  }

  if (!isConnected) {
    return (
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
    )
  }

  return (
    <div className="space-y-8">
      {/* Wallet Status */}
      <Card className="apple-card apple-shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl apple-heading flex items-center gap-2">
                <span className="text-2xl">{walletIcon || '👛'}</span>
                {walletName || 'Connected Wallet'}
              </CardTitle>
              <CardDescription className="apple-text">
                Your wallet is connected and ready for funding operations
              </CardDescription>
            </div>
            <Badge className="bg-green-50 text-green-700 border-green-200">
              Connected
            </Badge>
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
                  <div className="font-medium">{walletName || 'Connected Wallet'}</div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  onClick={copyAddress}
                  size="sm"
                  variant="outline"
                  className="apple-button-secondary"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => window.open(`https://etherscan.io/address/${address}`, '_blank')}
                  size="sm"
                  variant="outline"
                  className="apple-button-secondary"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funding Form */}
      <Card className="apple-card apple-shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl apple-heading">Send Funds</CardTitle>
          <CardDescription className="apple-text">
            Send cryptocurrency from your connected wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="chain" className="text-sm font-medium">Select Chain</Label>
            <Select value={selectedChain} onValueChange={setSelectedChain}>
              <SelectTrigger className="apple-input h-12">
                <SelectValue placeholder="Select chain" />
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
            <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="apple-input h-12"
              min="0"
              step="0.001"
            />
            <p className="text-xs text-muted-foreground">
              You will receive reward tokens for each successful transaction
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSendFunds}
            disabled={!amount || isLoading}
            className="w-full apple-button py-3 text-base font-medium rounded-lg h-12"
          >
            {isLoading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send {amount} {selectedChain}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
