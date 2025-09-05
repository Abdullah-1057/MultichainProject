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

  constructor() {
    this.detectWallet()
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

    try {
      // Convert SOL to lamports
      const lamports = Math.floor(params.amount * 1000000000)

      // Create a simple transfer transaction
      const transaction = {
        to: params.to,
        amount: lamports
      }

      // Send transaction using wallet's method
      const { signature } = await this.wallet.signAndSendTransaction(transaction)
      return signature
    } catch (error) {
      throw new Error(`Solana transaction failed: ${error}`)
    }
  }

  async getBalance(): Promise<number> {
    if (!this.wallet) {
      throw new Error('Solana wallet not connected')
    }

    try {
      let balance: number

      if (this.walletType === 'phantom') {
        const response = await this.wallet.getBalance()
        balance = response / 1000000000 // Convert lamports to SOL
      } else if (this.walletType === 'solflare') {
        const response = await this.wallet.getBalance()
        balance = response / 1000000000
      } else if (this.walletType === 'sollet') {
        const response = await this.wallet.getBalance()
        balance = response / 1000000000
      } else if (this.walletType === 'backpack') {
        const response = await this.wallet.getBalance()
        balance = response / 1000000000
      } else {
        throw new Error('Unsupported wallet type')
      }

      return balance
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`)
    }
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




