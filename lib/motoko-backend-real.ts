// Real Motoko Backend Integration
// This file provides TypeScript interfaces and functions to interact with the live Motoko backend

import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from './backend-idl';

export interface Transaction {
  id: string;
  userAddress: string;
  depositAddress: string;
  chain: ChainType;
  amount: number;
  status: TransactionStatus;
  createdAt: number;
  confirmedAt?: number;
  rewardSentAt?: number;
  fundingTxHash?: string;
  rewardTxHash?: string;
  explorerUrl?: string;
}

export type ChainType = 'ETH' | 'BTC' | 'SOL' | 'POLYGON' | 'ARBITRUM' | 'OPTIMISM';

export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'REWARD_SENT' | 'FAILED' | 'EXPIRED' | 'PAID';

export interface FundingRequest {
  userAddress: string;
  chain: ChainType;
  amount: number;
}

export interface FundingResponse {
  success: boolean;
  data?: {
    transactionId: string;
    depositAddress: string;
    qrData: string;
    expiresAt: number;
    minConfirmations: number;
  };
  error?: string;
}

export interface StatusResponse {
  success: boolean;
  data?: {
    status: TransactionStatus;
    confirmations: number;
    fundedAmount?: number;
    fundingTxHash?: string;
    rewardTxHash?: string;
    explorerUrl?: string;
  };
  error?: string;
}

export interface TransactionStats {
  totalTransactions: number;
  pendingTransactions: number;
  confirmedTransactions: number;
  rewardSentTransactions: number;
  failedTransactions: number;
  expiredTransactions: number;
  totalRewardAmount: number;
}

// Real Motoko Backend Service
export class MotokoBackendService {
  private static instance: MotokoBackendService;
  private canisterId: string = "y65zg-vaaaa-aaaap-anvnq-cai"; // Your live canister ID
  private agent!: HttpAgent;
  private actor: any;
  // Local placeholder storage (used when canister calls fail)
  private placeholders: Map<string, Transaction> = new Map();

  private constructor() {
    this.initializeCanister();
  }

  // Persist a locally-created placeholder to the canister by re-issuing a requestDeposit
  async persistPlaceholderToCanister(tx: Transaction): Promise<{ success: boolean; newId?: string; depositAddress?: string; qrData?: string; expiresAt?: number; minConfirmations?: number; error?: string }> {
    try {
      if (!this.actor) {
        throw new Error('Canister not initialized');
      }

      const result = await this.actor.requestDeposit({
        userAddress: tx.userAddress,
        chain: { [tx.chain]: null },
        amount: tx.amount,
      });

      if (result.Success) {
        // On success, remove local placeholder so the canister copy becomes the source of truth
        if (this.placeholders.has(tx.id)) {
          this.placeholders.delete(tx.id);
        }
        return {
          success: true,
          newId: String(result.Success.transactionId),
          depositAddress: String(result.Success.depositAddress),
          qrData: String(result.Success.qrData),
          expiresAt: Number(result.Success.expiresAt),
          minConfirmations: Number(result.Success.minConfirmations),
        };
      }

      return { success: false, error: String(result.Error || 'Unknown canister error') };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  isPlaceholder(txId: string): boolean {
    return txId.startsWith('ph_');
  }

  async persistPlaceholderById(txId: string): Promise<{ success: boolean; newId?: string; depositAddress?: string; qrData?: string; expiresAt?: number; minConfirmations?: number; error?: string }> {
    const tx = this.placeholders.get(txId);
    if (!tx) {
      return { success: false, error: 'Placeholder not found' };
    }
    return this.persistPlaceholderToCanister(tx);
  }

  public static getInstance(): MotokoBackendService {
    if (!MotokoBackendService.instance) {
      MotokoBackendService.instance = new MotokoBackendService();
    }
    return MotokoBackendService.instance;
  }

  private async initializeCanister() {
    try {
      // Create an HTTP agent
      this.agent = new HttpAgent({
        host: "https://ic0.app",
        verifyQuerySignatures: false,
      });

      // Create the actor
      this.actor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: this.canisterId,
      });
    } catch (error) {
      console.error('Failed to initialize Motoko canister:', error);
    }
  }

