"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'

interface WalletContextType {
  // Connection state
  isConnected: boolean
  address: string | undefined
  chainId: number | undefined
  connector: any
  
  // Wallet management
  connectWallet: (walletType: 'metamask' | 'walletconnect' | 'coinbase' | 'oisy') => Promise<void>
  disconnectWallet: () => void
  switchChain: (chainId: number) => Promise<void>
  
  // Wallet info
  walletName: string
  walletIcon: string
  
  // Error handling
  error: string | null
  clearError: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { address, isConnected, chainId, connector } = useAccount()
  const { connect, connectors, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { signMessage } = useSignMessage()
  
  const [error, setError] = useState<string | null>(null)
  const [walletName, setWalletName] = useState('')
  const [walletIcon, setWalletIcon] = useState('')

  // Clear error when connection succeeds
  useEffect(() => {
    if (isConnected && connectError) {
      setError(null)
    }
  }, [isConnected, connectError])

  // Set wallet info when connected
  useEffect(() => {
    if (isConnected && connector) {
      setWalletName(connector.name)
      setWalletIcon(getWalletIcon(connector.name))
    }
  }, [isConnected, connector])

  const getWalletIcon = (name: string): string => {
    switch (name.toLowerCase()) {
      case 'metamask':
        return '🦊'
      case 'walletconnect':
        return '🔗'
      case 'coinbase wallet':
        return '🔵'
      case 'oisy':
        return '🌊'
      default:
        return '👛'
    }
  }

  const connectWallet = async (walletType: 'metamask' | 'walletconnect' | 'coinbase' | 'oisy') => {
    try {
      setError(null)
      
      let targetConnector
      
      switch (walletType) {
        case 'metamask':
          targetConnector = connectors.find(c => c.name === 'MetaMask') || injected()
          break
        case 'walletconnect':
          targetConnector = connectors.find(c => c.name === 'WalletConnect') || walletConnect({
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
            showQrModal: true,
          })
          break
        case 'coinbase':
          targetConnector = connectors.find(c => c.name === 'Coinbase Wallet') || coinbaseWallet({
            appName: 'FundFlow',
            appLogoUrl: '/placeholder-logo.png',
          })
          break
        case 'oisy':
          // Oisy wallet integration - you'll need to add the specific connector
          targetConnector = connectors.find(c => c.name === 'Oisy') || injected()
          break
        default:
          throw new Error('Unsupported wallet type')
      }
      
      await connect({ connector: targetConnector })
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet')
      throw err
    }
  }

  const disconnectWallet = () => {
    try {
      disconnect()
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect wallet')
    }
  }

  const switchChain = async (newChainId: number) => {
    try {
      if (!connector) throw new Error('No wallet connected')
      
      await connector.switchChain?.(newChainId)
    } catch (err: any) {
      setError(err.message || 'Failed to switch chain')
      throw err
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value: WalletContextType = {
    isConnected,
    address,
    chainId,
    connector,
    connectWallet,
    disconnectWallet,
    switchChain,
    walletName,
    walletIcon,
    error: error || connectError?.message || null,
    clearError,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

