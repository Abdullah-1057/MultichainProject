'use client';

import { BitcoinWalletType } from '@/types/wallet';

export interface BitcoinTransaction {
  to: string;
  amount: number; // in satoshis
  feeRate?: number; // satoshis per byte
}

export interface BitcoinWalletInfo {
  type: BitcoinWalletType;
  address: string;
  balance: number; // in satoshis
  isConnected: boolean;
}

export class BitcoinWalletManager {
  private walletType: BitcoinWalletType | null = null;
  private address: string | null = null;
  private isConnected = false;

  constructor() {
    this.detectWallets();
  }

  // Detect available Bitcoin wallets
  detectWallets(): BitcoinWalletType[] {
    const wallets: BitcoinWalletType[] = [];
    
    if (typeof window !== 'undefined') {
      // Check for Unisat wallet
      if (window.unisat) {
        wallets.push('unisat');
      }
      
      // Check for Xverse wallet
      if (window.xverse) {
        wallets.push('xverse');
      }
      
      // Check for Leather wallet
      if (window.leather) {
        wallets.push('leather');
      }
      
      // Check for OKX Bitcoin wallet
      if ((window as any).okxwallet?.bitcoin) {
        wallets.push('okx');
      }
    }
    
    return wallets;
  }

  // Connect to a specific Bitcoin wallet
  async connectWallet(walletType: BitcoinWalletType): Promise<BitcoinWalletInfo> {
    try {
      switch (walletType) {
        case 'unisat':
          return await this.connectUnisat();
        case 'xverse':
          return await this.connectXverse();
        case 'leather':
          return await this.connectLeather();
        case 'okx':
          return await this.connectOKX();
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }
    } catch (error) {
      console.error('Bitcoin wallet connection error:', error);
      throw error;
    }
  }

