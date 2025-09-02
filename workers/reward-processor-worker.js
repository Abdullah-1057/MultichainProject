const { Pool } = require("pg")
const RewardQueue = require("../services/reward-queue")
const RewardService = require("../services/reward-service")
require("dotenv").config()

class RewardProcessorWorker {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    })
    this.rewardQueue = new RewardQueue()
    this.rewardService = new RewardService()
    this.isRunning = false
    this.intervalId = null
  }

  async start() {
    if (this.isRunning) {
      console.log("Reward processor worker already running")
      return
    }

    this.isRunning = true
    console.log("Starting reward processor worker...")

    // Run immediately, then every 15 seconds
    await this.processRewardQueue()
    this.intervalId = setInterval(() => {
      this.processRewardQueue().catch(console.error)
    }, 15000)

    console.log("Reward processor worker started")
  }

  async stop() {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    await this.pool.end()
    console.log("Reward processor worker stopped")
  }

  async processRewardQueue() {
    try {
      let processed = 0
      const maxBatch = 5 // Process up to 5 rewards per batch

      while (processed < maxBatch) {
        const pendingReward = await this.rewardQueue.getNextPendingReward()

        if (!pendingReward) {
          break // No more pending rewards
        }

        // Mark as processing
        const processingReward = await this.rewardQueue.markAsProcessing(pendingReward.id)
        if (!processingReward) {
          continue // Already being processed
        }

        try {
          console.log(`[RewardWorker] Processing reward for funding ${pendingReward.funding_id}`)

          // Send reward tokens
          const result = await this.rewardService.sendRewardTokens(
            pendingReward.evm_address,
            pendingReward.funded_amount,
            pendingReward.chain,
            pendingReward.funding_id,
          )

          // Mark as completed
          await this.rewardQueue.markAsCompleted(pendingReward.id, result.txHash, result.rewardAmount)

          // Update funding record
          await this.pool.query(
            `UPDATE fundings SET status = 'reward_sent', reward_tx_hash = $1, updated_at = NOW() WHERE id = $2`,
            [result.txHash, pendingReward.funding_id],
          )

          // Log success
          await this.logRewardAction(
            pendingReward.funding_id,
            pendingReward.id,
            "completed",
            result.txHash,
            result.rewardAmount,
            result.usdValue,
            result.gasUsed,
            null,
          )

          console.log(`[RewardWorker] Reward sent successfully: ${result.txHash}`)
          processed++
        } catch (error) {
          // Mark as failed
          await this.rewardQueue.markAsFailed(pendingReward.id, error.message, pendingReward.retry_count)

          // Log failure
          await this.logRewardAction(
            pendingReward.funding_id,
            pendingReward.id,
            "failed",
            null,
            null,
            null,
            null,
            error.message,
          )

          console.error(`[RewardWorker] Reward transfer failed for funding ${pendingReward.funding_id}:`, error)
          processed++
        }
      }

      if (processed > 0) {
        console.log(`[RewardWorker] Processed ${processed} rewards`)
      }
    } catch (error) {
      console.error("[RewardWorker] Error processing reward queue:", error)
    }
  }

  async logRewardAction(fundingId, queueId, action, txHash, rewardAmount, usdValue, gasUsed, errorMessage) {
    try {
      const query = `
        INSERT INTO reward_logs (
          funding_id, queue_id, action, tx_hash, reward_amount, 
          usd_value, gas_used, error_message, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `

      await this.pool.query(query, [fundingId, queueId, action, txHash, rewardAmount, usdValue, gasUsed, errorMessage])
    } catch (error) {
      console.error("Failed to log reward action:", error)
    }
  }
}

module.exports = RewardProcessorWorker
