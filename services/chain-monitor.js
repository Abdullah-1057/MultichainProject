const BTCService = require("./btc-service")
const ETHService = require("./eth-service")
const SOLService = require("./sol-service")

class ChainMonitor {
  constructor() {
    this.btcService = new BTCService()
    this.ethService = new ETHService()
    this.solService = new SOLService()
  }

  async checkFundingStatus(funding) {
    try {
      const { chain, deposit_address, min_confirmations } = funding

      let service
      switch (chain) {
        case "BTC":
          service = this.btcService
          break
        case "ETH":
          service = this.ethService
          break
        case "SOL":
          service = this.solService
          break
        default:
          throw new Error(`Unsupported chain: ${chain}`)
      }

      const result = await service.checkTransactions(deposit_address, min_confirmations)

      return {
        confirmed: result.confirmed,
        amount: result.amount,
        txHash: result.txHash,
        confirmations: result.confirmations,
        chain,
      }
    } catch (error) {
      console.error(`Failed to check funding status for ${funding.chain}:`, error)
      return {
        confirmed: false,
        amount: 0,
        txHash: null,
        confirmations: 0,
        chain: funding.chain,
        error: error.message,
      }
    }
  }

  async batchCheckFundings(fundings) {
    const results = []

    // Process in batches to avoid rate limiting
    const batchSize = 5
    for (let i = 0; i < fundings.length; i += batchSize) {
      const batch = fundings.slice(i, i + batchSize)
      const batchPromises = batch.map((funding) => this.checkFundingStatus(funding))

      try {
        const batchResults = await Promise.allSettled(batchPromises)

        batchResults.forEach((result, index) => {
          if (result.status === "fulfilled") {
            results.push({
              fundingId: batch[index].id,
              ...result.value,
            })
          } else {
            results.push({
              fundingId: batch[index].id,
              confirmed: false,
              amount: 0,
              txHash: null,
              confirmations: 0,
              chain: batch[index].chain,
              error: result.reason?.message || "Unknown error",
            })
          }
        })
      } catch (error) {
        console.error("Batch processing failed:", error)
      }

      // Add delay between batches to respect rate limits
      if (i + batchSize < fundings.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return results
  }

  async getChainStatus(chain) {
    try {
      let service
      switch (chain) {
        case "BTC":
          service = this.btcService
          break
        case "ETH":
          service = this.ethService
          break
        case "SOL":
          service = this.solService
          break
        default:
          throw new Error(`Unsupported chain: ${chain}`)
      }

      // Get basic chain information
      if (chain === "BTC") {
        const blockHeight = await service.getCurrentBlockHeight()
        return { chain, blockHeight, status: "connected" }
      } else if (chain === "ETH") {
        const blockNumber = await service.provider.getBlockNumber()
        return { chain, blockNumber, status: "connected" }
      } else if (chain === "SOL") {
        const slot = await service.connection.getSlot()
        return { chain, slot, status: "connected" }
      }
    } catch (error) {
      console.error(`Failed to get ${chain} status:`, error)
      return { chain, status: "disconnected", error: error.message }
    }
  }
}

module.exports = ChainMonitor
