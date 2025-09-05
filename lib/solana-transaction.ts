// Solana transaction utilities
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'

export interface SolanaTransactionParams {
  from: string
  to: string
  amount: number // in SOL
}

export class SolanaTransactionHandler {
  private connection: Connection

  constructor(rpcUrl: string = 'https://api.mainnet-beta.solana.com') {
    this.connection = new Connection(rpcUrl, 'confirmed')
  }

  async createTransferTransaction(params: SolanaTransactionParams): Promise<Transaction> {
    const { from, to, amount } = params

    // Convert SOL to lamports
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL)

    // Create transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: new PublicKey(from),
      toPubkey: new PublicKey(to),
      lamports: lamports,
    })

    // Create transaction
    const transaction = new Transaction().add(transferInstruction)

    return transaction
  }

  async sendTransaction(transaction: Transaction, wallet: any): Promise<string> {
    try {
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash

      // Set fee payer
      transaction.feePayer = wallet.publicKey

      // Sign and send transaction
      const { signature } = await wallet.signAndSendTransaction(transaction)
      
      return signature
    } catch (error) {
      throw new Error(`Solana transaction failed: ${error}`)
    }
  }

  async getBalance(address: string): Promise<number> {
    try {
      const publicKey = new PublicKey(address)
      const balance = await this.connection.getBalance(publicKey)
      return balance / LAMPORTS_PER_SOL
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`)
    }
  }

  async validateAddress(address: string): Promise<boolean> {
    try {
      new PublicKey(address)
      return true
    } catch {
      return false
    }
  }
}

// Bitcoin transaction utilities
export interface BitcoinTransactionParams {
  from: string
  to: string
  amount: number // in BTC
}

export class BitcoinTransactionHandler {
  async sendTransaction(params: BitcoinTransactionParams, wallet: any): Promise<string> {
    try {
      // Convert BTC to satoshis
      const satoshis = Math.floor(params.amount * 100000000)

      // Send transaction using wallet
      const txHash = await wallet.sendBitcoin(params.to, satoshis)
      
      return txHash
    } catch (error) {
      throw new Error(`Bitcoin transaction failed: ${error}`)
    }
  }

  async getBalance(wallet: any): Promise<number> {
    try {
      const balance = await wallet.getBalance()
      return balance / 100000000 // Convert satoshis to BTC
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`)
    }
  }

  validateAddress(address: string): boolean {
    // Basic Bitcoin address validation
    const btcAddressRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/
    return btcAddressRegex.test(address)
  }
}




