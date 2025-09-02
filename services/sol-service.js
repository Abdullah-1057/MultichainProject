const { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } = require("@solana/web3.js")
const crypto = require("crypto")
const bs58 = require("bs58")

class SOLService {
  constructor() {
    this.connection = new Connection(process.env.SOL_RPC_URL || clusterApiUrl("mainnet-beta"), "confirmed")
    this.masterSeed = process.env.SOL_MASTER_SEED || crypto.randomBytes(32)
  }

  async generateAddress() {
    try {
      // Generate deterministic keypair from master seed + derivation index
      const derivationIndex = await this.getNextDerivationIndex()
      const seed = crypto
        .createHash("sha256")
        .update(Buffer.concat([this.masterSeed, Buffer.from(derivationIndex.toString())]))
        .digest()

      const keypair = Keypair.fromSeed(seed)

      // Encrypt private key for storage
      const encryptedPrivateKey = this.encryptPrivateKey(bs58.encode(keypair.secretKey))

      return {
        address: keypair.publicKey.toString(),
        derivationIndex,
        privateKey: encryptedPrivateKey,
      }
    } catch (error) {
      console.error("SOL address generation failed:", error)
      throw error
    }
  }

  async getNextDerivationIndex() {
    // In production, this would query the database for the next available index
    return Math.floor(Math.random() * 1000000)
  }

  encryptPrivateKey(privateKey) {
    const cipher = crypto.createCipher("aes-256-gcm", process.env.JWT_SECRET)
    let encrypted = cipher.update(privateKey, "utf8", "hex")
    encrypted += cipher.final("hex")
    return encrypted
  }

  decryptPrivateKey(encryptedPrivateKey) {
    const decipher = crypto.createDecipher("aes-256-gcm", process.env.JWT_SECRET)
    let decrypted = decipher.update(encryptedPrivateKey, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
  }

  async getBalance(address) {
    try {
      const publicKey = new PublicKey(address)
      const balance = await this.connection.getBalance(publicKey)

      return {
        amount: (balance / LAMPORTS_PER_SOL).toString(),
        confirmations: 1, // SOL balance is confirmed
      }
    } catch (error) {
      console.error("Failed to get SOL balance:", error)
      return { amount: "0", confirmations: 0 }
    }
  }

  async getTransactionHistory(address) {
    try {
      const publicKey = new PublicKey(address)
      const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit: 10 })

      const transactions = []
      for (const sig of signatures) {
        const tx = await this.connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        })

        if (tx && tx.meta && !tx.meta.err) {
          // Check if this address received SOL
          const preBalance = tx.meta.preBalances[0] || 0
          const postBalance = tx.meta.postBalances[0] || 0
          const amount = (postBalance - preBalance) / LAMPORTS_PER_SOL

          if (amount > 0) {
            transactions.push({
              hash: sig.signature,
              value: amount.toString(),
              confirmations: sig.confirmationStatus === "finalized" ? 32 : 1,
            })
          }
        }
      }

      return transactions
    } catch (error) {
      console.error("Failed to get SOL transaction history:", error)
      return []
    }
  }

  async getConfirmationStatus(signature) {
    try {
      const status = await this.connection.getSignatureStatus(signature)
      return {
        confirmed: status.value?.confirmationStatus === "finalized",
        confirmations: status.value?.confirmationStatus === "finalized" ? 32 : 0,
      }
    } catch (error) {
      console.error("Failed to get confirmation status:", error)
      return { confirmed: false, confirmations: 0 }
    }
  }

  async checkTransactions(address, minConfirmations = 1) {
    try {
      const publicKey = new PublicKey(address)
      const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit: 10 })

      if (signatures.length === 0) {
        return { confirmed: false, amount: "0", txHash: null, confirmations: 0 }
      }

      // Check each signature for incoming SOL
      for (const sig of signatures) {
        const txDetails = await this.getTransactionDetails(sig.signature, address)

        if (txDetails.amount > 0) {
          const confirmations = this.getConfirmationCount(sig.confirmationStatus)

          return {
            confirmed: confirmations >= minConfirmations,
            amount: txDetails.amount.toString(),
            txHash: sig.signature,
            confirmations,
          }
        }
      }

      return { confirmed: false, amount: "0", txHash: null, confirmations: 0 }
    } catch (error) {
      console.error("Failed to check SOL transactions:", error)
      return { confirmed: false, amount: "0", txHash: null, confirmations: 0 }
    }
  }

  async getTransactionDetails(signature, targetAddress) {
    try {
      const tx = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      })

      if (!tx || !tx.meta || tx.meta.err) {
        return { amount: 0, from: null }
      }

      // Find the account index for our target address
      const accountKeys = tx.transaction.message.accountKeys || tx.transaction.message.staticAccountKeys
      const targetIndex = accountKeys.findIndex((key) => key.toString() === targetAddress)

      if (targetIndex === -1) {
        return { amount: 0, from: null }
      }

      // Calculate the balance change for our address
      const preBalance = tx.meta.preBalances[targetIndex] || 0
      const postBalance = tx.meta.postBalances[targetIndex] || 0
      const balanceChange = postBalance - preBalance

      return {
        amount: balanceChange > 0 ? balanceChange / LAMPORTS_PER_SOL : 0,
        from: accountKeys[0]?.toString(), // First account is usually the sender
      }
    } catch (error) {
      console.error("Failed to get SOL transaction details:", error)
      return { amount: 0, from: null }
    }
  }

  getConfirmationCount(confirmationStatus) {
    switch (confirmationStatus) {
      case "finalized":
        return 32 // Solana considers 32 confirmations as finalized
      case "confirmed":
        return 1
      case "processed":
        return 0
      default:
        return 0
    }
  }

  async getRecentTransactions(address, limit = 10) {
    try {
      const publicKey = new PublicKey(address)
      const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit })

      const transactions = []
      for (const sig of signatures) {
        const txDetails = await this.getTransactionDetails(sig.signature, address)

        if (txDetails.amount > 0) {
          transactions.push({
            signature: sig.signature,
            amount: txDetails.amount,
            confirmations: this.getConfirmationCount(sig.confirmationStatus),
            slot: sig.slot,
            blockTime: sig.blockTime,
          })
        }
      }

      return transactions.sort((a, b) => b.slot - a.slot) // Sort by slot (most recent first)
    } catch (error) {
      console.error("Failed to get recent SOL transactions:", error)
      return []
    }
  }
}

module.exports = SOLService