  // Request a deposit address for funding
  async requestDeposit(request: FundingRequest): Promise<FundingResponse> {
    try {
      if (!this.actor) {
        throw new Error('Canister not initialized');
      }

      console.log('Attempting to store transaction in canister:', request);
      const result = await this.actor.requestDeposit({
        userAddress: request.userAddress,
        chain: { [request.chain]: null },
        amount: request.amount,
      });

      console.log('Canister response:', result);

      if (result.Success) {
        console.log('Successfully stored in canister:', result.Success);
        return {
          success: true,
          data: {
            transactionId: result.Success.transactionId,
            depositAddress: result.Success.depositAddress,
            qrData: result.Success.qrData,
            expiresAt: Number(result.Success.expiresAt),
            minConfirmations: Number(result.Success.minConfirmations),
          },
        };
      } else {
        console.log('Canister rejected, creating placeholder:', result.Error);
        // Canister rejected – create a placeholder entry locally
        return this.createPlaceholder(request, result.Error || 'Canister Error');
      }
    } catch (error) {
      console.error('Error requesting deposit from canister:', error);
      // Network/other error – create a placeholder entry locally
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log('Creating placeholder due to error:', message);
      return this.createPlaceholder(request, message);
    }
  }

  // Check transaction status
  async checkStatus(transactionId: string): Promise<StatusResponse> {
    try {
      if (!this.actor) {
        throw new Error('Canister not initialized');
      }

      const result = await this.actor.checkStatus(transactionId);

      if (result.Success) {
        return {
          success: true,
          data: {
            status: this.mapMotokoStatus(result.Success.status),
            confirmations: Number(result.Success.confirmations),
            fundedAmount: result.Success.fundedAmount ? Number(result.Success.fundedAmount) : undefined,
            fundingTxHash: result.Success.fundingTxHash?.[0],
            rewardTxHash: result.Success.rewardTxHash?.[0],
            explorerUrl: result.Success.explorerUrl?.[0],
          },
        };
      } else {
        return {
          success: false,
          error: result.Error,
        };
      }
    } catch (error) {
      console.error('Error checking status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Send reward for confirmed transaction
  async sendReward(transactionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.actor) {
        throw new Error('Canister not initialized');
      }

      const result = await this.actor.sendReward(transactionId);

      if (result.ok) {
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      console.error('Error sending reward:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get transaction by ID
  async getTransaction(transactionId: string): Promise<Transaction | null> {
    try {
      if (!this.actor) {
        throw new Error('Canister not initialized');
      }

      const result = await this.actor.getTransaction(transactionId);
      
      if (result) {
        return this.mapMotokoTransaction(result);
      }
      return null;
    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  // Get all transactions
  async getAllTransactions(): Promise<Transaction[]> {
    try {
      if (!this.actor) {
        throw new Error('Canister not initialized');
      }

      const result = await this.actor.getAllTransactions();
      console.log('Raw backend result:', result);
      const onChain = result.map((tx: any) => {
        console.log('Mapping transaction:', tx);
        return this.mapMotokoTransaction(tx);
      });
      const local = Array.from(this.placeholders.values());
      // Merge (placeholders first so admins see pending entries even if canister later succeeds)
      return [...local, ...onChain];
    } catch (error) {
      console.error('Error getting all transactions:', error);
      // Fall back to local placeholders only
      return Array.from(this.placeholders.values());
    }
  }

  // Get transactions by user
  async getTransactionsByUser(userAddress: string): Promise<Transaction[]> {
    try {
      if (!this.actor) {
        throw new Error('Canister not initialized');
      }

      console.log('Getting transactions for user:', userAddress);
      
      // Try getTransactionsByUser first
      try {
        const result = await this.actor.getTransactionsByUser(userAddress);
        console.log('Raw user transactions result:', result);
        
        // Handle case where result might be empty or in unexpected format
        if (!result || !Array.isArray(result)) {
          console.log('No transactions found or invalid format');
          return [];
        }
        
        const mapped = result.map((tx: any) => {
          console.log('Mapping user transaction:', tx);
          return this.mapMotokoTransaction(tx);
        });
        console.log('Mapped user transactions:', mapped);
        return mapped;
      } catch (queryError) {
        console.warn('getTransactionsByUser failed, falling back to getAllTransactions:', queryError);
        
        // Fallback: Get all transactions and filter by user
        const allTransactions = await this.actor.getAllTransactions();
        console.log('All transactions for filtering:', allTransactions);
        
        const userTransactions = allTransactions.filter((tx: any) => {
          const mappedTx = this.mapMotokoTransaction(tx);
          return mappedTx.userAddress.toLowerCase() === userAddress.toLowerCase();
        });
        
        console.log('Filtered user transactions:', userTransactions);
        return userTransactions;
      }
    } catch (error) {
      console.error('Error getting user transactions:', error);
      return [];
    }
  }

  // Get transaction statistics
  async getTransactionStats(): Promise<TransactionStats> {
    try {
      if (!this.actor) {
        throw new Error('Canister not initialized');
      }

      const result = await this.actor.getTransactionStats();
      return {
        totalTransactions: Number(result.totalTransactions),
        pendingTransactions: Number(result.pendingTransactions),
        confirmedTransactions: Number(result.confirmedTransactions),
        rewardSentTransactions: Number(result.rewardSentTransactions),
        failedTransactions: Number(result.failedTransactions),
        expiredTransactions: Number(result.expiredTransactions),
        totalRewardAmount: Number(result.totalRewardAmount),
      };
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      return {
        totalTransactions: 0,
        pendingTransactions: 0,
        confirmedTransactions: 0,
        rewardSentTransactions: 0,
        failedTransactions: 0,
        expiredTransactions: 0,
        totalRewardAmount: 0,
      };
    }
  }

  // Get fixed receipt address
  async getFixedReceiptAddress(): Promise<string> {
    try {
      if (!this.actor) {
        throw new Error('Canister not initialized');
      }

      return await this.actor.getFixedReceiptAddress();
    } catch (error) {
      console.error('Error getting fixed receipt address:', error);
      return "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    }
  }

  // Get reward amount
  async getRewardAmount(): Promise<number> {
    try {
      if (!this.actor) {
        throw new Error('Canister not initialized');
      }

      return Number(await this.actor.getRewardAmount());
    } catch (error) {
      console.error('Error getting reward amount:', error);
      return 2.0;
    }
  }

  // Mark transaction as paid
  async markAsPaid(transactionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.actor) {
        throw new Error('Canister not initialized');
      }

      console.log('Attempting to mark transaction as paid:', transactionId);
      
      // Check if markAsPaid function exists
      if (typeof this.actor.markAsPaid !== 'function') {
        console.warn('markAsPaid function not available in canister');
        return { 
          success: false, 
          error: 'Mark as paid function not available. Please redeploy the canister.' 
        };
      }

      const result = await this.actor.markAsPaid(transactionId);
      console.log('Mark as paid result:', result);
      
      if (result.ok) {
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      console.error('Error marking transaction as paid:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Helper function to map Motoko status to TypeScript status
  private mapMotokoStatus(motokoStatus: any): TransactionStatus {
    console.log('Mapping status:', motokoStatus);
    
    if (!motokoStatus) return 'PENDING';
    
    // Handle variant format: {PENDING: null} or {PAID: null}
    if ('PENDING' in motokoStatus) return 'PENDING';
    if ('CONFIRMED' in motokoStatus) return 'CONFIRMED';
    if ('REWARD_SENT' in motokoStatus) return 'REWARD_SENT';
    if ('FAILED' in motokoStatus) return 'FAILED';
    if ('EXPIRED' in motokoStatus) return 'EXPIRED';
    if ('PAID' in motokoStatus) return 'PAID';
    
    // Handle string format
    if (typeof motokoStatus === 'string') {
      return motokoStatus as TransactionStatus;
    }
    
    console.warn('Unknown status format:', motokoStatus);
    return 'PENDING';
  }

  // Helper function to map Motoko chain to TypeScript chain
  private mapMotokoChain(motokoChain: any): ChainType {
    console.log('Mapping chain:', motokoChain);
    
    if (!motokoChain) return 'ETH';
    
    // Handle variant format: {ETH: null}, {SOL: null}, {BTC: null}
    if ('ETH' in motokoChain) return 'ETH';
    if ('BTC' in motokoChain) return 'BTC';
    if ('SOL' in motokoChain) return 'SOL';
    if ('POLYGON' in motokoChain) return 'POLYGON';
    if ('ARBITRUM' in motokoChain) return 'ARBITRUM';
    if ('OPTIMISM' in motokoChain) return 'OPTIMISM';
    
    // Handle string format
    if (typeof motokoChain === 'string') {
      return motokoChain as ChainType;
    }
    
    // Handle array format [chain, null]
    if (Array.isArray(motokoChain) && motokoChain.length > 0) {
      const chainName = motokoChain[0];
      if (typeof chainName === 'string') {
        return chainName as ChainType;
      }
    }
    
    console.warn('Unknown chain format:', motokoChain);
    return 'ETH';
  }

  // Helper function to map Motoko transaction to TypeScript transaction
  private mapMotokoTransaction(motokoTx: any): Transaction {
    // Convert nanoseconds to milliseconds for JavaScript Date
    const convertTime = (nanoseconds: number) => Math.floor(nanoseconds / 1_000_000);
    
    console.log('Mapping transaction data:', motokoTx);
    
    // The data is already in the correct format from the backend
    const id = motokoTx.id;
    const userAddress = motokoTx.userAddress;
    const depositAddress = motokoTx.depositAddress;
    const chain = motokoTx.chain;
    const amount = motokoTx.amount;
    const status = motokoTx.status;
    const createdAt = motokoTx.createdAt;
    const confirmedAt = motokoTx.confirmedAt;
    const rewardSentAt = motokoTx.rewardSentAt;
    const fundingTxHash = motokoTx.fundingTxHash;
    const rewardTxHash = motokoTx.rewardTxHash;
    const explorerUrl = motokoTx.explorerUrl;
    
    const mapped = {
      id: String(id || ''),
      userAddress: String(userAddress || ''),
      depositAddress: String(depositAddress || ''),
      chain: this.mapMotokoChain(chain),
      amount: Number(amount || 0),
      status: this.mapMotokoStatus(status),
      createdAt: createdAt ? convertTime(Number(createdAt)) : Date.now(),
      confirmedAt: confirmedAt && confirmedAt[0] ? convertTime(Number(confirmedAt[0])) : undefined,
      rewardSentAt: rewardSentAt && rewardSentAt[0] ? convertTime(Number(rewardSentAt[0])) : undefined,
      fundingTxHash: fundingTxHash && fundingTxHash[0] ? String(fundingTxHash[0]) : undefined,
      rewardTxHash: rewardTxHash && rewardTxHash[0] ? String(rewardTxHash[0]) : undefined,
      explorerUrl: explorerUrl && explorerUrl[0] ? String(explorerUrl[0]) : undefined,
    };
    
    console.log('Mapped transaction:', mapped);
    return mapped;
  }

  // Placeholder helpers
  private createPlaceholder(request: FundingRequest, reason: string): FundingResponse {
    const id = `ph_${Date.now()}`;
    const depositAddress = this.placeholderAddressFor(request.chain, request.userAddress);
    const now = Date.now();
    const tx: Transaction = {
      id,
      userAddress: request.userAddress,
      depositAddress,
      chain: request.chain,
      amount: request.amount,
      status: 'PENDING',
      createdAt: now,
      fundingTxHash: undefined,
      rewardTxHash: undefined,
      explorerUrl: undefined,
    };
    this.placeholders.set(id, tx);

    // Return a "successful" response so UI can proceed
    return {
      success: true,
      data: {
        transactionId: id,
        depositAddress,
        qrData: depositAddress,
        expiresAt: now + 30 * 60 * 1000,
        minConfirmations: 1,
      },
    };
  }

  private placeholderAddressFor(chain: ChainType, userAddress: string): string {
    switch (chain) {
      case 'ETH':
      case 'POLYGON':
      case 'ARBITRUM':
      case 'OPTIMISM':
        return '0xPLACEHOLDER_DEPOSIT_ADDRESS';
      case 'BTC':
        return 'bc1pplaceholderaddressxxxxxxxxxxxxxxxxxxxxxx';
      case 'SOL':
        return 'SoLPlaceHolder11111111111111111111111111111';
      default:
        return userAddress;
    }
  }
}
