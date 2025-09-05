import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import QRCode from 'qrcode.react'
import { formatDistanceToNow } from 'date-fns'
import { Copy, Clock, CheckCircle, Wallet, Send } from 'lucide-react'

function App() {
  // Contract addresses - UPDATE THESE AFTER DEPLOYMENT
  const FACTORY_ADDRESS = '0x0000000000000000000000000000000000000000' // Update after deployment
  const ADMIN_ADDRESS = '0x23f8F22bC0ED154a9eA7cB581c6E15eD93Be9708' // Your admin address
  
  const [userAccount, setUserAccount] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [currentDepositAddress, setCurrentDepositAddress] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [hourBucket, setHourBucket] = useState('')
  const [factoryContract, setFactoryContract] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('0.001')

  // Factory contract ABI
  const FACTORY_ABI = [
    "function predictAddress(bytes32 salt) external view returns (address)",
    "function createForwarder(bytes32 salt) external returns (address)",
    "function getForwarder(bytes32 salt) external view returns (address)"
  ]

  // Initialize contract
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined' && FACTORY_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider)
      setFactoryContract(contract)
    }
  }, [])

  // Generate deterministic deposit address for current hour
  const generateHourlyDepositAddress = async (hourBucket) => {
    if (!factoryContract) {
      console.warn('Factory contract not deployed, using admin address')
      return ADMIN_ADDRESS
    }

    try {
      setIsLoading(true)
      setError('')
      
      // Create salt from hour bucket
      const salt = ethers.keccak256(ethers.toUtf8Bytes(`hour_${hourBucket}`))
      
      // Check if forwarder exists
      let forwarderAddress = await factoryContract.getForwarder(salt)
      
      if (forwarderAddress === '0x0000000000000000000000000000000000000000') {
        // Create new forwarder for this hour
        const signer = await new ethers.BrowserProvider(window.ethereum).getSigner()
        const factoryWithSigner = factoryContract.connect(signer)
        
        // Estimate gas for contract creation
        const gasEstimate = await factoryWithSigner.createForwarder.estimateGas(salt)
        const gasLimit = gasEstimate * 120n / 100n // Add 20% buffer
        
        const tx = await factoryWithSigner.createForwarder(salt, {
          gasLimit: gasLimit
        })
        
        console.log('Creating forwarder, tx hash:', tx.hash)
        const receipt = await tx.wait()
        
        if (receipt.status !== 1) {
          throw new Error('Transaction failed')
        }
        
        forwarderAddress = await factoryContract.getForwarder(salt)
        console.log('Forwarder created at:', forwarderAddress)
      }
      
      return forwarderAddress
    } catch (error) {
      console.error('Error generating address:', error)
      setError(`Failed to generate address: ${error.message}`)
      // Fallback to admin address
      return ADMIN_ADDRESS
    } finally {
      setIsLoading(false)
    }
  }

  // Get current hour bucket
  const getCurrentHourBucket = () => {
    const now = new Date()
    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const day = String(now.getUTCDate()).padStart(2, '0')
    const hour = String(now.getUTCHours()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hour}:00:00Z`
  }

  // Calculate time left in current hour
  const calculateTimeLeft = () => {
    const now = new Date()
    const nextHour = new Date(now)
    nextHour.setUTCHours(now.getUTCHours() + 1, 0, 0, 0)
    
    return Math.max(0, Math.floor((nextHour - now) / 1000))
  }

  // Connect user wallet
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        setUserAccount(accounts[0])
        setIsConnected(true)
      } catch (error) {
        console.error('Failed to connect wallet:', error)
        alert('Failed to connect wallet. Please try again.')
      }
    } else {
      alert('MetaMask is not installed. Please install MetaMask to continue.')
    }
  }

  // Generate new deposit address for current hour
  const generateDepositAddress = async () => {
    const currentHour = getCurrentHourBucket()
    const depositAddress = await generateHourlyDepositAddress(currentHour)
    
    setCurrentDepositAddress(depositAddress)
    setHourBucket(currentHour)
  }

  // Send payment from user to admin
  const sendPayment = async () => {
    if (!userAccount || !currentDepositAddress) return

    try {
      setIsLoading(true)
      setError('')
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      // Validate payment amount
      const amount = ethers.parseEther(paymentAmount)
      if (amount <= 0) {
        throw new Error('Invalid payment amount')
      }
      
      // Get user's balance
      const balance = await provider.getBalance(userAccount)
      
      if (balance < amount) {
        throw new Error(`Insufficient balance. You need at least ${paymentAmount} ETH.`)
      }

      // Estimate gas for transaction
      const gasEstimate = await provider.estimateGas({
        to: currentDepositAddress,
        value: amount
      })
      const gasLimit = gasEstimate * 120n / 100n // Add 20% buffer

      // Send transaction
      const tx = await signer.sendTransaction({
        to: currentDepositAddress,
        value: amount,
        gasLimit: gasLimit
      })

      console.log('Payment sent, tx hash:', tx.hash)
      
      // Wait for confirmation
      const receipt = await tx.wait()
      
      if (receipt.status !== 1) {
        throw new Error('Transaction failed')
      }
      
      alert(`Payment successful! Transaction hash: ${tx.hash}`)
      
    } catch (error) {
      console.error('Payment failed:', error)
      setError(`Payment failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Copy address to clipboard
  const copyAddress = () => {
    navigator.clipboard.writeText(currentDepositAddress)
    alert('Deposit address copied to clipboard!')
  }

  // Update time left every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Generate deposit address on load
  useEffect(() => {
    generateDepositAddress()
  }, [])

  // Regenerate deposit address every hour
  useEffect(() => {
    const interval = setInterval(() => {
      generateDepositAddress()
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  // Generate address when user connects
  useEffect(() => {
    if (isConnected) {
      generateDepositAddress()
    }
  }, [isConnected])

  // Generate address when contract is ready
  useEffect(() => {
    if (factoryContract) {
      generateDepositAddress()
    }
  }, [factoryContract])

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Payment App
          </h1>
          <p className="text-gray-600">
            Connect wallet and send payment to rotating address
          </p>
        </div>

        {!isConnected ? (
          <div className="text-center">
            <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <button
              onClick={connectWallet}
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Connect MetaMask
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Connect your wallet to make a payment
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connected Status */}
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Wallet Connected</span>
            </div>

            {/* User Account */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Your Account</p>
              <p className="font-mono text-sm text-gray-800">
                {userAccount.slice(0, 6)}...{userAccount.slice(-4)}
              </p>
            </div>

            {/* Current Deposit Address */}
            {currentDepositAddress && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Payment Address (Changes Every Hour)</p>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono text-sm text-gray-800 flex-1">
                      {currentDepositAddress}
                    </p>
                    <button
                      onClick={copyAddress}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                    >
                      <Copy className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* QR Code */}
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <QRCode value={currentDepositAddress} size={200} />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Scan to send payment</p>
                </div>

                {/* Payment Amount Input */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Payment Amount (ETH)</p>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.001"
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Send Payment Button */}
                <button
                  onClick={sendPayment}
                  disabled={isLoading || !paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Send {paymentAmount} ETH Payment</span>
                    </>
                  )}
                </button>

                {/* Time Left */}
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-blue-600 mb-2">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">Time Left in Current Hour</span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-blue-800">
                    {formatTime(timeLeft)}
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    New address will be generated automatically
                  </p>
                </div>

                {/* Hour Bucket */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Current Hour Bucket</p>
                  <p className="font-mono text-sm text-gray-800">
                    {hourBucket}
                  </p>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generateDepositAddress}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Refresh Address
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Connect wallet and send payment</p>
          <p>Address changes every hour for security</p>
          <p>Funds will be received by admin automatically</p>
        </div>

        {/* Contract Warning */}
        {FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000' && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm font-medium">⚠️ Contract Not Deployed</p>
            <p className="text-yellow-700 text-xs mt-1">
              Update FACTORY_ADDRESS in src/App.jsx after deploying contracts
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
