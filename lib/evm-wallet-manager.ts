'use client';

import { EVMWalletType, EVMChain } from '@/types/wallet';

export interface EVMTransaction {
  to: string;
  amount: string; // in wei
  gasLimit?: string;
  gasPrice?: string;
  data?: string;
}

export interface EVMWalletInfo {
  type: EVMWalletType;
  address: string;
  balance: string; // in wei
  chainId: number;
  isConnected: boolean;
}

export class EVMWalletManager {
  private walletType: EVMWalletType | null = null;
  private address: string | null = null;
  private chainId: number | null = null;
  private isConnected = false;
  private provider: any = null;

  constructor() {
    this.detectWallets();
  }

  // Detect available EVM wallets
  detectWallets(): EVMWalletType[] {
    const wallets: EVMWalletType[] = [];
    
    if (typeof window !== 'undefined') {
      // Check for MetaMask
      if (window.ethereum?.isMetaMask) {
        wallets.push('metamask');
      }
      
      // Check for Coinbase Wallet
      if (window.ethereum?.isCoinbaseWallet) {
        wallets.push('coinbase');
      }
      
      // Check for OKX Wallet
      if ((window as any).okxwallet?.ethereum) {
        wallets.push('okx');
      }
      
      // Check for Trust Wallet
      if ((window as any).trust) {
        wallets.push('trust');
      }
    }
    
    return wallets;
  }

  // Connect to a specific EVM wallet
  async connectWallet(walletType: EVMWalletType, chainId?: number): Promise<EVMWalletInfo> {
    try {
      switch (walletType) {
        case 'metamask':
          return await this.connectMetaMask(chainId);
        case 'coinbase':
          return await this.connectCoinbase(chainId);
        case 'okx':
          return await this.connectOKX(chainId);
        case 'trust':
          return await this.connectTrust(chainId);
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }
    } catch (error) {
      console.error('EVM wallet connection error:', error);
      throw error;
    }
  }

