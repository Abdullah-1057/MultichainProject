import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Solana wallet utilities and detection
export interface SolanaWallet {
  name: string
  icon: string
  isInstalled: boolean
  isConnected: boolean
  address?: string
  publicKey?: string
}

export interface SolanaTransactionParams {
  to: string
  amount: number // in SOL
}

export class SolanaWalletManager {
  private wallet: any = null
  private walletType: string = ''
  private connection: Connection
  private rpcEndpoints: string[] = [
    'https://api.mainnet-beta.solana.com',
    'https://api.devnet.solana.com'
  ]
  private currentEndpointIndex: number = 0

  constructor() {
    this.detectWallet()
    this.connection = this.createConnection()
  }

  private createConnection(): Connection {
    const endpoint = this.rpcEndpoints[this.currentEndpointIndex]
    return new Connection(endpoint, 'confirmed')
  }

  private async switchToNextEndpoint(): Promise<void> {
    this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.rpcEndpoints.length
    this.connection = this.createConnection()
    const endpoint = this.rpcEndpoints[this.currentEndpointIndex]
    console.log(`Switched to Solana RPC endpoint: ${endpoint}`)
    
    // Warn if switching to devnet
    if (endpoint.includes('devnet')) {
      console.warn('⚠️  WARNING: Switched to Solana devnet. This uses test tokens, not real SOL!')
    }
  }

  private detectWallet() {
    if (typeof window === 'undefined') return

    // Check for Phantom wallet
    if (window.phantom && window.phantom.solana) {
      this.wallet = window.phantom.solana
      this.walletType = 'phantom'
      return
    }

    // Check for Solflare wallet
    if (window.solflare) {
      this.wallet = window.solflare
      this.walletType = 'solflare'
      return
    }

    // Check for Sollet wallet
    if (window.sollet) {
      this.wallet = window.sollet
      this.walletType = 'sollet'
      return
    }

    // Check for Backpack wallet
    if (window.backpack) {
      this.wallet = window.backpack
      this.walletType = 'backpack'
      return
    }
  }

  async connect(): Promise<SolanaWallet> {
    if (!this.wallet) {
      throw new Error('No Solana wallet detected')
    }

    try {
      let address: string
      let publicKey: string

      if (this.walletType === 'phantom') {
        const response = await this.wallet.connect()
        address = response.publicKey.toString()
        publicKey = response.publicKey.toString()
      } else if (this.walletType === 'solflare') {
        const response = await this.wallet.connect()
        address = response.publicKey.toString()
        publicKey = response.publicKey.toString()
      } else if (this.walletType === 'sollet') {
        const response = await this.wallet.connect()
        address = response.publicKey.toString()
        publicKey = response.publicKey.toString()
      } else if (this.walletType === 'backpack') {
        const response = await this.wallet.connect()
        address = response.publicKey.toString()
        publicKey = response.publicKey.toString()
      } else {
        throw new Error('Unsupported wallet type')
      }

      return {
        name: this.getWalletName(),
        icon: this.getWalletIcon(),
        isInstalled: true,
        isConnected: true,
        address,
        publicKey
      }
    } catch (error) {
      throw new Error(`Failed to connect Solana wallet: ${error}`)
    }
  }

