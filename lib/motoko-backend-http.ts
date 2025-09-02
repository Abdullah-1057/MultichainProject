// HTTP-based Motoko Backend Integration
// This file provides TypeScript interfaces and functions to interact with the live Motoko backend via HTTP

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

export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'REWARD_SENT' | 'FAILED' | 'EXPIRED';

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

// HTTP-based Motoko Backend Service
export class MotokoBackendService {
  private static instance: MotokoBackendService;
  private canisterId: string = "y65zg-vaaaa-aaaap-anvnq-cai"; // Your live canister ID
  private baseUrl: string = "https://ic0.app/api/v2/canister";

  private constructor() {}

  public static getInstance(): MotokoBackendService {
    if (!MotokoBackendService.instance) {
      MotokoBackendService.instance = new MotokoBackendService();
    }
    return MotokoBackendService.instance;
  }

  // Helper method to make HTTP calls to the canister
  private async callCanister(method: string, args: any[] = []): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.canisterId}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/cbor',
        },
        body: this.encodeCandidCall(method, args),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.arrayBuffer();
      return this.decodeCandidResponse(result);
    } catch (error) {
      console.error(`Error calling canister method ${method}:`, error);
      throw error;
    }
  }

  // Simplified Candid encoding (for demo purposes)
  private encodeCandidCall(method: string, args: any[]): ArrayBuffer {
    // This is a simplified implementation
    // In production, you'd use proper Candid encoding
    const data = {
      method,
      args: args.map(arg => this.serializeArg(arg))
    };
    
    const jsonString = JSON.stringify(data);
    return new TextEncoder().encode(jsonString);
  }

  // Simplified Candid decoding (for demo purposes)
  private decodeCandidResponse(buffer: ArrayBuffer): any {
    // This is a simplified implementation
    // In production, you'd use proper Candid decoding
    const jsonString = new TextDecoder().decode(buffer);
    return JSON.parse(jsonString);
  }

  // Serialize arguments for Candid
  private serializeArg(arg: any): any {
    if (typeof arg === 'object' && arg !== null) {
      if (arg.ETH !== undefined) return { ETH: null };
      if (arg.BTC !== undefined) return { BTC: null };
      if (arg.SOL !== undefined) return { SOL: null };
      if (arg.POLYGON !== undefined) return { POLYGON: null };
      if (arg.ARBITRUM !== undefined) return { ARBITRUM: null };
      if (arg.OPTIMISM !== undefined) return { OPTIMISM: null };
      if (arg.PENDING !== undefined) return { PENDING: null };
      if (arg.CONFIRMED !== undefined) return { CONFIRMED: null };
      if (arg.REWARD_SENT !== undefined) return { REWARD_SENT: null };
      if (arg.FAILED !== undefined) return { FAILED: null };
      if (arg.EXPIRED !== undefined) return { EXPIRED: null };
    }
    return arg;
  }

  // Request a deposit address for funding
  async requestDeposit(request: FundingRequest): Promise<FundingResponse> {
    try {
      const result = await this.callCanister('requestDeposit', [{
        userAddress: request.userAddress,
        chain: { [request.chain]: null },
        amount: request.amount,
      }]);

      if (result.Success) {
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
        return {
          success: false,
          error: result.Error,
        };
      }
    } catch (error) {
      console.error('Error requesting deposit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Check transaction status
  async checkStatus(transactionId: string): Promise<StatusResponse> {
    try {
      const result = await this.callCanister('checkStatus', [transactionId]);

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
      const result = await this.callCanister('sendReward', [transactionId]);

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
      const result = await this.callCanister('getTransaction', [transactionId]);
      
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
      const result = await this.callCanister('getAllTransactions', []);
      return result.map((tx: any) => this.mapMotokoTransaction(tx));
    } catch (error) {
      console.error('Error getting all transactions:', error);
      return [];
    }
  }

  // Get transactions by user
  async getTransactionsByUser(userAddress: string): Promise<Transaction[]> {
    try {
      const result = await this.callCanister('getTransactionsByUser', [userAddress]);
      return result.map((tx: any) => this.mapMotokoTransaction(tx));
    } catch (error) {
      console.error('Error getting user transactions:', error);
      return [];
    }
  }

  // Get transaction statistics
  async getTransactionStats(): Promise<TransactionStats> {
    try {
      const result = await this.callCanister('getTransactionStats', []);
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
      return await this.callCanister('getFixedReceiptAddress', []);
    } catch (error) {
      console.error('Error getting fixed receipt address:', error);
      return "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    }
  }

  // Get reward amount
  async getRewardAmount(): Promise<number> {
    try {
      return Number(await this.callCanister('getRewardAmount', []));
    } catch (error) {
      console.error('Error getting reward amount:', error);
      return 2.0;
    }
  }

  // Helper function to map Motoko status to TypeScript status
  private mapMotokoStatus(motokoStatus: any): TransactionStatus {
    if (motokoStatus.PENDING) return 'PENDING';
    if (motokoStatus.CONFIRMED) return 'CONFIRMED';
    if (motokoStatus.REWARD_SENT) return 'REWARD_SENT';
    if (motokoStatus.FAILED) return 'FAILED';
    if (motokoStatus.EXPIRED) return 'EXPIRED';
    return 'PENDING';
  }

  // Helper function to map Motoko chain to TypeScript chain
  private mapMotokoChain(motokoChain: any): ChainType {
    if (motokoChain.ETH) return 'ETH';
    if (motokoChain.BTC) return 'BTC';
    if (motokoChain.SOL) return 'SOL';
    if (motokoChain.POLYGON) return 'POLYGON';
    if (motokoChain.ARBITRUM) return 'ARBITRUM';
    if (motokoChain.OPTIMISM) return 'OPTIMISM';
    return 'ETH';
  }

  // Helper function to map Motoko transaction to TypeScript transaction
  private mapMotokoTransaction(motokoTx: any): Transaction {
    return {
      id: motokoTx.id,
      userAddress: motokoTx.userAddress,
      depositAddress: motokoTx.depositAddress,
      chain: this.mapMotokoChain(motokoTx.chain),
      amount: Number(motokoTx.amount),
      status: this.mapMotokoStatus(motokoTx.status),
      createdAt: Number(motokoTx.createdAt),
      confirmedAt: motokoTx.confirmedAt?.[0] ? Number(motokoTx.confirmedAt[0]) : undefined,
      rewardSentAt: motokoTx.rewardSentAt?.[0] ? Number(motokoTx.rewardSentAt[0]) : undefined,
      fundingTxHash: motokoTx.fundingTxHash?.[0],
      rewardTxHash: motokoTx.rewardTxHash?.[0],
      explorerUrl: motokoTx.explorerUrl?.[0],
    };
  }
}
