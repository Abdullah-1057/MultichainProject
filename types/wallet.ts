// Wallet Types
export type EVMWalletType = 'metamask' | 'coinbase' | 'okx' | 'trust';
export type SolanaWalletType = 'phantom' | 'solflare' | 'sollet' | 'backpack';
export type BitcoinWalletType = 'unisat' | 'xverse' | 'leather' | 'okx';

export type WalletType = EVMWalletType | SolanaWalletType | BitcoinWalletType;

// Chain Types
export type EVMChain = 'ethereum' | 'base' | 'polygon' | 'arbitrum' | 'optimism';
export type SolanaChain = 'solana';
export type BitcoinChain = 'bitcoin';

export type ChainType = EVMChain | SolanaChain | BitcoinChain;

// Wallet Info Interfaces
export interface BaseWalletInfo {
  type: WalletType;
  address: string;
  isConnected: boolean;
}

export interface EVMWalletInfo extends BaseWalletInfo {
  type: EVMWalletType;
  balance: string; // in wei
  chainId: number;
}

export interface SolanaWalletInfo extends BaseWalletInfo {
  type: SolanaWalletType;
  balance: number; // in lamports
}

export interface BitcoinWalletInfo extends BaseWalletInfo {
  type: BitcoinWalletType;
  balance: number; // in satoshis
}

export type WalletInfo = EVMWalletInfo | SolanaWalletInfo | BitcoinWalletInfo;

// Transaction Interfaces
export interface BaseTransaction {
  to: string;
  amount: string | number;
}

export interface EVMTransaction extends BaseTransaction {
  to: string;
  amount: string; // in wei
  gasLimit?: string;
  gasPrice?: string;
  data?: string;
}

export interface SolanaTransaction extends BaseTransaction {
  to: string;
  amount: number; // in lamports
  memo?: string;
}

export interface BitcoinTransaction extends BaseTransaction {
  to: string;
  amount: number; // in satoshis
  feeRate?: number;
}

export type Transaction = EVMTransaction | SolanaTransaction | BitcoinTransaction;

// Chain Configurations
export interface ChainConfig {
  name: string;
  symbol: string;
  icon: string;
  chainId?: number;
  rpcUrl: string;
  explorer: string;
  decimals: number;
  minAmount: number;
  color: string;
}

export const CHAIN_CONFIGS: Record<ChainType, ChainConfig> = {
  ethereum: {
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '⟠',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
    decimals: 18,
    minAmount: 0.001,
    color: 'bg-blue-500'
  },
  base: {
    name: 'Base',
    symbol: 'ETH',
    icon: '🔵',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    decimals: 18,
    minAmount: 0.001,
    color: 'bg-blue-600'
  },
  polygon: {
    name: 'Polygon',
    symbol: 'MATIC',
    icon: '⬟',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    decimals: 18,
    minAmount: 0.01,
    color: 'bg-purple-500'
  },
  arbitrum: {
    name: 'Arbitrum',
    symbol: 'ETH',
    icon: '🔷',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    decimals: 18,
    minAmount: 0.001,
    color: 'bg-cyan-500'
  },
  optimism: {
    name: 'Optimism',
    symbol: 'ETH',
    icon: '🔴',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    explorer: 'https://optimistic.etherscan.io',
    decimals: 18,
    minAmount: 0.001,
    color: 'bg-red-500'
  },
  solana: {
    name: 'Solana',
    symbol: 'SOL',
    icon: '◎',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorer: 'https://explorer.solana.com',
    decimals: 9,
    minAmount: 0.001,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500'
  },
  bitcoin: {
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: '₿',
    rpcUrl: 'https://blockstream.info/api',
    explorer: 'https://blockstream.info',
    decimals: 8,
    minAmount: 0.0001,
    color: 'bg-orange-500'
  }
};

// Wallet Detection
export interface WalletDetection {
  evm: EVMWalletType[];
  solana: SolanaWalletType[];
  bitcoin: BitcoinWalletType[];
}

// Error Types
export class WalletError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'WalletError';
  }
}

export class TransactionError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'TransactionError';
  }
}

// Utility Types
export type WalletManager = 'evm' | 'solana' | 'bitcoin';

export interface WalletManagerInterface {
  detectWallets(): WalletType[];
  connectWallet(walletType: WalletType, ...args: any[]): Promise<WalletInfo>;
  sendTransaction(transaction: Transaction): Promise<string>;
  disconnect(): void;
  getWalletInfo(): WalletInfo | null;
  validateAddress(address: string): boolean;
}


