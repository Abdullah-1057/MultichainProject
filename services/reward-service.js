const { ethers } = require("ethers")
const axios = require("axios")

class RewardService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL)
    this.tokenAddress = process.env.REWARD_TOKEN_ADDRESS
    this.treasuryPrivateKey = process.env.REWARD_TREASURY_PRIVATE_KEY
    this.tokenDecimals = Number.parseInt(process.env.REWARD_TOKEN_DECIMALS) || 18
    this.rewardMultiplier = Number.parseFloat(process.env.REWARD_MULTIPLIER) || 1.0
    this.minFundingAmountUSD = Number.parseFloat(process.env.MIN_FUNDING_AMOUNT_USD) || 10

    if (!this.tokenAddress || !this.treasuryPrivateKey) {
      throw new Error(
        "Reward token configuration missing: REWARD_TOKEN_ADDRESS and REWARD_TREASURY_PRIVATE_KEY required",
      )
    }

    // Initialize treasury wallet
    this.treasuryWallet = new ethers.Wallet(this.treasuryPrivateKey, this.provider)

    // ERC-20 token contract ABI
    this.tokenABI = [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
      "function name() view returns (string)",
    ]

    this.tokenContract = new ethers.Contract(this.tokenAddress, this.tokenABI, this.treasuryWallet)
  }

  async calculateRewardAmount(fundedAmount, chain) {
    try {
      // Convert funded amount to USD
      const usdValue = await this.convertToUSD(fundedAmount, chain)

      // Check minimum funding requirement
      if (usdValue < this.minFundingAmountUSD) {
        throw new Error(`Funding amount $${usdValue} is below minimum $${this.minFundingAmountUSD}`)
      }

      // Calculate reward tokens (1:1 USD equivalent by default)
      const rewardAmount = usdValue * this.rewardMultiplier

      return {
        usdValue,
        rewardAmount,
        rewardTokens: ethers.parseUnits(rewardAmount.toString(), this.tokenDecimals),
      }
    } catch (error) {
      console.error("Failed to calculate reward amount:", error)
      throw error
    }
  }

  async convertToUSD(amount, chain) {
    try {
      const prices = await this.getCryptoPrices()
      const numericAmount = Number.parseFloat(amount)

      switch (chain) {
        case "BTC":
          return numericAmount * prices.bitcoin.usd
        case "ETH":
          return numericAmount * prices.ethereum.usd
        case "SOL":
          return numericAmount * prices.solana.usd
        default:
          throw new Error(`Unsupported chain for USD conversion: ${chain}`)
      }
    } catch (error) {
      console.error("USD conversion failed:", error)
      throw error
    }
  }

  async getCryptoPrices() {
    try {
      const response = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd",
        {
          timeout: 10000,
        },
      )

      return response.data
    } catch (error) {
      console.error("Failed to fetch crypto prices:", error)
      // Fallback prices for development/testing
      return {
        bitcoin: { usd: 45000 },
        ethereum: { usd: 2500 },
        solana: { usd: 100 },
      }
    }
  }

  async sendRewardTokens(toAddress, fundedAmount, chain, fundingId) {
    try {
      // Validate EVM address
      if (!ethers.isAddress(toAddress)) {
        throw new Error(`Invalid EVM address: ${toAddress}`)
      }

      // Calculate reward amount
      const rewardCalculation = await this.calculateRewardAmount(fundedAmount, chain)

      // Check treasury balance
      const treasuryBalance = await this.tokenContract.balanceOf(this.treasuryWallet.address)
      if (treasuryBalance < rewardCalculation.rewardTokens) {
        throw new Error(
          `Insufficient treasury balance. Required: ${ethers.formatUnits(
            rewardCalculation.rewardTokens,
            this.tokenDecimals,
          )}, Available: ${ethers.formatUnits(treasuryBalance, this.tokenDecimals)}`,
        )
      }

      // Estimate gas
      const gasEstimate = await this.tokenContract.transfer.estimateGas(toAddress, rewardCalculation.rewardTokens)
      const gasPrice = await this.provider.getFeeData()

      // Send reward tokens
      const tx = await this.tokenContract.transfer(toAddress, rewardCalculation.rewardTokens, {
        gasLimit: (gasEstimate * 120n) / 100n, // Add 20% buffer
        maxFeePerGas: gasPrice.maxFeePerGas,
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
      })

      console.log(`Reward transfer initiated: ${tx.hash}`)

      // Wait for confirmation
      const receipt = await tx.wait()

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        rewardAmount: ethers.formatUnits(rewardCalculation.rewardTokens, this.tokenDecimals),
        usdValue: rewardCalculation.usdValue,
        fundingId,
      }
    } catch (error) {
      console.error("Reward transfer failed:", error)
      throw error
    }
  }

  async getTokenInfo() {
    try {
      const [name, symbol, decimals, treasuryBalance] = await Promise.all([
        this.tokenContract.name(),
        this.tokenContract.symbol(),
        this.tokenContract.decimals(),
        this.tokenContract.balanceOf(this.treasuryWallet.address),
      ])

      return {
        name,
        symbol,
        decimals: decimals.toString(),
        treasuryAddress: this.treasuryWallet.address,
        treasuryBalance: ethers.formatUnits(treasuryBalance, decimals),
        tokenAddress: this.tokenAddress,
      }
    } catch (error) {
      console.error("Failed to get token info:", error)
      throw error
    }
  }

  async validateRewardTransfer(txHash) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash)

      if (!receipt) {
        return { valid: false, reason: "Transaction not found" }
      }

      if (receipt.status === 0) {
        return { valid: false, reason: "Transaction failed" }
      }

      // Check if transaction is to our token contract
      if (receipt.to.toLowerCase() !== this.tokenAddress.toLowerCase()) {
        return { valid: false, reason: "Transaction not to reward token contract" }
      }

      return {
        valid: true,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        confirmations: (await this.provider.getBlockNumber()) - receipt.blockNumber,
      }
    } catch (error) {
      console.error("Failed to validate reward transfer:", error)
      return { valid: false, reason: error.message }
    }
  }

  async retryFailedReward(fundingId, toAddress, fundedAmount, chain) {
    try {
      console.log(`Retrying reward transfer for funding ${fundingId}`)

      const result = await this.sendRewardTokens(toAddress, fundedAmount, chain, fundingId)

      console.log(`Retry successful for funding ${fundingId}: ${result.txHash}`)
      return result
    } catch (error) {
      console.error(`Retry failed for funding ${fundingId}:`, error)
      throw error
    }
  }

  async estimateRewardCost(fundedAmount, chain) {
    try {
      const rewardCalculation = await this.calculateRewardAmount(fundedAmount, chain)
      const gasEstimate = await this.tokenContract.transfer.estimateGas(
        "0x0000000000000000000000000000000000000001", // Dummy address for estimation
        rewardCalculation.rewardTokens,
      )
      const gasPrice = await this.provider.getFeeData()

      const estimatedGasCost = gasEstimate * gasPrice.maxFeePerGas

      return {
        rewardAmount: ethers.formatUnits(rewardCalculation.rewardTokens, this.tokenDecimals),
        usdValue: rewardCalculation.usdValue,
        estimatedGasCostETH: ethers.formatEther(estimatedGasCost),
        gasEstimate: gasEstimate.toString(),
      }
    } catch (error) {
      console.error("Failed to estimate reward cost:", error)
      throw error
    }
  }
}

module.exports = RewardService
