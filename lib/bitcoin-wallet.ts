/* eslint-disable @typescript-eslint/no-explicit-any */
// Bitcoin wallet utilities and detection (fixed)
import { request as satsRequest, AddressPurpose, RpcErrorCode } from "sats-connect";

export interface BitcoinWallet {
  name: string;
  icon: string;
  isInstalled: boolean;
  isConnected: boolean;
  address?: string;     // BTC payment address
  publicKey?: string;
}

export interface BitcoinTransactionParams {
  to: string;       // recipient BTC address
  amount: number;   // in BTC
  feeRate?: number; // sat/vB (currently only used by OKX/unisat paths)
}

type WalletType = "unisat" | "xverse" | "okx" | "";

export class BitcoinWalletManager {
  private wallet: any = null;
  private walletType: WalletType = "";
  private connectedPaymentAddr: string | null = null;
  private connectedPubKey: string | null = null;

  constructor() {
    this.detectWallet();
  }

  public refreshDetection() {
    this.wallet = null;
    this.walletType = "";
    this.connectedPaymentAddr = null;
    this.connectedPubKey = null;
    this.detectWallet();
  }

  private detectWallet() {
    if (typeof window === "undefined") return;

    // 1) Unisat
    if ((window as any).unisat) {
      this.wallet = (window as any).unisat;
      this.walletType = "unisat";
      return;
    }

    // 2) OKX (bitcoin provider)
    if ((window as any).okxwallet?.bitcoin) {
      this.wallet = (window as any).okxwallet.bitcoin;
      this.walletType = "okx";
      return;
    }

    // 3) Xverse (several possible injections; we’ll use Sats-Connect to talk to it)
    const win = window as any;
    if (
      win.XverseProviders?.bitcoin ||
      win.xverse?.providers?.bitcoin ||
      win.xverse ||
      win.btc ||
      win.BitcoinProvider ||
      Array.isArray(win.btc_providers) // WBIP004-style list
    ) {
      // We’ll use satsConnect request() for Xverse; no direct provider needed.
      this.wallet = { __sats: true };
      this.walletType = "xverse";
      return;
    }

    // Nothing found
    this.wallet = null;
    this.walletType = "";
  }

  private satToBtc(n: number | string): number {
    const s = typeof n === "string" ? parseInt(n, 10) : n;
    return s / 100_000_000;
  }

  private btcToSat(n: number): number {
    // avoid floating error
    return Math.round(n * 100_000_000);
  }

  async connect(): Promise<BitcoinWallet> {
    if (!this.wallet) {
      throw new Error("No Bitcoin wallet detected");
    }

    try {
      if (this.walletType === "unisat") {
        // Must be user-initiated click per Unisat guidelines
        const accounts: string[] = await this.wallet.requestAccounts();
        const address = accounts?.[0];
        if (!address) throw new Error("Unisat returned no address");
        const publicKey: string = await this.wallet.getPublicKey();
        this.connectedPaymentAddr = address;
        this.connectedPubKey = publicKey;

        return {
          name: this.getWalletName(),
          icon: this.getWalletIcon(),
          isInstalled: true,
          isConnected: true,
          address,
          publicKey,
        };
      }

      if (this.walletType === "okx") {
        // OKX supports both .connect() and .requestAccounts()
        let address = "";
        let publicKey = "";
        if (typeof this.wallet.connect === "function") {
          const res = await this.wallet.connect();
          address = res?.address;
          publicKey = res?.publicKey || address;
        } else if (typeof this.wallet.requestAccounts === "function") {
          const accounts: string[] = await this.wallet.requestAccounts();
          address = accounts?.[0];
          publicKey = await this.wallet.getPublicKey();
        } else {
          const accounts: string[] = await this.wallet.getAccounts();
          address = accounts?.[0];
          publicKey = await this.wallet.getPublicKey();
        }
        if (!address) throw new Error("OKX returned no address");
        this.connectedPaymentAddr = address;
        this.connectedPubKey = publicKey;

        return {
          name: this.getWalletName(),
          icon: this.getWalletIcon(),
          isInstalled: true,
          isConnected: true,
          address,
          publicKey,
        };
      }

      if (this.walletType === "xverse") {
        // ✅ Correct modern flow with Sats-Connect: wallet_connect
        const resp = await satsRequest("wallet_connect", {
          addresses: [AddressPurpose.Payment, AddressPurpose.Ordinals],
          // message and network are optional; add if you want:
          // message: "Connect to My Cool App",
          // network: "Mainnet" | "Testnet" | "Signet" | "Regtest"
        });

        if (resp.status !== "success") {
          const err = resp.error;
          // Map common error codes for better DX
          if (err?.code === RpcErrorCode.USER_REJECTION) {
            throw new Error("User rejected the connection request in Xverse.");
          }
          throw new Error(err?.message || "Xverse connection failed.");
        }

        const addrs = resp.result?.addresses || [];
        const payment = addrs.find((a: any) => a.purpose === AddressPurpose.Payment) || addrs[0];
        if (!payment?.address) throw new Error("Xverse did not return a payment address.");

        this.connectedPaymentAddr = payment.address;
        this.connectedPubKey = payment.publicKey || payment.address;

        return {
          name: this.getWalletName(),
          icon: this.getWalletIcon(),
          isInstalled: true,
          isConnected: true,
          address: this.connectedPaymentAddr,
          publicKey: this.connectedPubKey,
        };
      }

      throw new Error("Unsupported wallet type");
    } catch (e: any) {
      throw new Error(`Failed to connect Bitcoin wallet: ${e?.message || String(e)}`);
    }
  }

