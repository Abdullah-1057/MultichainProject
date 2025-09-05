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
          if (typeof this.wallet.request === 'function') {
            console.log('Trying wallet.request("getAccounts")');
            try {
              accounts = await this.wallet.request('getAccounts');
            } catch (e1) {
              console.log('Method 1 failed, trying with params object:', e1);
              try {
                accounts = await this.wallet.request({ method: 'getAccounts' });
              } catch (e2) {
                console.log('Method 2 failed, trying requestAccounts:', e2);
                accounts = await this.wallet.request('requestAccounts');
              }
            }
          } else if (typeof this.wallet.getAccounts === 'function') {
            console.log('Trying wallet.getAccounts()');
            accounts = await this.wallet.getAccounts();
          } else if (typeof this.wallet.requestAccounts === 'function') {
            console.log('Trying wallet.requestAccounts()');
            accounts = await this.wallet.requestAccounts();
          } else if (typeof this.wallet.connect === 'function') {
            console.log('Trying wallet.connect()');
            const res = await this.wallet.connect();
            accounts = res?.accounts || res;
          } else {
            // Try to find any method that might get accounts
            const possibleMethods = ['getAccounts', 'requestAccounts', 'connect', 'enable'];
            for (const method of possibleMethods) {
              if (typeof this.wallet[method] === 'function') {
                console.log(`Trying wallet.${method}()`);
                try {
                  const result = await this.wallet[method]();
                  if (result) {
                    accounts = result.accounts || result;
                    break;
                  }
                } catch (e) {
                  console.log(`Method ${method} failed:`, e);
                }
              }
            }
          }
        } catch (error) {
          console.error('All Xverse connection methods failed:', error);
          throw new Error(`Xverse connection failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure Xverse is unlocked and try again.`);
        }

        console.log('Xverse accounts result:', accounts);
        
        const first = Array.isArray(accounts) ? accounts[0] : accounts?.[0]
        if (!first?.address) {
          throw new Error('Xverse did not return an address. Please unlock the wallet and try again.')
        }
        address = first.address
        publicKey = first.publicKey || first.address
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




