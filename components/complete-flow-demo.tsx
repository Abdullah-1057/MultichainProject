"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, AlertCircle, Wallet, Send, Database, Trophy } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { useToast } from "@/hooks/use-toast"
import { RealBlockchainService } from "@/lib/real-blockchain-service"
import { MotokoBackendService } from "@/lib/motoko-backend"

interface FlowStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  details?: string
}

export function CompleteFlowDemo() {
  const { isConnected, address, walletName, walletIcon } = useWallet()
  const [currentStep, setCurrentStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [canisterData, setCanisterData] = useState<any>(null)
  const { toast } = useToast()

  const [steps, setSteps] = useState<FlowStep[]>([
    {
      id: 'connect',
      title: 'Connect Wallet',
      description: 'User connects their MetaMask wallet',
      icon: <Wallet className="h-5 w-5" />,
      status: 'pending'
    },
    {
      id: 'select',
      title: 'Select Currency',
      description: 'User selects ETH on Ethereum network',
      icon: <Send className="h-5 w-5" />,
      status: 'pending'
    },
    {
      id: 'send',
      title: 'Send Transaction',
      description: 'User sends ETH from MetaMask to reward address',
      icon: <Send className="h-5 w-5" />,
      status: 'pending'
    },
    {
      id: 'store',
      title: 'Store on Canister',
      description: 'Transaction data is stored on ICP canister',
      icon: <Database className="h-5 w-5" />,
      status: 'pending'
    },
    {
      id: 'reward',
      title: 'Send Reward',
      description: 'System sends reward tokens to user',
      icon: <Trophy className="h-5 w-5" />,
      status: 'pending'
    }
  ])

  const updateStepStatus = (stepId: string, status: FlowStep['status'], details?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, details }
        : step
    ))
  }

  const startCompleteFlow = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    setCurrentStep(0)

    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('This feature requires a browser environment')
      }
      // Step 1: Wallet is already connected
      updateStepStatus('connect', 'completed', `Connected: ${walletName}`)
      setCurrentStep(1)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 2: Select currency (ETH)
      updateStepStatus('select', 'in_progress', 'Selecting ETH on Ethereum network')
      await new Promise(resolve => setTimeout(resolve, 1000))
      updateStepStatus('select', 'completed', 'Selected: ETH on Ethereum')
      setCurrentStep(2)

      // Step 3: Send transaction
      updateStepStatus('send', 'in_progress', 'Sending ETH transaction...')
      
      const blockchainService = RealBlockchainService.getInstance()
      const recipientAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" // Fixed reward address
      const amount = 0.001 // Small amount for demo
      
      const txResult = await blockchainService.sendEVMTransaction(
        address,
        recipientAddress,
        amount,
        'ETH',
        undefined // Native ETH, no token address
      )

      setTxHash(txResult.txHash)
      updateStepStatus('send', 'completed', `Transaction sent: ${txResult.txHash.slice(0, 10)}...`)
      setCurrentStep(3)

      // Step 4: Store on canister
      updateStepStatus('store', 'in_progress', 'Storing transaction data on ICP canister...')
      
      const motokoBackend = MotokoBackendService.getInstance()
      const depositResponse = await motokoBackend.requestDeposit({
        userAddress: address,
        chain: 'ETH',
        amount: amount * 2000 // Convert to USD (assuming $2000/ETH)
      })

      if (depositResponse.success) {
        setCanisterData(depositResponse.data)
        updateStepStatus('store', 'completed', `Stored on canister: ${depositResponse.data?.transactionId}`)
      } else {
        throw new Error(depositResponse.error || 'Failed to store on canister')
      }
      setCurrentStep(4)

      // Step 5: Send reward
      updateStepStatus('reward', 'in_progress', 'Sending reward tokens...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (depositResponse.data?.transactionId) {
        const rewardResponse = await motokoBackend.sendReward(depositResponse.data.transactionId)
        if (rewardResponse.success) {
          updateStepStatus('reward', 'completed', 'Reward sent successfully!')
        } else {
          throw new Error(rewardResponse.error || 'Failed to send reward')
        }
      }

      toast({
        title: "Complete Flow Successful!",
        description: "All steps completed successfully. Check the transaction on Etherscan.",
      })

    } catch (error: any) {
      console.error('Flow error:', error)
      updateStepStatus(steps[currentStep].id, 'error', error.message)
      
      toast({
        title: "Flow Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const resetFlow = () => {
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending', details: undefined })))
    setCurrentStep(0)
    setTxHash(null)
    setCanisterData(null)
  }

  const getStepIcon = (step: FlowStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return step.icon || <Clock className="h-5 w-5" />
    }
  }

  const getStepColor = (step: FlowStep) => {
    switch (step.status) {
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'in_progress':
        return 'border-blue-200 bg-blue-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="space-y-6">
      <Card className="apple-card apple-shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl apple-heading flex items-center gap-2">
            <span className="text-2xl">{walletIcon || '👛'}</span>
            Complete Flow Demo
          </CardTitle>
          <CardDescription className="apple-text">
            Experience the complete user flow: Connect wallet → Select ETH → Send from MetaMask → Store on canister → Receive reward
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Wallet Status */}
          {!isConnected ? (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700">
                Please connect your wallet to start the demo
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Wallet connected: {walletName} ({address?.slice(0, 6)}...{address?.slice(-4)})
              </AlertDescription>
            </Alert>
          )}

          {/* Flow Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <Card key={step.id} className={`transition-all duration-300 ${getStepColor(step)}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getStepIcon(step)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{step.title}</h3>
                        <Badge variant={step.status === 'completed' ? 'default' : step.status === 'error' ? 'destructive' : 'secondary'}>
                          {step.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                      {step.details && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{step.details}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Transaction Details */}
          {txHash && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">Transaction Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Transaction Hash:</span>
                    <p className="font-mono text-sm break-all">{txHash}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://etherscan.io/tx/${txHash}`, '_blank')}
                  >
                    View on Etherscan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Canister Data */}
          {canisterData && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-lg">Canister Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Transaction ID:</span>
                    <p className="font-mono text-sm">{canisterData.transactionId}</p>
                  </div>
                  <div>
                    <span className="font-medium">Deposit Address:</span>
                    <p className="font-mono text-sm">{canisterData.depositAddress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={startCompleteFlow}
              disabled={!isConnected || isProcessing}
              className="flex-1 apple-button"
            >
              {isProcessing ? "Processing..." : "Start Complete Flow"}
            </Button>
            <Button
              onClick={resetFlow}
              variant="outline"
              className="apple-button-secondary"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