  async sendTransaction(params: BitcoinTransactionParams): Promise<string> {
    if (!this.wallet || !this.walletType) {
      throw new Error("Bitcoin wallet not connected");
    }
    const satoshis = this.btcToSat(params.amount);

    try {
      if (this.walletType === "unisat") {
        // Unisat: sendBitcoin(to, satoshis, { feeRate? })
        const txid: string = await this.wallet.sendBitcoin(params.to, satoshis, {
          feeRate: params.feeRate,
        });
        return txid;
      }

      if (this.walletType === "okx") {
        // OKX: sendBitcoin({ to, amount, feeRate? }) OR .send()
        if (typeof this.wallet.sendBitcoin === "function") {
          const res = await this.wallet.sendBitcoin(params.to, satoshis, {
            feeRate: params.feeRate,
          });
          // Some SDKs return string, some { txid }
          return res?.txid || res;
        }
        if (typeof this.wallet.send === "function") {
          const res = await this.wallet.send({
            from: this.connectedPaymentAddr,
            to: params.to,
            value: (params.amount).toString(), // BTC string
            satBytes: params.feeRate?.toString(),
          });
          return res?.txhash;
        }
        throw new Error("OKX provider does not support sendBitcoin/send");
      }

      if (this.walletType === "xverse") {
        // ✅ Sats-Connect sendTransfer, amount in satoshis
        const resp = await satsRequest("sendTransfer", {
          recipients: [{ address: params.to, amount: satoshis }],
        });
        if (resp.status !== "success") {
          const err = resp.error;
          if (err?.code === RpcErrorCode.USER_REJECTION) {
            throw new Error("User rejected the BTC transfer in Xverse.");
          }
          throw new Error(err?.message || "Xverse sendTransfer failed.");
        }
        return resp.result?.txid;
      }

      throw new Error("Unsupported wallet type");
    } catch (e: any) {
      throw new Error(`Bitcoin transaction failed: ${e?.message || String(e)}`);
    }
  }

  async getBalance(): Promise<number> {
    if (!this.wallet || !this.walletType) {
      throw new Error("Bitcoin wallet not connected");
    }

    try {
      if (this.walletType === "unisat") {
        const res = await this.wallet.getBalance(); // { confirmed, unconfirmed, total }
        return this.satToBtc(res?.total ?? 0);
      }

      if (this.walletType === "okx") {
        const res = await this.wallet.getBalance(); // { confirmed, unconfirmed, total }
        return this.satToBtc(res?.total ?? 0);
      }

      if (this.walletType === "xverse") {
        // ✅ Sats-Connect getBalance needs no params; returns strings
        const resp = await satsRequest("getBalance", undefined);
        if (resp.status !== "success") {
          throw new Error(resp.error?.message || "Xverse getBalance failed.");
        }
        const total = resp.result?.total ?? "0";
        return this.satToBtc(total);
      }

      throw new Error("Unsupported wallet type");
    } catch (e: any) {
      throw new Error(`Failed to get balance: ${e?.message || String(e)}`);
    }
  }

  validateAddress(address: string): boolean {
    // Bech32 (bc1..., tb1...) & legacy P2PKH/P2SH
    const btcAddressRegex =
      /^(bc1[0-9a-z]{25,62}|tb1[0-9a-z]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/;
    return btcAddressRegex.test(address);
  }

  private getWalletName(): string {
    switch (this.walletType) {
      case "unisat":
        return "Unisat";
      case "xverse":
        return "Xverse";
      case "okx":
        return "OKX";
      default:
        return "Bitcoin Wallet";
    }
  }

  private getWalletIcon(): string {
    switch (this.walletType) {
      case "unisat":
        return "🟠";
      case "xverse":
        return "🟣";
      case "okx":
        return "🔵";
      default:
        return "🟠";
    }
  }

  isWalletInstalled(): boolean {
    return this.wallet !== null;
  }

  getWalletType(): WalletType {
    return this.walletType;
  }
}

// Global decls
declare global {
  interface Window {
    unisat?: any;
    xverse?: any;
    okxwallet?: { bitcoin?: any };
  }
}