  // Connect to Unisat wallet
  private async connectUnisat(): Promise<BitcoinWalletInfo> {
    if (!window.unisat) {
      throw new Error('Unisat wallet not found. Please install Unisat wallet.');
    }

    try {
      // Request account access
      const accounts = await window.unisat.requestAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in Unisat wallet');
      }

      const address = accounts[0];
      
      // Get balance
      const balance = await this.getBalance(address);

      this.walletType = 'unisat';
      this.address = address;
      this.isConnected = true;

      return {
        type: 'unisat',
        address,
        balance,
        isConnected: true
      };
    } catch (error) {
      throw new Error(`Failed to connect Unisat wallet: ${error}`);
    }
  }

  // Connect to Xverse wallet
  private async connectXverse(): Promise<BitcoinWalletInfo> {
    if (!window.xverse) {
      throw new Error('Xverse wallet not found. Please install Xverse wallet.');
    }

    try {
      // Request account access
      const response = await window.xverse.request('getAccounts', {});
      if (!response.result || response.result.length === 0) {
        throw new Error('No accounts found in Xverse wallet');
      }

      const address = response.result[0];
      
      // Get balance
      const balance = await this.getBalance(address);

      this.walletType = 'xverse';
      this.address = address;
      this.isConnected = true;

      return {
        type: 'xverse',
        address,
        balance,
        isConnected: true
      };
    } catch (error) {
      throw new Error(`Failed to connect Xverse wallet: ${error}`);
    }
  }

  // Connect to Leather wallet
  private async connectLeather(): Promise<BitcoinWalletInfo> {
    if (!window.leather) {
      throw new Error('Leather wallet not found. Please install Leather wallet.');
    }

    try {
      // Request account access
      const response = await window.leather.request('getAccounts', {});
      if (!response.result || response.result.length === 0) {
        throw new Error('No accounts found in Leather wallet');
      }

      const address = response.result[0];
      
      // Get balance
      const balance = await this.getBalance(address);

      this.walletType = 'leather';
      this.address = address;
      this.isConnected = true;

      return {
        type: 'leather',
        address,
        balance,
        isConnected: true
      };
    } catch (error) {
      throw new Error(`Failed to connect Leather wallet: ${error}`);
    }
  }

  // Connect to OKX Bitcoin wallet
  private async connectOKX(): Promise<BitcoinWalletInfo> {
    if (!(window as any).okxwallet?.bitcoin) {
      throw new Error('OKX Bitcoin wallet not found. Please install OKX wallet.');
    }

    try {
      // Request account access
      const accounts = await (window as any).okxwallet.bitcoin.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in OKX wallet');
      }

      const address = accounts[0];
      
      // Get balance
      const balance = await this.getBalance(address);

      this.walletType = 'okx';
      this.address = address;
      this.isConnected = true;

      return {
        type: 'okx',
        address,
        balance,
        isConnected: true
      };
    } catch (error) {
      throw new Error(`Failed to connect OKX wallet: ${error}`);
    }
  }

  // Get Bitcoin balance for an address
  async getBalance(address: string): Promise<number> {
    try {
      const response = await fetch(`https://blockstream.info/api/address/${address}`);
      const data = await response.json();
      return data.chain_stats?.funded_txo_sum || 0;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  // Send Bitcoin transaction
  async sendTransaction(transaction: BitcoinTransaction): Promise<string> {
    if (!this.isConnected || !this.walletType || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      switch (this.walletType) {
        case 'unisat':
          return await this.sendUnisatTransaction(transaction);
        case 'xverse':
          return await this.sendXverseTransaction(transaction);
        case 'leather':
          return await this.sendLeatherTransaction(transaction);
        case 'okx':
          return await this.sendOKXTransaction(transaction);
        default:
          throw new Error(`Unsupported wallet type: ${this.walletType}`);
      }
    } catch (error) {
      console.error('Bitcoin transaction error:', error);
      throw error;
    }
  }

  // Send transaction via Unisat
  private async sendUnisatTransaction(transaction: BitcoinTransaction): Promise<string> {
    if (!window.unisat) {
      throw new Error('Unisat wallet not available');
    }

    try {
      // Get UTXOs
      const utxos = await window.unisat.getUtxos();
      if (utxos.length === 0) {
        throw new Error('No UTXOs available for transaction');
      }

      // Send Bitcoin transaction
      const txid = await window.unisat.sendBitcoin(transaction.to, transaction.amount);
      return txid;
    } catch (error) {
      throw new Error(`Unisat transaction failed: ${error}`);
    }
  }

  // Send transaction via Xverse
  private async sendXverseTransaction(transaction: BitcoinTransaction): Promise<string> {
    if (!window.xverse) {
      throw new Error('Xverse wallet not available');
    }

    try {
      const response = await window.xverse.request('sendTransfer', {
        recipients: [{
          address: transaction.to,
          amount: transaction.amount
        }]
      });

      return response.result.txid;
    } catch (error) {
      throw new Error(`Xverse transaction failed: ${error}`);
    }
  }

  // Send transaction via Leather
  private async sendLeatherTransaction(transaction: BitcoinTransaction): Promise<string> {
    if (!window.leather) {
      throw new Error('Leather wallet not available');
    }

    try {
      const response = await window.leather.request('sendTransfer', {
        recipients: [{
          address: transaction.to,
          amount: transaction.amount
        }]
      });

      return response.result.txid;
    } catch (error) {
      throw new Error(`Leather transaction failed: ${error}`);
    }
  }

  // Send transaction via OKX
  private async sendOKXTransaction(transaction: BitcoinTransaction): Promise<string> {
    if (!(window as any).okxwallet?.bitcoin) {
      throw new Error('OKX wallet not available');
    }

    try {
      const response = await (window as any).okxwallet.bitcoin.sendBitcoin({
        to: transaction.to,
        amount: transaction.amount
      });

      return response.txid;
    } catch (error) {
      throw new Error(`OKX transaction failed: ${error}`);
    }
  }

  // Disconnect wallet
  disconnect(): void {
    this.walletType = null;
    this.address = null;
    this.isConnected = false;
  }

  // Get current wallet info
  getWalletInfo(): BitcoinWalletInfo | null {
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

  // Validate Bitcoin address
  validateAddress(address: string): boolean {
    // Basic Bitcoin address validation
    const bitcoinRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/;
    return bitcoinRegex.test(address);
  }

  // Convert BTC to satoshis
  btcToSatoshis(btc: number): number {
    return Math.floor(btc * 100000000);
  }

  // Convert satoshis to BTC
  satoshisToBtc(satoshis: number): number {
    return satoshis / 100000000;
  }
}

// Export singleton instance
export const bitcoinWalletManager = new BitcoinWalletManager();
