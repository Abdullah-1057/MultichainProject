const { Pool } = require("pg")

class RewardQueue {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    })
  }

  async addToQueue(fundingId, evmAddress, fundedAmount, chain, priority = 0) {
    try {
      const query = `
        INSERT INTO reward_queue (
          funding_id, evm_address, funded_amount, chain, priority, 
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
        ON CONFLICT (funding_id) DO NOTHING
        RETURNING id
      `

      const values = [fundingId, evmAddress, fundedAmount, chain, priority]
      const result = await this.pool.query(query, values)

      return result.rows.length > 0 ? result.rows[0].id : null
    } catch (error) {
      console.error("Failed to add to reward queue:", error)
      throw error
    }
  }

  async getNextPendingReward() {
    try {
      const query = `
        SELECT * FROM reward_queue 
        WHERE status = 'pending' 
        ORDER BY priority DESC, created_at ASC 
        LIMIT 1
      `

      const result = await this.pool.query(query)
      return result.rows[0] || null
    } catch (error) {
      console.error("Failed to get next pending reward:", error)
      throw error
    }
  }

  async markAsProcessing(queueId) {
    try {
      const query = `
        UPDATE reward_queue 
        SET status = 'processing', updated_at = NOW() 
        WHERE id = $1 AND status = 'pending'
        RETURNING *
      `

      const result = await this.pool.query(query, [queueId])
      return result.rows[0] || null
    } catch (error) {
      console.error("Failed to mark as processing:", error)
      throw error
    }
  }

  async markAsCompleted(queueId, txHash, rewardAmount) {
    try {
      const query = `
        UPDATE reward_queue 
        SET status = 'completed', tx_hash = $2, reward_amount = $3, 
            completed_at = NOW(), updated_at = NOW()
        WHERE id = $1
      `

      await this.pool.query(query, [queueId, txHash, rewardAmount])
    } catch (error) {
      console.error("Failed to mark as completed:", error)
      throw error
    }
  }

  async markAsFailed(queueId, errorMessage, retryCount = 0) {
    try {
      const query = `
        UPDATE reward_queue 
        SET status = 'failed', error_message = $2, retry_count = $3, 
            updated_at = NOW()
        WHERE id = $1
      `

      await this.pool.query(query, [queueId, errorMessage, retryCount])
    } catch (error) {
      console.error("Failed to mark as failed:", error)
      throw error
    }
  }

  async getFailedRewards(maxRetries = 3) {
    try {
      const query = `
        SELECT * FROM reward_queue 
        WHERE status = 'failed' AND retry_count < $1
        ORDER BY updated_at ASC
        LIMIT 10
      `

      const result = await this.pool.query(query, [maxRetries])
      return result.rows
    } catch (error) {
      console.error("Failed to get failed rewards:", error)
      return []
    }
  }

  async retryFailedReward(queueId) {
    try {
      const query = `
        UPDATE reward_queue 
        SET status = 'pending', retry_count = retry_count + 1, 
            error_message = NULL, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `

      const result = await this.pool.query(query, [queueId])
      return result.rows[0] || null
    } catch (error) {
      console.error("Failed to retry reward:", error)
      throw error
    }
  }

  async getQueueStats() {
    try {
      const query = `
        SELECT 
          status,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time
        FROM reward_queue 
        GROUP BY status
      `

      const result = await this.pool.query(query)
      return result.rows
    } catch (error) {
      console.error("Failed to get queue stats:", error)
      return []
    }
  }
}

module.exports = RewardQueue
