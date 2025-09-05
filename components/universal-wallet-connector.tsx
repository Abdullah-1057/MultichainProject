"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BitcoinWalletManager } from "@/lib/bitcoin-wallet"
import { SolanaWalletManager } from "@/lib/solana-wallet"

// Global wallet interfaces
declare global {
  interface Window {
    ethereum?: any
    phantom?: {
      solana?: any
    }
    unisat?: any
    xverse?: any
    okxwallet?: {
      bitcoin?: any
    }
    solflare?: any
    sollet?: any
    backpack?: any
  }
}

interface WalletInfo {
  type: "evm" | "solana" | "bitcoin" | "unknown"
  name: string
  icon: string
  isInstalled: boolean
  isConnected: boolean
  address?: string
  chainId?: string
}

export function UniversalWalletConnector() {
  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedWallet, setConnectedWallet] = useState<WalletInfo | null>(null)
  const { toast } = useToast()

  // Detect available wallets
  useEffect(() => {
    const detectWallets = () => {
      const detectedWallets: WalletInfo[] = []

      // Check for EVM wallets
      if (window.ethereum) {
        detectedWallets.push({
          type: "evm",
          name: "MetaMask",
          icon: "🦊",
          isInstalled: true,
          isConnected: false
        })
      }

      // Check for Solana wallets
      const solanaManager = new SolanaWalletManager()
      if (solanaManager.isWalletInstalled()) {
        detectedWallets.push({
          type: "solana",
          name: "Solana Wallet",
          icon: "🟡",
          isInstalled: true,
          isConnected: false
        })
      }

      // Check for Bitcoin wallets
      const bitcoinManager = new BitcoinWalletManager()
      if (bitcoinManager.isWalletInstalled()) {
        detectedWallets.push({
          type: "bitcoin",
          name: "Bitcoin Wallet",
          icon: "🟠",
          isInstalled: true,
          isConnected: false
        })
      }

      setWallets(detectedWallets)
    }

    if (typeof window !== 'undefined') {
      detectWallets()
    }
  }, [])

  const connectWallet = async (wallet: WalletInfo) => {
    setIsConnecting(true)

    try {
      if (wallet.type === "evm") {
        await connectEVMWallet()
      } else if (wallet.type === "solana") {
        await connectSolanaWallet()
      } else if (wallet.type === "bitcoin") {
        await connectBitcoinWallet()
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive"
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const connectEVMWallet = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })

    const chainId = await window.ethereum.request({
      method: 'eth_chainId'
    })

    setConnectedWallet({
      type: "evm",
      name: "MetaMask",
      icon: "🦊",
      isInstalled: true,
      isConnected: true,
      address: accounts[0],
      chainId: chainId
    })

    toast({
      title: "Wallet Connected",
      description: "MetaMask connected successfully",
    })
  }

  const connectSolanaWallet = async () => {
    const solanaManager = new SolanaWalletManager()
    const walletInfo = await solanaManager.connect()
    
    setConnectedWallet({
      type: "solana",
      name: walletInfo.name,
      icon: walletInfo.icon,
      isInstalled: true,
      isConnected: true,
      address: walletInfo.address
    })

    toast({
      title: "Wallet Connected",
      description: `${walletInfo.name} wallet connected successfully`,
    })
  }

  const connectBitcoinWallet = async () => {
    const bitcoinManager = new BitcoinWalletManager()
    const walletInfo = await bitcoinManager.connect()
    
    setConnectedWallet({
      type: "bitcoin",
      name: walletInfo.name,
      icon: walletInfo.icon,
      isInstalled: true,
      isConnected: true,
      address: walletInfo.address
    })

    toast({
      title: "Wallet Connected",
      description: `${walletInfo.name} wallet connected successfully`,
    })
  }

  const disconnectWallet = () => {
    setConnectedWallet(null)
    toast({
      title: "Wallet Disconnected",
      description: "Wallet disconnected successfully",
    })
  }

  const getChainName = (chainId: string) => {
    const chainMap: { [key: string]: string } = {
      '0x1': 'Ethereum',
      '0x2105': 'Base',
      '0x89': 'Polygon',
      '0xa4b1': 'Arbitrum',
      '0xa': 'Optimism'
    }
    return chainMap[chainId] || 'Unknown Chain'
  }

  if (connectedWallet) {
    return (
      <Card className="apple-card apple-shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl apple-heading flex items-center gap-2">
                <span className="text-2xl">{connectedWallet.icon}</span>
                {connectedWallet.name}
              </CardTitle>
              <CardDescription className="apple-text">
                {connectedWallet.type === "evm" && "EVM Compatible Wallet"}
                {connectedWallet.type === "solana" && "Solana Wallet"}
                {connectedWallet.type === "bitcoin" && "Bitcoin Wallet"}
              </CardDescription>
            </div>
            <Badge className="bg-green-50 text-green-700 border-green-200">
              Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-lg">{connectedWallet.icon}</span>
                </div>
                <div>
                  <div className="font-medium">{connectedWallet.name}</div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {connectedWallet.address?.slice(0, 6)}...{connectedWallet.address?.slice(-4)}
                  </div>
                  {connectedWallet.chainId && (
                    <div className="text-xs text-muted-foreground">
                      {getChainName(connectedWallet.chainId)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  onClick={() => {
                    const explorer = connectedWallet.type === "evm" ? "https://etherscan.io" :
                                   connectedWallet.type === "solana" ? "https://explorer.solana.com" :
                                   "https://blockstream.info"
                    window.open(`${explorer}/address/${connectedWallet.address}`, '_blank')
                  }}
                  size="sm"
                  variant="outline"
                  className="apple-button-secondary"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <Button
            onClick={disconnectWallet}
            variant="outline"
            className="w-full"
          >
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
          Choose a wallet to connect and start sending transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {wallets.length === 0 ? (
          <Alert className="border-yellow-500/50 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              No wallets detected. Please install MetaMask, Phantom, or Unisat.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {wallets.map((wallet, index) => (
              <Button
                key={index}
                onClick={() => connectWallet(wallet)}
                disabled={isConnecting || !wallet.isInstalled}
                className="w-full justify-start h-12 apple-button"
              >
                <span className="text-2xl mr-3">{wallet.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{wallet.name}</div>
                  <div className="text-sm opacity-70">
                    {wallet.type === "evm" && "EVM Compatible"}
                    {wallet.type === "solana" && "Solana Network"}
                    {wallet.type === "bitcoin" && "Bitcoin Network"}
                  </div>
                </div>
                {isConnecting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </Button>
            ))}
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have a wallet? 
            <a 
              href="https://metamask.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-1 text-primary hover:underline"
            >
              Install MetaMask
            </a>
            {" "}or{" "}
            <a 
              href="https://phantom.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Install Phantom
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
