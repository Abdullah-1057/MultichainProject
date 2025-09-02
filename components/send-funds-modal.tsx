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

interface SendFundsModalProps {
  isOpen: boolean
  onClose: () => void
  activeWallet: {
    address: string
    name: string
  } | null
}

const CHAIN_CONFIG = {
  BTC: { name: "Bitcoin", icon: "₿", color: "bg-orange-500" },
  ETH: { name: "Ethereum", icon: "Ξ", color: "bg-blue-500" },
  SOL: { name: "Solana", icon: "◎", color: "bg-purple-500" },
}

export function SendFundsModal({ isOpen, onClose, activeWallet }: SendFundsModalProps) {
  const [recipientAddress, setRecipientAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedChain, setSelectedChain] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
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

  const handleSend = async () => {
    if (!amount || !selectedChain) {
      setError("Please fill in amount and select a chain")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Simulate sending funds
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSuccess(true)
      toast({
        title: "Transaction Sent",
        description: `Successfully sent ${amount} ${selectedChain} to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`,
      })

      // Reset form after success
      setTimeout(() => {
        setRecipientAddress("")
        setAmount("")
        setSelectedChain("")
        setSuccess(false)
        onClose()
      }, 3000)
    } catch (err) {
      setError("Failed to send transaction")
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
            Send funds from your connected wallet to any address
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
                  <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="apple-input h-12"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="chain" className="text-sm font-medium">Currency</Label>
                  <Select value={selectedChain} onValueChange={setSelectedChain}>
                    <SelectTrigger className="apple-input h-12">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHAIN_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${config.color}`} />
                            {config.icon} {config.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  disabled={isLoading || !recipientAddress || !amount || !selectedChain}
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

