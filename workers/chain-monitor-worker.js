const { Pool } = require("pg")
const ChainMonitor = require("../services/chain-monitor")
const RewardQueue = require("../services/reward-queue")
require("dotenv").config()

class ChainMonitorWorker {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    })
    this.chainMonitor = new ChainMonitor()
    this.rewardQueue = new RewardQueue()
    this.isRunning = false
    this.intervalId = null
  }

  async start() {
    if (this.isRunning) {
      console.log("Chain monitor worker already running")
      return
    }

    this.isRunning = true
    console.log("Starting chain monitor worker...")

    // Run immediately, then every 30 seconds
    await this.processPendingFundings()
    this.intervalId = setInterval(() => {
      this.processPendingFundings().catch(console.error)
    }, 30000)

    console.log("Chain monitor worker started")
  }

  async stop() {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    await this.pool.end()
    console.log("Chain monitor worker stopped")
  }

  async processPendingFundings() {
    try {
      // Get pending fundings that haven't expired
      const query = `
        SELECT id, chain, deposit_address, min_confirmations, evm_address,
               created_at, expires_at
        FROM fundings 
        WHERE status = 'pending' 
          AND expires_at > NOW()
        ORDER BY created_at ASC
        LIMIT 100
      `

      const result = await this.pool.query(query)
      const pendingFundings = result.rows

      if (pendingFundings.length === 0) {
        return
      }

      console.log(`[ChainWorker] Processing ${pendingFundings.length} pending fundings`)

      // Batch check all pending fundings
      const results = await this.chainMonitor.batchCheckFundings(pendingFundings)

      // Process confirmed fundings
      const confirmedCount = await this.processConfirmedFundings(results)

      if (confirmedCount > 0) {
        console.log(`[ChainWorker] Confirmed ${confirmedCount} fundings`)
      }
    } catch (error) {
      console.error("[ChainWorker] Error processing pending fundings:", error)
    }
  }

  async processConfirmedFundings(results) {
    let confirmedCount = 0

    for (const result of results) {
      if (!result.confirmed) continue

      try {
        // Update funding record
        const updateQuery = `
          UPDATE fundings SET 
            status = 'confirmed',
            funded_amount = $1,
            funding_tx_hash = $2,
            confirmations = $3,
            updated_at = NOW()
          WHERE id = $4 AND status = 'pending'
          RETURNING evm_address, chain
        `

        const updateResult = await this.pool.query(updateQuery, [
          result.amount,
          result.txHash,
          result.confirmations,
          result.fundingId,
        ])

        if (updateResult.rows.length > 0) {
          const funding = updateResult.rows[0]

          // Add to reward queue
          await this.rewardQueue.addToQueue(
            result.fundingId,
            funding.evm_address,
            result.amount,
            funding.chain,
            1, // High priority
          )

          confirmedCount++
          console.log(`[ChainWorker] Confirmed funding ${result.fundingId}: ${result.amount} ${funding.chain}`)
        }
      } catch (error) {
        console.error(`[ChainWorker] Error processing confirmed funding ${result.fundingId}:`, error)
      }
    }

    return confirmedCount
  }
}

module.exports = ChainMonitorWorker
