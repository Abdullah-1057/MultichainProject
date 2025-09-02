const { ethers } = require("ethers")
const crypto = require("crypto")
const axios = require("axios")

class ETHService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL)
    this.masterSeed = process.env.ETH_MASTER_SEED || crypto.randomBytes(32).toString("hex")
  }

  async generateAddress() {
    try {
      // Generate a new wallet from master seed + derivation index
      const derivationIndex = await this.getNextDerivationIndex()
      const derivationPath = `m/44'/60'/0'/0/${derivationIndex}`

      // Create HD wallet
      const mnemonic = ethers.Mnemonic.fromEntropy(this.masterSeed)
      const hdNode = ethers.HDNodeWallet.fromMnemonic(mnemonic, derivationPath)

      // Encrypt private key for storage
      const encryptedPrivateKey = this.encryptPrivateKey(hdNode.privateKey)

      return {
        address: hdNode.address,
        derivationIndex,
        privateKey: encryptedPrivateKey,
      }
    } catch (error) {
      console.error("ETH address generation failed:", error)
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
      const balance = await this.provider.getBalance(address)
      return {
        amount: ethers.formatEther(balance),
        confirmations: 1, // ETH balance is confirmed
      }
    } catch (error) {
      console.error("Failed to get ETH balance:", error)
      return { amount: "0", confirmations: 0 }
    }
  }

  async getTransactionHistory(address) {
    try {
      // This is a simplified implementation
      // In production, you'd use a service like Etherscan API or Alchemy
      const latestBlock = await this.provider.getBlockNumber()
      const transactions = []

      // Check recent blocks for transactions to this address
      for (let i = 0; i < 10; i++) {
        const blockNumber = latestBlock - i
        const block = await this.provider.getBlock(blockNumber, true)

        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
              transactions.push({
                hash: tx.hash,
                value: ethers.formatEther(tx.value),
                confirmations: latestBlock - blockNumber + 1,
              })
            }
          }
        }
      }

      return transactions
    } catch (error) {
      console.error("Failed to get transaction history:", error)
      return []
    }
  }

  async sendRewardTokens(toAddress, amount, tokenAddress, privateKey) {
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider)

      // ERC-20 token contract ABI (minimal)
      const tokenABI = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function decimals() view returns (uint8)",
        "function balanceOf(address owner) view returns (uint256)",
      ]

      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet)

      // Get token decimals
      const decimals = await tokenContract.decimals()
      const tokenAmount = ethers.parseUnits(amount.toString(), decimals)

      // Send tokens
      const tx = await tokenContract.transfer(toAddress, tokenAmount)
      await tx.wait()

      return {
        txHash: tx.hash,
        success: true,
      }
    } catch (error) {
      console.error("Failed to send reward tokens:", error)
      throw error
    }
  }

  async checkTransactions(address, minConfirmations = 1) {
    try {
      const transactions = await this.getIncomingTransactions(address)

      if (transactions.length === 0) {
        return { confirmed: false, amount: "0", txHash: null, confirmations: 0 }
      }

      // Get the most recent transaction
      const latestTx = transactions[0]
      const currentBlock = await this.provider.getBlockNumber()
      const confirmations = currentBlock - latestTx.blockNumber + 1

      return {
        confirmed: confirmations >= minConfirmations,
        amount: latestTx.value,
        txHash: latestTx.hash,
        confirmations,
      }
    } catch (error) {
      console.error("Failed to check ETH transactions:", error)
      return { confirmed: false, amount: "0", txHash: null, confirmations: 0 }
    }
  }

  async getIncomingTransactions(address) {
    try {
      const currentBlock = await this.provider.getBlockNumber()
      const transactions = []

      // Check recent blocks for incoming transactions
      // In production, you'd use Etherscan API or Alchemy for better performance
      const blocksToCheck = Math.min(1000, currentBlock) // Check last 1000 blocks or from genesis

      for (let i = 0; i < blocksToCheck; i++) {
        const blockNumber = currentBlock - i

        try {
          const block = await this.provider.getBlock(blockNumber, true)

          if (block && block.transactions) {
            for (const tx of block.transactions) {
              if (tx.to && tx.to.toLowerCase() === address.toLowerCase() && tx.value > 0) {
                transactions.push({
                  hash: tx.hash,
                  value: ethers.formatEther(tx.value),
                  blockNumber: tx.blockNumber,
                  from: tx.from,
                  gasUsed: tx.gasLimit,
                })
              }
            }
          }
        } catch (blockError) {
          // Skip blocks that can't be fetched
          continue
        }

        // Stop if we found transactions
        if (transactions.length > 0) {
          break
        }
      }

      // Sort by block number (most recent first)
      return transactions.sort((a, b) => b.blockNumber - a.blockNumber)
    } catch (error) {
      console.error("Failed to get incoming transactions:", error)
      return []
    }
  }

  // Alternative method using Etherscan API (more efficient for production)
  async checkTransactionsEtherscan(address, minConfirmations = 1) {
    try {
      const etherscanApiKey = process.env.ETHERSCAN_API_KEY
      if (!etherscanApiKey) {
        throw new Error("Etherscan API key not configured")
      }

      const response = await axios.get("https://api.etherscan.io/api", {
        params: {
          module: "account",
          action: "txlist",
          address: address,
          startblock: 0,
          endblock: 99999999,
          page: 1,
          offset: 10,
          sort: "desc",
          apikey: etherscanApiKey,
        },
      })

      if (response.data.status !== "1") {
        return { confirmed: false, amount: "0", txHash: null, confirmations: 0 }
      }

      const transactions = response.data.result
      const incomingTxs = transactions.filter((tx) => tx.to.toLowerCase() === address.toLowerCase() && tx.value !== "0")

      if (incomingTxs.length === 0) {
        return { confirmed: false, amount: "0", txHash: null, confirmations: 0 }
      }

      const latestTx = incomingTxs[0]
      const currentBlock = await this.provider.getBlockNumber()
      const confirmations = currentBlock - Number.parseInt(latestTx.blockNumber) + 1

      return {
        confirmed: confirmations >= minConfirmations,
        amount: ethers.formatEther(latestTx.value),
        txHash: latestTx.hash,
        confirmations,
      }
    } catch (error) {
      console.error("Etherscan API check failed:", error)
      // Fallback to direct provider method
      return await this.checkTransactions(address, minConfirmations)
    }
  }
}

module.exports = ETHService