  async sendTransaction(params: SolanaTransactionParams): Promise<string> {
    if (!this.wallet) {
      throw new Error('Solana wallet not connected')
    }

    const maxRetries = this.rpcEndpoints.length
    let lastError: any = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Get the public key from the connected wallet
        const fromPublicKey = this.wallet.publicKey
        if (!fromPublicKey) {
          throw new Error('No public key available from wallet')
        }

        // Convert SOL to lamports
        const lamports = Math.floor(params.amount * LAMPORTS_PER_SOL)

        // Validate recipient address
        console.log('Validating Solana address:', params.to)
        if (!this.validateAddress(params.to)) {
          console.error('Invalid Solana address format:', params.to)
          throw new Error(`Invalid recipient address: ${params.to}. Expected Base58 format with 32-44 characters.`)
        }

        const toPublicKey = new PublicKey(params.to)

        // Create a new transaction
        const transaction = new Transaction()

        // Add the transfer instruction
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: fromPublicKey,
            toPubkey: toPublicKey,
            lamports: lamports,
          })
        )

        // Get recent blockhash with retry logic
        const { blockhash } = await this.getRecentBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = fromPublicKey

        // Sign and send the transaction
        const { signature } = await this.wallet.signAndSendTransaction(transaction)
        
        // Wait for confirmation
        await this.connection.confirmTransaction(signature, 'confirmed')
        
        return signature
      } catch (error: any) {
        lastError = error
        console.error(`Solana transaction attempt ${attempt + 1} failed:`, error)
        
        // Check if it's an RPC error that we can retry
        if (this.isRpcError(error) && attempt < maxRetries - 1) {
          console.log('RPC error detected, switching to next endpoint...')
          await this.switchToNextEndpoint()
          continue
        }
        
        // If it's not an RPC error or we've exhausted all endpoints, throw the error
        break
      }
    }

    throw new Error(`Solana transaction failed after ${maxRetries} attempts: ${lastError}`)
  }

  private async getRecentBlockhash(): Promise<{ blockhash: string }> {
    try {
      return await this.connection.getLatestBlockhash()
    } catch (error: any) {
      if (this.isRpcError(error)) {
        console.log('getRecentBlockhash failed, switching endpoint...')
        await this.switchToNextEndpoint()
        return await this.connection.getLatestBlockhash()
      }
      throw error
    }
  }

  private isRpcError(error: any): boolean {
    if (!error) return false
    const message = error.message || error.toString()
    const errorString = message.toLowerCase()
    
    return errorString.includes('403') || 
           errorString.includes('401') ||
           errorString.includes('access forbidden') || 
           errorString.includes('invalid api key') ||
           errorString.includes('rate limit') ||
           errorString.includes('timeout') ||
           errorString.includes('econnreset') ||
           errorString.includes('enotfound') ||
           errorString.includes('fetch failed') ||
           errorString.includes('network error') ||
           errorString.includes('connection refused') ||
           errorString.includes('502') ||
           errorString.includes('503') ||
           errorString.includes('504') ||
           errorString.includes('-32401') // JSON-RPC error code for invalid API key
  }

  // Alternative method for sending SOL (simpler approach)
  async sendSOL(params: SolanaTransactionParams): Promise<string> {
    return this.sendTransaction(params)
  }

  async getBalance(): Promise<number> {
    if (!this.wallet) {
      throw new Error('Solana wallet not connected')
    }

    const maxRetries = this.rpcEndpoints.length
    let lastError: any = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const publicKey = this.wallet.publicKey
        if (!publicKey) {
          throw new Error('No public key available from wallet')
        }

        // Get balance from the network
        const balance = await this.connection.getBalance(publicKey)
        return balance / LAMPORTS_PER_SOL // Convert lamports to SOL
      } catch (error: any) {
        lastError = error
        console.error(`Get balance attempt ${attempt + 1} failed:`, error)
        
        // Check if it's an RPC error that we can retry
        if (this.isRpcError(error) && attempt < maxRetries - 1) {
          console.log('RPC error detected, switching to next endpoint...')
          await this.switchToNextEndpoint()
          continue
        }
        
        // If it's not an RPC error or we've exhausted all endpoints, throw the error
        break
      }
    }

    throw new Error(`Failed to get balance after ${maxRetries} attempts: ${lastError}`)
  }

  validateAddress(address: string): boolean {
    // Basic Solana address validation (Base58, 32-44 characters)
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
    return solanaAddressRegex.test(address)
  }

  private getWalletName(): string {
    switch (this.walletType) {
      case 'phantom': return 'Phantom'
      case 'solflare': return 'Solflare'
      case 'sollet': return 'Sollet'
      case 'backpack': return 'Backpack'
      default: return 'Solana Wallet'
    }
  }

  private getWalletIcon(): string {
    switch (this.walletType) {
      case 'phantom': return '👻'
      case 'solflare': return '🔥'
      case 'sollet': return '🟡'
      case 'backpack': return '🎒'
      default: return '🟡'
    }
  }

  isWalletInstalled(): boolean {
    return this.wallet !== null
  }

  getWalletType(): string {
    return this.walletType
  }

  getNetwork(): string {
    return 'mainnet-beta' // or 'devnet' for testing
  }

  // Get connection for external use
  getConnection(): Connection {
    return this.connection
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    if (this.wallet && this.wallet.disconnect) {
      await this.wallet.disconnect()
    }
    this.wallet = null
    this.walletType = ''
  }
}

// Global Solana wallet interfaces
declare global {
  interface Window {
    phantom?: {
      solana?: any
    }
    solflare?: any
    sollet?: any
    backpack?: any
  }
}




