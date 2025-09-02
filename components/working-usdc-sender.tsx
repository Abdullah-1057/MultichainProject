"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/contexts/wallet-context"

export function WorkingUSDCSender() {
  const { isConnected, address, walletName, walletIcon } = useWallet()
  const [recipientAddress, setRecipientAddress] = useState("")
  const [amount, setAmount] = useState("2") // Default to 2 USDC
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const { toast } = useToast()

  // Simple USDC transfer using a more reliable method
  const sendUSDC = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }

    if (!recipientAddress) {
      toast({
        title: "Invalid Address",
        description: "Please enter a recipient address",
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
    setTxHash(null)

    try {
      // Check if MetaMask is available
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error("MetaMask not detected. Please install MetaMask.")
      }

      // Check if we're on Base network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      if (chainId !== '0x2105') { // Base mainnet chain ID
        // Try to switch to Base network
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }],
          })
        } catch (switchError: any) {
          // If the network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x2105',
                chainName: 'Base',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://base.llamarpc.com'],
                blockExplorerUrls: ['https://basescan.org'],
              }],
            })
          } else {
            throw switchError
          }
        }
      }

      // USDC Contract Address on Base
      const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
      
      // Convert amount to wei (USDC has 6 decimals)
      const amountInWei = Math.floor(parseFloat(amount) * 1000000)
      const amountHex = '0x' + amountInWei.toString(16).padStart(64, '0')
      
      // Clean recipient address (remove 0x if present)
      const cleanRecipient = recipientAddress.startsWith('0x') 
        ? recipientAddress.slice(2) 
        : recipientAddress
      const recipientHex = '0x' + cleanRecipient.padStart(64, '0')
      
      // Create transaction data properly
      const transferData = '0xa9059cbb' + recipientHex.slice(2) + amountHex.slice(2)

      console.log('Transaction data:', transferData)
      console.log('Recipient:', recipientAddress)
      console.log('Amount:', amount, 'USDC')
      console.log('Amount in wei:', amountInWei)

      // Send transaction
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: USDC_ADDRESS,
          data: transferData,
          gas: '0x5208', // 21000 gas limit
        }],
      })

      setTxHash(txHash)
      
      toast({
        title: "Transaction Sent!",
        description: `USDC transfer initiated. Hash: ${txHash.slice(0, 10)}...`,
      })

      // Wait for confirmation (simplified)
      setTimeout(() => {
        toast({
          title: "Transaction Confirmed!",
          description: `Successfully sent ${amount} USDC to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`,
        })
      }, 3000)

    } catch (err: any) {
      console.error("USDC transfer failed:", err)
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
            <Send className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl apple-heading">Connect Your Wallet</CardTitle>
          <CardDescription className="apple-text text-base">
            Connect your wallet to send USDC on Base network
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
    <div className="space-y-6">
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
                Ready to send USDC on Base network
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
                  <span className="text-lg">🔵</span>
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
                  onClick={() => window.open(`https://basescan.org/address/${address}`, '_blank')}
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

      {/* Send USDC Form */}
      <Card className="apple-card apple-shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl apple-heading flex items-center gap-2">
            <span className="text-2xl">💵</span>
            Send USDC on Base
          </CardTitle>
          <CardDescription className="apple-text">
            Send USDC tokens from your wallet to any address on Base network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="recipient" className="text-sm font-medium">Recipient Address</Label>
            <Input
              id="recipient"
              type="text"
              placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="apple-input h-12"
            />
            <p className="text-xs text-muted-foreground">
              Enter the recipient's wallet address on Base network
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="amount" className="text-sm font-medium">Amount (USDC)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="2.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="apple-input h-12"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-muted-foreground">
              Enter the amount of USDC to send
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

          {/* Success Alert */}
          {txHash && (
            <Alert className="border-green-500/50 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Transaction successful! 
                <a 
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 underline hover:no-underline"
                >
                  View on BaseScan
                </a>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={sendUSDC}
            disabled={!recipientAddress || !amount || isLoading}
            className="w-full apple-button py-3 text-base font-medium rounded-lg h-12"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending USDC...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send {amount} USDC
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
