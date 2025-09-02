"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, ExternalLink, Copy, Trash2, Settings, AlertCircle } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { useToast } from "@/hooks/use-toast"

const WALLET_CONFIGS = {
  metamask: {
    name: "MetaMask",
    icon: "🦊",
    description: "Connect using MetaMask browser extension",
    color: "bg-orange-50 border-orange-200 text-orange-700",
  },
  walletconnect: {
    name: "WalletConnect",
    icon: "🔗",
    description: "Connect using WalletConnect compatible wallets",
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
  coinbase: {
    name: "Coinbase Wallet",
    icon: "🔵",
    description: "Connect using Coinbase Wallet",
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
  oisy: {
    name: "Oisy Wallet",
    icon: "🌊",
    description: "Connect using Oisy wallet",
    color: "bg-purple-50 border-purple-200 text-purple-700",
  },
}

export function WalletConnector() {
  const { 
    isConnected, 
    address, 
    walletName, 
    walletIcon, 
    connectWallet, 
    disconnectWallet, 
    error, 
    clearError 
  } = useWallet()
  
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const { toast } = useToast()

  const handleConnect = async (walletType: keyof typeof WALLET_CONFIGS) => {
    try {
      setIsConnecting(walletType)
      clearError()
      await connectWallet(walletType)
      toast({
        title: "Wallet Connected",
        description: `${WALLET_CONFIGS[walletType].name} connected successfully`,
      })
    } catch (err: any) {
      toast({
        title: "Connection Failed",
        description: err.message || "Failed to connect wallet",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(null)
    }
  }

  const handleDisconnect = () => {
    try {
      disconnectWallet()
      toast({
        title: "Wallet Disconnected",
        description: "Wallet has been disconnected successfully",
      })
    } catch (err: any) {
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet",
        variant: "destructive",
      })
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

  const openExplorer = () => {
    if (address) {
      const explorerUrl = `https://etherscan.io/address/${address}`
      window.open(explorerUrl, '_blank')
    }
  }

  if (isConnected && address) {
    return (
      <Card className="apple-card apple-shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl apple-heading flex items-center gap-2">
                <span className="text-2xl">{walletIcon}</span>
                {walletName}
              </CardTitle>
              <CardDescription className="apple-text">
                Your wallet is connected and ready to use
              </CardDescription>
            </div>
            <Badge className="bg-green-50 text-green-700 border-green-200">
              Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wallet Address */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Wallet Address</div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
              <div className="flex-1 font-mono text-sm break-all">
                {address}
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
                  onClick={openExplorer}
                  size="sm"
                  variant="outline"
                  className="apple-button-secondary"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Disconnect Button */}
          <Button
            onClick={handleDisconnect}
            variant="outline"
            className="w-full apple-button-secondary"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Disconnect Wallet
          </Button>
        </CardContent>
      </Card>
    )
  }

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
      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Wallet Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(WALLET_CONFIGS).map(([key, config]) => (
            <Button
              key={key}
              onClick={() => handleConnect(key as keyof typeof WALLET_CONFIGS)}
              disabled={isConnecting === key}
              className={`h-auto p-4 flex flex-col items-center space-y-2 ${config.color} hover:opacity-90 transition-opacity`}
              variant="outline"
            >
              <span className="text-2xl">{config.icon}</span>
              <div className="text-center">
                <div className="font-medium">{config.name}</div>
                <div className="text-xs opacity-75">{config.description}</div>
              </div>
              {isConnecting === key && (
                <div className="text-xs">Connecting...</div>
              )}
            </Button>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>By connecting your wallet, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </CardContent>
    </Card>
  )
}

