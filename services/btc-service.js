const bitcoin = require("bitcoinjs-lib")
const { BIP32Factory } = require("bip32")
const ecc = require("tiny-secp256k1")
const axios = require("axios")

const bip32 = BIP32Factory(ecc)

class BTCService {
  constructor() {
    this.rpcUrl = process.env.BITCOIN_RPC_URL
    this.rpcUser = process.env.BITCOIN_RPC_USER
    this.rpcPass = process.env.BITCOIN_RPC_PASS
    this.xpub = process.env.BTC_XPUB
    this.derivationPath = process.env.BTC_DERIVATION_PATH || "m/84'/0'/0'"
    this.network = bitcoin.networks.bitcoin // Use testnet for development
  }

  async generateAddress() {
    try {
      // Prefer bitcoind RPC if available
      if (this.rpcUrl && this.rpcUser && this.rpcPass) {
        return await this.generateAddressRPC()
      }

      // Fallback to xpub derivation
      if (this.xpub) {
        return await this.generateAddressFromXpub()
      }

      throw new Error("No BTC address generation method configured")
    } catch (error) {
      console.error("BTC address generation failed:", error)
      throw error
    }
  }

  async generateAddressRPC() {
    try {
      const response = await axios.post(
        this.rpcUrl,
        {
          jsonrpc: "1.0",
          id: "funding-interface",
          method: "getnewaddress",
          params: ["", "bech32"],
        },
        {
          auth: {
            username: this.rpcUser,
            password: this.rpcPass,
          },
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (response.data.error) {
        throw new Error(`Bitcoin RPC error: ${response.data.error.message}`)
      }

      return {
        address: response.data.result,
        derivationIndex: null,
        privateKey: null, // Private key stays on Bitcoin Core
      }
    } catch (error) {
      console.error("Bitcoin RPC call failed:", error)
      throw error
    }
  }

  async generateAddressFromXpub() {
    try {
      // Get next derivation index from database
      const derivationIndex = await this.getNextDerivationIndex()

      // Derive address from xpub
      const node = bip32.fromBase58(this.xpub, this.network)
      const child = node.derive(0).derive(derivationIndex) // External chain (0) + index

      // Generate bech32 address
      const { address } = bitcoin.payments.p2wpkh({
        pubkey: child.publicKey,
        network: this.network,
      })

      return {
        address,
        derivationIndex,
        privateKey: null, // xpub derivation doesn't expose private keys
      }
    } catch (error) {
      console.error("BTC xpub derivation failed:", error)
      throw error
    }
  }

  async getNextDerivationIndex() {
    // This would query the database for the next available index
    // For now, return a random index (in production, implement proper index tracking)
    return Math.floor(Math.random() * 1000000)
  }

  async getReceivedByAddress(address) {
    try {
      if (!this.rpcUrl) {
        // Fallback to public API (for demo purposes)
        return await this.getReceivedByAddressPublicAPI(address)
      }

      const response = await axios.post(
        this.rpcUrl,
        {
          jsonrpc: "1.0",
          id: "funding-interface",
          method: "getreceivedbyaddress",
          params: [address, 1], // 1 confirmation minimum
        },
        {
          auth: {
            username: this.rpcUser,
            password: this.rpcPass,
          },
        },
      )

      return {
        amount: response.data.result,
        confirmations: 1, // This would need more sophisticated checking
      }
    } catch (error) {
      console.error("Failed to get received amount:", error)
      return { amount: 0, confirmations: 0 }
    }
  }

  async getReceivedByAddressPublicAPI(address) {
    try {
      // Using blockstream.info API as fallback
      const response = await axios.get(`https://blockstream.info/api/address/${address}`)
      const data = response.data

      return {
        amount: data.chain_stats.funded_txo_sum / 100000000, // Convert satoshis to BTC
        confirmations: data.chain_stats.tx_count > 0 ? 1 : 0,
        txHash: data.chain_stats.tx_count > 0 ? "available_via_tx_history" : null,
      }
    } catch (error) {
      console.error("Public API call failed:", error)
      return { amount: 0, confirmations: 0 }
    }
  }

  async checkTransactions(address, minConfirmations = 1) {
    try {
      if (this.rpcUrl && this.rpcUser && this.rpcPass) {
        return await this.checkTransactionsRPC(address, minConfirmations)
      }

      // Fallback to public API
      return await this.checkTransactionsPublicAPI(address, minConfirmations)
    } catch (error) {
      console.error("Failed to check BTC transactions:", error)
      return { confirmed: false, amount: 0, txHash: null, confirmations: 0 }
    }
  }

  async checkTransactionsRPC(address, minConfirmations) {
    try {
      // Get received amount with minimum confirmations
      const receivedResponse = await axios.post(
        this.rpcUrl,
        {
          jsonrpc: "1.0",
          id: "funding-interface",
          method: "getreceivedbyaddress",
          params: [address, minConfirmations],
        },
        {
          auth: { username: this.rpcUser, password: this.rpcPass },
          headers: { "Content-Type": "application/json" },
        },
      )

      if (receivedResponse.data.error) {
        throw new Error(`Bitcoin RPC error: ${receivedResponse.data.error.message}`)
      }

      const receivedAmount = receivedResponse.data.result

      if (receivedAmount > 0) {
        // Get transaction details
        const txDetails = await this.getTransactionDetails(address)
        return {
          confirmed: true,
          amount: receivedAmount,
          txHash: txDetails.txHash,
          confirmations: txDetails.confirmations,
        }
      }

      return { confirmed: false, amount: 0, txHash: null, confirmations: 0 }
    } catch (error) {
      console.error("BTC RPC transaction check failed:", error)
      throw error
    }
  }

  async checkTransactionsPublicAPI(address, minConfirmations) {
    try {
      // Using blockstream.info API
      const response = await axios.get(`https://blockstream.info/api/address/${address}`)
      const addressData = response.data

      if (addressData.chain_stats.funded_txo_sum > 0) {
        // Get transaction history to find the most recent funding transaction
        const txHistoryResponse = await axios.get(`https://blockstream.info/api/address/${address}/txs`)
        const transactions = txHistoryResponse.data

        for (const tx of transactions) {
          // Check if this transaction sent funds to our address
          const receivedAmount = this.calculateReceivedAmount(tx, address)
          if (receivedAmount > 0) {
            const confirmations = tx.status.confirmed
              ? tx.status.block_height
                ? (await this.getCurrentBlockHeight()) - tx.status.block_height + 1
                : 0
              : 0

            return {
              confirmed: confirmations >= minConfirmations,
              amount: receivedAmount / 100000000, // Convert satoshis to BTC
              txHash: tx.txid,
              confirmations,
            }
          }
        }
      }

      return { confirmed: false, amount: 0, txHash: null, confirmations: 0 }
    } catch (error) {
      console.error("BTC public API check failed:", error)
      throw error
    }
  }

  calculateReceivedAmount(tx, address) {
    let receivedAmount = 0
    for (const output of tx.vout) {
      if (output.scriptpubkey_address === address) {
        receivedAmount += output.value
      }
    }
    return receivedAmount
  }

  async getCurrentBlockHeight() {
    try {
      const response = await axios.get("https://blockstream.info/api/blocks/tip/height")
      return response.data
    } catch (error) {
      console.error("Failed to get current block height:", error)
      return 0
    }
  }

  async getTransactionDetails(address) {
    try {
      // Get list of transactions for address
      const listTransactionsResponse = await axios.post(
        this.rpcUrl,
        {
          jsonrpc: "1.0",
          id: "funding-interface",
          method: "listtransactions",
          params: ["*", 10, 0, true], // Get last 10 transactions
        },
        {
          auth: { username: this.rpcUser, password: this.rpcPass },
        },
      )

      const transactions = listTransactionsResponse.data.result || []

      // Find transaction to our address
      for (const tx of transactions) {
        if (tx.address === address && tx.category === "receive" && tx.amount > 0) {
          return {
            txHash: tx.txid,
            confirmations: tx.confirmations,
            amount: tx.amount,
          }
        }
      }

      return { txHash: null, confirmations: 0, amount: 0 }
    } catch (error) {
      console.error("Failed to get transaction details:", error)
      return { txHash: null, confirmations: 0, amount: 0 }
    }
  }
}

module.exports = BTCService
