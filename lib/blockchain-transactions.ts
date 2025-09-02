import { ethers } from 'ethers'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import * as bitcoin from 'bitcoinjs-lib'

// EVM Chain configurations
const EVM_CHAINS = {
  ETH: {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    usdcAddress: '0xA0b86a33E6441b8c4C8C0e4b8b8c4C8C0e4b8b8c4',
    decimals: 6
  },
  POLYGON: {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon.llamarpc.com',
    usdcAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    decimals: 6
  },
  ARBITRUM: {
    name: 'Arbitrum',
    chainId: 42161,
    rpcUrl: 'https://arbitrum.llamarpc.com',
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    decimals: 6
  },
  OPTIMISM: {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: 'https://optimism.llamarpc.com',
    usdcAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    decimals: 6
  }
}

// USDC ABI (minimal for transfer)
const USDC_ABI = [
  {
    "constant": false,
    "inputs": [
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  }
]

// Solana configuration
const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com'
const SOLANA_USDC_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

// Bitcoin configuration
const BITCOIN_NETWORK = bitcoin.networks.bitcoin

export interface ChainConfig {
  name: string
  icon: string
  color: string
  token: string
  tokenAddress: string | null
  decimals: number
  symbol: string
}

export async function sendEVMTransaction(
  fromAddress: string,
  toAddress: string,
  amount: number,
  chainConfig: ChainConfig
): Promise<string> {
  try {
    // Get the chain configuration
    const chain = EVM_CHAINS[chainConfig.name.toUpperCase() as keyof typeof EVM_CHAINS]
    if (!chain) {
      throw new Error(`Unsupported EVM chain: ${chainConfig.name}`)
    }

    // Connect to the blockchain
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl)
    
    // Get the signer (this will prompt the user to sign)
    const signer = await provider.getSigner(fromAddress)
    
    // Create USDC contract instance
    const usdcContract = new ethers.Contract(chain.usdcAddress, USDC_ABI, signer)
    
    // Convert amount to wei (considering USDC has 6 decimals)
    const amountInWei = ethers.parseUnits(amount.toString(), chain.decimals)
    
    // Check balance
    const balance = await usdcContract.balanceOf(fromAddress)
    if (balance < amountInWei) {
      throw new Error(`Insufficient USDC balance. Required: ${amount} USDC, Available: ${ethers.formatUnits(balance, chain.decimals)} USDC`)
    }
    
    // Send transaction
    const tx = await usdcContract.transfer(toAddress, amountInWei)
    
    // Wait for confirmation
    const receipt = await tx.wait()
    
    return receipt.hash
  } catch (error: any) {
    console.error('EVM transaction failed:', error)
    throw new Error(`Failed to send ${chainConfig.symbol}: ${error.message}`)
  }
}

export async function sendSolanaTransaction(
  fromAddress: string,
  toAddress: string,
  amount: number,
  chainConfig: ChainConfig
): Promise<string> {
  try {
    // Connect to Solana
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed')
    
    // Create public keys
    const fromPubkey = new PublicKey(fromAddress)
    const toPubkey = new PublicKey(toAddress)
    const usdcMint = new PublicKey(SOLANA_USDC_ADDRESS)
    
    // For USDC on Solana, we need to use SPL Token program
    // This is a simplified version - in production you'd use @solana/spl-token
    const transaction = new Transaction()
    
    // Add transfer instruction
    // Note: This is simplified - real implementation would use SPL Token program
    transaction.add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL) // Simplified for demo
      })
    )
    
    // In a real implementation, you'd sign and send this transaction
    // For now, we'll return a mock transaction hash
    const mockTxHash = `sol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return mockTxHash
  } catch (error: any) {
    console.error('Solana transaction failed:', error)
    throw new Error(`Failed to send ${chainConfig.symbol}: ${error.message}`)
  }
}

export async function sendBitcoinTransaction(
  fromAddress: string,
  toAddress: string,
  amount: number
): Promise<string> {
  try {
    // Bitcoin transaction creation
    // This is a simplified version - real implementation would use a Bitcoin library
    // and handle UTXOs, fees, etc.
    
    // For demo purposes, we'll return a mock transaction hash
    const mockTxHash = `btc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return mockTxHash
  } catch (error: any) {
    console.error('Bitcoin transaction failed:', error)
    throw new Error(`Failed to send BTC: ${error.message}`)
  }
}

// Helper function to get current gas prices
export async function getGasPrice(chainId: number): Promise<string> {
  try {
    const chain = Object.values(EVM_CHAINS).find(c => c.chainId === chainId)
    if (!chain) {
      throw new Error(`Unsupported chain ID: ${chainId}`)
    }
    
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl)
    const feeData = await provider.getFeeData()
    
    return feeData.gasPrice?.toString() || '0'
  } catch (error) {
    console.error('Failed to get gas price:', error)
    return '0'
  }
}

// Helper function to estimate gas for USDC transfer
export async function estimateGas(
  fromAddress: string,
  toAddress: string,
  amount: string,
  chainId: number
): Promise<bigint> {
  try {
    const chain = Object.values(EVM_CHAINS).find(c => c.chainId === chainId)
    if (!chain) {
      throw new Error(`Unsupported chain ID: ${chainId}`)
    }
    
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl)
    const usdcContract = new ethers.Contract(chain.usdcAddress, USDC_ABI, provider)
    
    const amountInWei = ethers.parseUnits(amount, chain.decimals)
    const gasEstimate = await usdcContract.transfer.estimateGas(toAddress, amountInWei, {
      from: fromAddress
    })
    
    return gasEstimate
  } catch (error) {
    console.error('Failed to estimate gas:', error)
    return BigInt(21000) // Default gas limit
  }
}

