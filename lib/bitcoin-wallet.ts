// Bitcoin wallet utilities and detection
export interface BitcoinWallet {
  name: string
  icon: string
  isInstalled: boolean
  isConnected: boolean
  address?: string
  publicKey?: string
}

export interface BitcoinTransactionParams {
  to: string
  amount: number // in BTC
  feeRate?: number // satoshis per byte
}

export class BitcoinWalletManager {
  private wallet: any = null
  private walletType: string = ''

  constructor() {
    this.detectWallet()
  }

  public refreshDetection() {
    this.wallet = null
    this.walletType = ''
    this.detectWallet()
  }

  private detectWallet() {
    if (typeof window === 'undefined') return

    console.log('Detecting Bitcoin wallets...');
    console.log('Available window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('btc') || k.toLowerCase().includes('bitcoin') || k.toLowerCase().includes('unisat') || k.toLowerCase().includes('xverse') || k.toLowerCase().includes('okx')));

    // Check for Unisat wallet
    if (window.unisat) {
      console.log('Found Unisat wallet');
      this.wallet = window.unisat
      this.walletType = 'unisat'
      return
    }

    // Check for Xverse wallet - try multiple detection methods
    const xverseDetected = this.detectXverse();
    if (xverseDetected) {
      console.log('Found Xverse wallet');
      return;
    }

    // Check for OKX wallet (supports Bitcoin)
    if (window.okxwallet && window.okxwallet.bitcoin) {
      console.log('Found OKX Bitcoin wallet');
      this.wallet = window.okxwallet.bitcoin
      this.walletType = 'okx'
      return
    }

    console.log('No Bitcoin wallet detected');
  }

  private isJsonRpcError(result: any): boolean {
    return result && typeof result === 'object' && result.jsonrpc === '2.0' && result.error;
  }

  private detectXverse(): boolean {
    const win = window as any;
    
    // Method 1: Direct xverse object
    if (win.xverse) {
      console.log('Found window.xverse');
      if (win.xverse.providers?.bitcoin) {
        this.wallet = win.xverse.providers.bitcoin;
        this.walletType = 'xverse';
        return true;
      } else if (win.xverse.request || win.xverse.getAccounts || win.xverse.connect) {
        this.wallet = win.xverse;
        this.walletType = 'xverse';
        return true;
      }
    }

    // Method 2: Generic btc provider
    if (win.btc) {
      console.log('Found window.btc');
      this.wallet = win.btc;
      this.walletType = 'xverse';
      return true;
    }

    // Method 3: BitcoinProvider
    if (win.BitcoinProvider) {
      console.log('Found window.BitcoinProvider');
      this.wallet = win.BitcoinProvider;
      this.walletType = 'xverse';
      return true;
    }

    // Method 4: bitcoin provider
    if (win.bitcoin) {
      console.log('Found window.bitcoin');
      this.wallet = win.bitcoin;
      this.walletType = 'xverse';
      return true;
    }

    // Method 5: XverseProviders
    if (win.XverseProviders?.bitcoin) {
      console.log('Found window.XverseProviders.bitcoin');
      this.wallet = win.XverseProviders.bitcoin;
      this.walletType = 'xverse';
      return true;
    }

    // Method 6: Check for any object that looks like a Bitcoin wallet
    const possibleWallets = ['xverse', 'btc', 'bitcoin', 'BitcoinProvider'];
    for (const key of possibleWallets) {
      if (win[key] && typeof win[key] === 'object') {
        const obj = win[key];
        if (obj.request || obj.getAccounts || obj.connect || obj.sendBitcoin || obj.sendTransfer) {
          console.log(`Found potential Bitcoin wallet at window.${key}`);
          this.wallet = obj;
          this.walletType = 'xverse';
          return true;
        }
      }
    }

    return false;
  }

  async connect(): Promise<BitcoinWallet> {
    if (!this.wallet) {
      throw new Error('No Bitcoin wallet detected')
    }

    try {
      let address: string
      let publicKey: string

      if (this.walletType === 'unisat') {
        const accounts = await this.wallet.requestAccounts()
        address = accounts[0]
        publicKey = await this.wallet.getPublicKey()
      } else if (this.walletType === 'xverse') {
        console.log('Connecting to Xverse wallet...');
        console.log('Wallet object methods:', Object.getOwnPropertyNames(this.wallet));
        
        let accounts: any
        
        // Try multiple connection methods for Xverse
        try {
          // Method 1: Try direct function calls first (no parameters)
          if (typeof this.wallet.getAccounts === 'function') {
            console.log('Trying wallet.getAccounts()');
            try {
              accounts = await this.wallet.getAccounts();
              if (accounts && !this.isJsonRpcError(accounts)) {
                console.log('Success with getAccounts()');
              }
            } catch (e) {
              console.log('getAccounts() failed:', e);
            }
          }
          
          if (!accounts || this.isJsonRpcError(accounts)) {
            if (typeof this.wallet.requestAccounts === 'function') {
              console.log('Trying wallet.requestAccounts()');
              try {
                accounts = await this.wallet.requestAccounts();
                if (accounts && !this.isJsonRpcError(accounts)) {
                  console.log('Success with requestAccounts()');
                }
              } catch (e) {
                console.log('requestAccounts() failed:', e);
              }
            }
          }
          
          // Method 2: Try request() with no parameters (most likely to work)
          if ((!accounts || this.isJsonRpcError(accounts)) && typeof this.wallet.request === 'function') {
            console.log('Trying wallet.request("getAccounts") with no parameters');
            try {
              accounts = await this.wallet.request('getAccounts');
              if (accounts && !this.isJsonRpcError(accounts)) {
                console.log('Success with request("getAccounts") no params');
              }
            } catch (e) {
              console.log('request("getAccounts") no params failed:', e);
            }
          }
          
          // Method 3: Try request() with empty array
          if ((!accounts || this.isJsonRpcError(accounts)) && typeof this.wallet.request === 'function') {
            console.log('Trying wallet.request("getAccounts", [])');
            try {
              accounts = await this.wallet.request('getAccounts', []);
              if (accounts && !this.isJsonRpcError(accounts)) {
                console.log('Success with request("getAccounts", [])');
              }
            } catch (e) {
              console.log('request("getAccounts", []) failed:', e);
            }
          }
          
          // Method 4: Try requestAccounts with no parameters
          if ((!accounts || this.isJsonRpcError(accounts)) && typeof this.wallet.request === 'function') {
            console.log('Trying wallet.request("requestAccounts") with no parameters');
            try {
              accounts = await this.wallet.request('requestAccounts');
              if (accounts && !this.isJsonRpcError(accounts)) {
                console.log('Success with request("requestAccounts") no params');
              }
            } catch (e) {
              console.log('request("requestAccounts") no params failed:', e);
            }
          }
          
          // Method 5: Try connect()
          if ((!accounts || this.isJsonRpcError(accounts)) && typeof this.wallet.connect === 'function') {
            console.log('Trying wallet.connect()');
            try {
              const res = await this.wallet.connect();
              accounts = res?.accounts || res;
              if (accounts && !this.isJsonRpcError(accounts)) {
                console.log('Success with connect()');
              }
            } catch (e) {
              console.log('connect() failed:', e);
            }
          }
          
          // Method 6: Try other possible methods
          if (!accounts || this.isJsonRpcError(accounts)) {
            const possibleMethods = ['enable', 'authorize'];
            for (const method of possibleMethods) {
              if (typeof this.wallet[method] === 'function') {
                console.log(`Trying wallet.${method}()`);
                try {
                  const result = await this.wallet[method]();
                  if (result && !this.isJsonRpcError(result)) {
                    accounts = result.accounts || result;
                    console.log(`Success with ${method}()`);
                    break;
                  }
                } catch (e) {
                  console.log(`Method ${method} failed:`, e);
                }
              }
            }
          }
          
          // Check if we got a JSON-RPC error
          if (this.isJsonRpcError(accounts)) {
            const errorCode = accounts.error?.code;
            const errorMsg = accounts.error?.message || 'Unknown error';
            console.error('JSON-RPC error from Xverse:', accounts.error);
            
            let userMessage = `Xverse connection failed: ${errorMsg}`;
            
            if (errorCode === -32602) {
              userMessage = 'Xverse rejected the connection parameters. Please unlock your wallet and try again.';
            } else if (errorCode === 4001) {
              userMessage = 'Xverse connection was rejected. Please approve the connection request in your wallet.';
            } else if (errorCode === 4100) {
              userMessage = 'Xverse is not authorized. Please unlock your wallet and try again.';
            }
            
            throw new Error(userMessage);
          }
          
        } catch (error) {
          console.error('All Xverse connection methods failed:', error);
          throw new Error(`Xverse connection failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure Xverse is unlocked and try again.`);
        }

        console.log('Xverse accounts result:', accounts);
        
        // Handle different response formats from Xverse
        let first: any = null;
        
        if (Array.isArray(accounts)) {
          first = accounts[0];
        } else if (accounts?.accounts && Array.isArray(accounts.accounts)) {
          first = accounts.accounts[0];
        } else if (accounts?.result && Array.isArray(accounts.result)) {
          first = accounts.result[0];
        } else if (accounts?.address) {
          // Direct address in response
          first = { address: accounts.address, publicKey: accounts.publicKey };
        } else if (accounts) {
          first = accounts;
        }
        
        console.log('Extracted first account:', first);
        
        if (!first?.address) {
          console.error('No address found in Xverse response:', accounts);
          throw new Error('Xverse did not return an address. Please unlock the wallet and try again.')
        }
        
        address = first.address;
        publicKey = first.publicKey || first.address;
      } else if (this.walletType === 'okx') {
        const accounts = await this.wallet.requestAccounts()
        address = accounts[0]
        publicKey = accounts[0]
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
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to connect Bitcoin wallet: ${message}`)
    }
  }

  async sendTransaction(params: BitcoinTransactionParams): Promise<string> {
    if (!this.wallet) {
      throw new Error('Bitcoin wallet not connected')
    }

    try {
      // Convert BTC to satoshis
      const satoshis = Math.floor(params.amount * 100000000)

      let txHash: string

      if (this.walletType === 'unisat') {
        txHash = await this.wallet.sendBitcoin(params.to, satoshis)
      } else if (this.walletType === 'xverse') {
        // Prefer request('sendTransfer') if supported, else try provider-specific methods
        if (typeof this.wallet.request === 'function') {
          let response: any
          try {
            response = await this.wallet.request('sendTransfer', {
              recipients: [{ address: params.to, amount: satoshis }]
            })
          } catch (_e: any) {
            response = await this.wallet.request({ method: 'sendTransfer', params: [{ recipients: [{ address: params.to, amount: satoshis }] }] })
          }
          txHash = response?.txid || response?.result || response
        } else if (typeof this.wallet.sendBitcoin === 'function') {
          const response = await this.wallet.sendBitcoin({ to: params.to, amount: satoshis })
          txHash = response.txid || response
        } else if (typeof this.wallet.sendTransfer === 'function') {
          const response = await this.wallet.sendTransfer({ recipients: [{ address: params.to, amount: satoshis }] })
          txHash = response?.txid || response
        } else {
          throw new Error('Xverse provider does not support sending via this API')
        }
      } else if (this.walletType === 'okx') {
        const response = await this.wallet.sendBitcoin({
          to: params.to,
          amount: satoshis
        })
        txHash = response.txid
      } else {
        throw new Error('Unsupported wallet type')
      }

      return txHash
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Bitcoin transaction failed: ${message}`)
    }
  }

  async getBalance(): Promise<number> {
    if (!this.wallet) {
      throw new Error('Bitcoin wallet not connected')
    }

    try {
      let balance: number

      if (this.walletType === 'unisat') {
        balance = await this.wallet.getBalance()
      } else if (this.walletType === 'xverse') {
        const response = await this.wallet.request('getBalance')
        balance = response.total
      } else if (this.walletType === 'okx') {
        const response = await this.wallet.getBalance()
        balance = response.confirmed
      } else {
        throw new Error('Unsupported wallet type')
      }

      // Convert satoshis to BTC
      return balance / 100000000
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`)
    }
  }

  validateAddress(address: string): boolean {
    // Basic Bitcoin address validation
    const btcAddressRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$|^tb1[a-z0-9]{39,59}$/
    return btcAddressRegex.test(address)
  }

  private getWalletName(): string {
    switch (this.walletType) {
      case 'unisat': return 'Unisat'
      case 'xverse': return 'Xverse'
      case 'okx': return 'OKX'
      default: return 'Bitcoin Wallet'
    }
  }

  private getWalletIcon(): string {
    switch (this.walletType) {
      case 'unisat': return '🟠'
      case 'xverse': return '🟣'
      case 'okx': return '🔵'
      default: return '🟠'
    }
  }

  isWalletInstalled(): boolean {
    return this.wallet !== null
  }

  getWalletType(): string {
    return this.walletType
  }
}

// Global Bitcoin wallet interfaces
declare global {
  interface Window {
    unisat?: any
    xverse?: any
    okxwallet?: {
      bitcoin?: any
    }
  }
}




