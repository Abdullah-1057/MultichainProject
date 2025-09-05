// Wallet extension types
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
    
    phantom?: {
      solana?: {
        isPhantom?: boolean;
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
        disconnect: () => Promise<void>;
        signTransaction: (transaction: any) => Promise<any>;
        signAllTransactions: (transactions: any[]) => Promise<any[]>;
        publicKey?: { toString: () => string };
      };
    };
    
    unisat?: {
      requestAccounts: () => Promise<string[]>;
      getAccounts: () => Promise<string[]>;
      getUtxos: () => Promise<any[]>;
      sendBitcoin: (to: string, amount: number) => Promise<string>;
      signPsbt: (psbt: string) => Promise<string>;
    };
    
    xverse?: {
      request: (method: string, params?: any) => Promise<{ result: any }>;
    };
    
    okxwallet?: {
      ethereum?: {
        isOKXWallet?: boolean;
        request: (args: { method: string; params?: any[] }) => Promise<any>;
      };
      bitcoin?: {
        getAccounts: () => Promise<string[]>;
        sendBitcoin: (params: { to: string; amount: number }) => Promise<{ txid: string }>;
      };
    };
    
    leather?: {
      request: (method: string, params?: any) => Promise<{ result: any }>;
    };
    
    bitget?: {
      request: (method: string, params?: any) => Promise<{ result: any }>;
    };
    
    tokenpocket?: {
      request: (method: string, params?: any) => Promise<{ result: any }>;
    };
    
    trust?: {
      request: (method: string, params?: any) => Promise<{ result: any }>;
    };
    
    exodus?: {
      request: (method: string, params?: any) => Promise<{ result: any }>;
    };
    
    btc?: any;
    bitcoin?: any;
    wallet?: {
      bitcoin?: any;
    };
  }
}

export {};
