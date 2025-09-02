const { Pool } = require("pg")
require("dotenv").config()

class CleanupWorker {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    })
    this.isRunning = false
    this.intervalId = null
  }

  async start() {
    if (this.isRunning) {
      console.log("Cleanup worker already running")
      return
    }

    this.isRunning = true
    console.log("Starting cleanup worker...")

    // Run immediately, then every 5 minutes
    await this.performCleanup()
    this.intervalId = setInterval(
      () => {
        this.performCleanup().catch(console.error)
      },
      5 * 60 * 1000,
    )

    console.log("Cleanup worker started")
  }

  async stop() {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    await this.pool.end()
    console.log("Cleanup worker stopped")
  }

  async performCleanup() {
    try {
      console.log("[CleanupWorker] Starting cleanup tasks...")

      // Mark expired fundings
      const expiredResult = await this.markExpiredFundings()

      // Clean old logs (older than 30 days)
      const logsResult = await this.cleanOldLogs()

      // Release unused addresses back to pool
      const addressResult = await this.releaseUnusedAddresses()

      // Clean failed reward queue entries (older than 7 days)
      const queueResult = await this.cleanFailedRewardQueue()

      console.log(`[CleanupWorker] Cleanup completed:`, {
        expiredFundings: expiredResult,
        cleanedLogs: logsResult,
        releasedAddresses: addressResult,
        cleanedQueue: queueResult,
      })
    } catch (error) {
      console.error("[CleanupWorker] Error during cleanup:", error)
    }
  }

  async markExpiredFundings() {
    try {
      const query = `
        UPDATE fundings 
        SET status = 'expired', updated_at = NOW()
        WHERE status = 'pending' 
          AND expires_at < NOW()
      `

      const result = await this.pool.query(query)
      return result.rowCount
    } catch (error) {
      console.error("Failed to mark expired fundings:", error)
      return 0
    }
  }

  async cleanOldLogs() {
    try {
      const queries = [
        // Clean old reward logs
        `DELETE FROM reward_logs WHERE created_at < NOW() - INTERVAL '30 days'`,
        // Clean old ICP logs
        `DELETE FROM icp_logs WHERE created_at < NOW() - INTERVAL '30 days'`,
      ]

      let totalCleaned = 0
      for (const query of queries) {
        const result = await this.pool.query(query)
        totalCleaned += result.rowCount
      }

      return totalCleaned
    } catch (error) {
      console.error("Failed to clean old logs:", error)
      return 0
    }
  }

  async releaseUnusedAddresses() {
    try {
      // Release addresses from expired fundings back to the pool
      const query = `
        UPDATE address_pool 
        SET is_used = false, updated_at = NOW()
        WHERE address IN (
          SELECT deposit_address 
          FROM fundings 
          WHERE status = 'expired' 
            AND updated_at < NOW() - INTERVAL '1 hour'
        )
        AND is_used = true
      `

      const result = await this.pool.query(query)
      return result.rowCount
    } catch (error) {
      console.error("Failed to release unused addresses:", error)
      return 0
    }
  }

  async cleanFailedRewardQueue() {
    try {
      // Remove failed rewards older than 7 days with max retries exceeded
      const query = `
        DELETE FROM reward_queue 
        WHERE status = 'failed' 
          AND retry_count >= 3
          AND updated_at < NOW() - INTERVAL '7 days'
      `

      const result = await this.pool.query(query)
      return result.rowCount
    } catch (error) {
      console.error("Failed to clean failed reward queue:", error)
      return 0
    }
  }
}

module.exports = CleanupWorker