  // Connect to MetaMask
  private async connectMetaMask(chainId?: number): Promise<EVMWalletInfo> {
    if (!window.ethereum?.isMetaMask) {
      throw new Error('MetaMask wallet not found. Please install MetaMask.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in MetaMask');
      }

      const address = accounts[0];
      const currentChainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
      
      // Switch chain if needed
      if (chainId && currentChainId !== chainId) {
        await this.switchChain(chainId);
      }

      // Get balance
      const balance = await this.getBalance(address);

      this.walletType = 'metamask';
      this.address = address;
      this.chainId = chainId || currentChainId;
      this.isConnected = true;
      this.provider = window.ethereum;

      return {
        type: 'metamask',
        address,
        balance,
        chainId: this.chainId,
        isConnected: true
      };
    } catch (error) {
      throw new Error(`Failed to connect MetaMask: ${error}`);
    }
  }

  // Connect to Coinbase Wallet
  private async connectCoinbase(chainId?: number): Promise<EVMWalletInfo> {
    if (!window.ethereum?.isCoinbaseWallet) {
      throw new Error('Coinbase Wallet not found. Please install Coinbase Wallet.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in Coinbase Wallet');
      }

      const address = accounts[0];
      const currentChainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
      
      // Switch chain if needed
      if (chainId && currentChainId !== chainId) {
        await this.switchChain(chainId);
      }

      // Get balance
      const balance = await this.getBalance(address);

      this.walletType = 'coinbase';
      this.address = address;
      this.chainId = chainId || currentChainId;
      this.isConnected = true;
      this.provider = window.ethereum;

      return {
        type: 'coinbase',
        address,
        balance,
        chainId: this.chainId,
        isConnected: true
      };
    } catch (error) {
      throw new Error(`Failed to connect Coinbase Wallet: ${error}`);
    }
  }

  // Connect to OKX Wallet
  private async connectOKX(chainId?: number): Promise<EVMWalletInfo> {
    if (!(window as any).okxwallet?.ethereum) {
      throw new Error('OKX Wallet not found. Please install OKX Wallet.');
    }

    try {
      // Request account access
      const accounts = await (window as any).okxwallet.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in OKX Wallet');
      }

      const address = accounts[0];
      const currentChainId = parseInt(await (window as any).okxwallet.ethereum.request({ method: 'eth_chainId' }), 16);
      
      // Switch chain if needed
      if (chainId && currentChainId !== chainId) {
        await this.switchChain(chainId);
      }

      // Get balance
      const balance = await this.getBalance(address);

      this.walletType = 'okx';
      this.address = address;
      this.chainId = chainId || currentChainId;
      this.isConnected = true;
      this.provider = (window as any).okxwallet.ethereum;

      return {
        type: 'okx',
        address,
        balance,
        chainId: this.chainId,
        isConnected: true
      };
    } catch (error) {
      throw new Error(`Failed to connect OKX Wallet: ${error}`);
    }
  }

  // Connect to Trust Wallet
  private async connectTrust(chainId?: number): Promise<EVMWalletInfo> {
    if (!(window as any).trust) {
      throw new Error('Trust Wallet not found. Please install Trust Wallet.');
    }

    try {
      // Request account access
      const accounts = await (window as any).trust.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in Trust Wallet');
      }

      const address = accounts[0];
      const currentChainId = parseInt(await (window as any).trust.request({ method: 'eth_chainId' }), 16);
      
      // Switch chain if needed
      if (chainId && currentChainId !== chainId) {
        await this.switchChain(chainId);
      }

      // Get balance
      const balance = await this.getBalance(address);

      this.walletType = 'trust';
      this.address = address;
      this.chainId = chainId || currentChainId;
      this.isConnected = true;
      this.provider = (window as any).trust;

      return {
        type: 'trust',
        address,
        balance,
        chainId: this.chainId,
        isConnected: true
      };
    } catch (error) {
      throw new Error(`Failed to connect Trust Wallet: ${error}`);
    }
  }

  // Switch to a different chain
  async switchChain(chainId: number): Promise<void> {
    if (!this.provider) {
      throw new Error('No wallet connected');
    }

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      // If chain doesn't exist, add it
      if (error.code === 4902) {
        await this.addChain(chainId);
      } else {
        throw error;
      }
    }
  }

  // Add a new chain
  private async addChain(chainId: number): Promise<void> {
    const chainConfig = this.getChainConfig(chainId);
    if (!chainConfig) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    await this.provider.request({
      method: 'wallet_addEthereumChain',
      params: [chainConfig],
    });
  }

  // Get chain configuration
  private getChainConfig(chainId: number): any {
    const chains: { [key: number]: any } = {
      1: {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://eth.llamarpc.com'],
        blockExplorerUrls: ['https://etherscan.io']
      },
      8453: {
        chainId: '0x2105',
        chainName: 'Base',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.base.org'],
        blockExplorerUrls: ['https://basescan.org']
      },
      137: {
        chainId: '0x89',
        chainName: 'Polygon',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://polygon-rpc.com'],
        blockExplorerUrls: ['https://polygonscan.com']
      },
      42161: {
        chainId: '0xa4b1',
        chainName: 'Arbitrum One',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://arb1.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://arbiscan.io']
      },
      10: {
        chainId: '0xa',
        chainName: 'Optimism',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.optimism.io'],
        blockExplorerUrls: ['https://optimistic.etherscan.io']
      }
    };

    return chains[chainId];
  }

  // Get EVM balance for an address
  async getBalance(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error('No wallet connected');
    }

    try {
      const balance = await this.provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      return balance;
    } catch (error) {
      console.error('Error fetching EVM balance:', error);
      return '0x0';
    }
  }

  // Send EVM transaction
  async sendTransaction(transaction: EVMTransaction): Promise<string> {
    if (!this.isConnected || !this.provider || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      // Estimate gas if not provided
      let gasLimit = transaction.gasLimit;
      if (!gasLimit) {
        gasLimit = await this.provider.request({
          method: 'eth_estimateGas',
          params: [{
            from: this.address,
            to: transaction.to,
            value: transaction.amount,
            data: transaction.data || '0x'
          }]
        });
      }

      // Get gas price if not provided
      let gasPrice = transaction.gasPrice;
      if (!gasPrice) {
        gasPrice = await this.provider.request({
          method: 'eth_gasPrice'
        });
      }

      // Send transaction
      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: this.address,
          to: transaction.to,
          value: transaction.amount,
          gas: gasLimit,
          gasPrice: gasPrice,
          data: transaction.data || '0x'
        }]
      });

      return txHash;
    } catch (error) {
      console.error('EVM transaction error:', error);
      throw error;
    }
  }

  // Disconnect wallet
  disconnect(): void {
    this.walletType = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
    this.provider = null;
  }

  // Get current wallet info
  getWalletInfo(): EVMWalletInfo | null {
    if (!this.isConnected || !this.walletType || !this.address || !this.chainId) {
      return null;
    }

    return {
      type: this.walletType,
      address: this.address,
      balance: '0x0', // Will be updated when needed
      chainId: this.chainId,
      isConnected: true
    };
  }

  // Validate EVM address
  validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Convert ETH to wei
  ethToWei(eth: string): string {
    const wei = BigInt(Math.floor(parseFloat(eth) * 1e18));
    return '0x' + wei.toString(16);
  }

  // Convert wei to ETH
  weiToEth(wei: string): string {
    const weiBigInt = BigInt(wei);
    const eth = Number(weiBigInt) / 1e18;
    return eth.toString();
  }
}

// Export singleton instance
export const evmWalletManager = new EVMWalletManager();


