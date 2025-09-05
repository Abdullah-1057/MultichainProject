'use client';

import { SolanaWalletType } from '@/types/wallet';

export interface SolanaTransaction {
  to: string;
  amount: number; // in lamports
  memo?: string;
}

export interface SolanaWalletInfo {
  type: SolanaWalletType;
  address: string;
  balance: number; // in lamports
  isConnected: boolean;
}

export class SolanaWalletManager {
  private walletType: SolanaWalletType | null = null;
  private address: string | null = null;
  private isConnected = false;
  private connection: any = null;

  constructor() {
    this.initializeConnection();
  }

  // Initialize Solana connection
  private async initializeConnection() {
    if (typeof window !== 'undefined') {
      try {
        const { Connection, clusterApiUrl } = await import('@solana/web3.js');
        this.connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
      } catch (error) {
        console.error('Failed to initialize Solana connection:', error);
      }
    }
  }

  // Detect available Solana wallets
  detectWallets(): SolanaWalletType[] {
    const wallets: SolanaWalletType[] = [];
    
    if (typeof window !== 'undefined') {
      // Check for Phantom wallet
      if (window.phantom?.solana) {
        wallets.push('phantom');
      }
      
      // Check for Solflare wallet
      if ((window as any).solflare) {
        wallets.push('solflare');
      }
      
      // Check for Sollet wallet
      if ((window as any).sollet) {
        wallets.push('sollet');
      }
      
      // Check for Backpack wallet
      if ((window as any).backpack) {
        wallets.push('backpack');
      }
    }
    
    return wallets;
  }

  // Connect to a specific Solana wallet
  async connectWallet(walletType: SolanaWalletType): Promise<SolanaWalletInfo> {
    try {
      switch (walletType) {
        case 'phantom':
          return await this.connectPhantom();
        case 'solflare':
          return await this.connectSolflare();
        case 'sollet':
          return await this.connectSollet();
        case 'backpack':
          return await this.connectBackpack();
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }
    } catch (error) {
      console.error('Solana wallet connection error:', error);
      throw error;
    }
  }

  // Connect to Phantom wallet
  private async connectPhantom(): Promise<SolanaWalletInfo> {
    if (!window.phantom?.solana) {
      throw new Error('Phantom wallet not found. Please install Phantom wallet.');
    }

    try {
      const response = await window.phantom.solana.connect();
      const address = response.publicKey.toString();
      
      // Get balance
      const balance = await this.getBalance(address);

      this.walletType = 'phantom';
      this.address = address;
      this.isConnected = true;

      return {
        type: 'phantom',
        address,
        balance,
        isConnected: true
      };
    } catch (error) {
      throw new Error(`Failed to connect Phantom wallet: ${error}`);
    }
  }

  // Connect to Solflare wallet
  private async connectSolflare(): Promise<SolanaWalletInfo> {
    if (!(window as any).solflare) {
      throw new Error('Solflare wallet not found. Please install Solflare wallet.');
    }

    try {
      const response = await (window as any).solflare.connect();
      const address = response.publicKey.toString();
      
      // Get balance
      const balance = await this.getBalance(address);

      this.walletType = 'solflare';
      this.address = address;
      this.isConnected = true;

      return {
        type: 'solflare',
        address,
        balance,
        isConnected: true
      };
    } catch (error) {
      throw new Error(`Failed to connect Solflare wallet: ${error}`);
    }
  }

  // Connect to Sollet wallet
  private async connectSollet(): Promise<SolanaWalletInfo> {
    if (!(window as any).sollet) {
      throw new Error('Sollet wallet not found. Please install Sollet wallet.');
    }

    try {
      const response = await (window as any).sollet.connect();
      const address = response.publicKey.toString();
      
      // Get balance
      const balance = await this.getBalance(address);

      this.walletType = 'sollet';
      this.address = address;
      this.isConnected = true;

      return {
        type: 'sollet',
        address,
        balance,
        isConnected: true
      };
    } catch (error) {
      throw new Error(`Failed to connect Sollet wallet: ${error}`);
    }
  }

  // Connect to Backpack wallet
  private async connectBackpack(): Promise<SolanaWalletInfo> {
    if (!(window as any).backpack) {
      throw new Error('Backpack wallet not found. Please install Backpack wallet.');
    }

    try {
      const response = await (window as any).backpack.connect();
      const address = response.publicKey.toString();
      
      // Get balance
      const balance = await this.getBalance(address);

      this.walletType = 'backpack';
      this.address = address;
      this.isConnected = true;

      return {
        type: 'backpack',
        address,
        balance,
        isConnected: true
      };
    } catch (error) {
      throw new Error(`Failed to connect Backpack wallet: ${error}`);
    }
  }

  // Get Solana balance for an address
  async getBalance(address: string): Promise<number> {
    if (!this.connection) {
      throw new Error('Solana connection not initialized');
    }

    try {
      const { PublicKey } = await import('@solana/web3.js');
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return balance;
    } catch (error) {
      console.error('Error fetching Solana balance:', error);
      return 0;
    }
  }

  // Send Solana transaction
  async sendTransaction(transaction: SolanaTransaction): Promise<string> {
    if (!this.isConnected || !this.walletType || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
      
      const tx = new Transaction();
      const toPublicKey = new PublicKey(transaction.to);
      const fromPublicKey = new PublicKey(this.address);
      
      // Add transfer instruction
      tx.add(
        SystemProgram.transfer({
          fromPubkey: fromPublicKey,
          toPubkey: toPublicKey,
          lamports: transaction.amount
        })
      );

      // Add memo if provided
      if (transaction.memo) {
        const { createMemoInstruction } = await import('@solana/spl-memo');
        tx.add(createMemoInstruction(transaction.memo));
      }

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = fromPublicKey;

      // Sign and send transaction
      let signed;
      switch (this.walletType) {
        case 'phantom':
          signed = await (window as any)?.phantom?.solana?.signTransaction(tx);
          break;
        case 'solflare':
          signed = await (window as any).solflare.signTransaction(tx);
          break;
        case 'sollet':
          signed = await (window as any).sollet.signTransaction(tx);
          break;
        case 'backpack':
          signed = await (window as any).backpack.signTransaction(tx);
          break;
        default:
          throw new Error(`Unsupported wallet type: ${this.walletType}`);
      }

      const signature = await this.connection.sendRawTransaction(signed.serialize());
      await this.connection.confirmTransaction(signature);
      
      return signature;
    } catch (error) {
      console.error('Solana transaction error:', error);
      throw error;
    }
  }

  // Disconnect wallet
  disconnect(): void {
    this.walletType = null;
    this.address = null;
    this.isConnected = false;
  }

  // Get current wallet info
  getWalletInfo(): SolanaWalletInfo | null {
    if (!this.isConnected || !this.walletType || !this.address) {
      return null;
    }

    return {
      type: this.walletType,
      address: this.address,
      balance: 0, // Will be updated when needed
      isConnected: true
    };
  }

  // Validate Solana address
  validateAddress(address: string): boolean {
    try {
      const { PublicKey } = require('@solana/web3.js');
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  // Convert SOL to lamports
  solToLamports(sol: number): number {
    return Math.floor(sol * 1000000000);
  }

  // Convert lamports to SOL
  lamportsToSol(lamports: number): number {
    return lamports / 1000000000;
  }
}

// Export singleton instance
export const solanaWalletManager = new SolanaWalletManager();
