const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const { Pool } = require("pg")
const { v4: uuidv4 } = require("uuid")
const crypto = require("crypto")
require("dotenv").config()

const app = express()
const port = process.env.PORT || 3001

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Rate limiting
const limiter = rateLimit({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number.parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: "Too many requests, please try again later" },
})
app.use("/api/", limiter)

// Chain configurations
const CHAIN_CONFIG = {
  BTC: {
    name: "Bitcoin",
    minConfirmations: 2,
    explorer: "https://blockstream.info/tx/",
  },
  ETH: {
    name: "Ethereum",
    minConfirmations: 1,
    explorer: "https://etherscan.io/tx/",
  },
  SOL: {
    name: "Solana",
    minConfirmations: 1,
    explorer: "https://solscan.io/tx/",
  },
}

// Utility functions
const isValidEVMAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

const encryptSensitiveData = (data) => {
  const cipher = crypto.createCipher("aes-256-gcm", process.env.JWT_SECRET)
  let encrypted = cipher.update(data, "utf8", "hex")
  encrypted += cipher.final("hex")
  return encrypted
}

const BTCService = require("./services/btc-service")
const ETHService = require("./services/eth-service")
const SOLService = require("./services/sol-service")
const AddressPoolService = require("./services/address-pool-service")
const ChainMonitor = require("./services/chain-monitor")
const RewardService = require("./services/reward-service")
const RewardQueue = require("./services/reward-queue")

// Initialize chain monitor
const chainMonitor = new ChainMonitor()
const rewardService = new RewardService()
const rewardQueue = new RewardQueue()

// POST /api/request-deposit
app.post("/api/request-deposit", async (req, res) => {
  try {
    const { evmAddress, chain } = req.body

    // Validation
    if (!evmAddress || !isValidEVMAddress(evmAddress)) {
      return res.status(400).json({ error: "Invalid EVM address" })
    }

    if (!chain || !CHAIN_CONFIG[chain]) {
      return res.status(400).json({ error: "Invalid chain. Supported: BTC, ETH, SOL" })
    }

    // Generate unique deposit address (placeholder implementation)
    const depositAddress = await generateDepositAddress(chain)

    // Create funding record
    const fundingId = uuidv4()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    const query = `
      INSERT INTO fundings (
        id, evm_address, chain, deposit_address, status, 
        min_confirmations, expires_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, deposit_address, expires_at
    `

    const values = [
      fundingId,
      evmAddress.toLowerCase(),
      chain,
      depositAddress,
      "pending",
      CHAIN_CONFIG[chain].minConfirmations,
      expiresAt,
    ]

    const result = await pool.query(query, values)
    const funding = result.rows[0]

    // Generate QR code data
    const qrData = `${chain.toLowerCase()}:${depositAddress}`

    res.json({
      depositId: funding.id,
      depositAddress: funding.deposit_address,
      qrData,
      expiresAt: funding.expires_at,
      chain,
      minConfirmations: CHAIN_CONFIG[chain].minConfirmations,
    })
  } catch (error) {
    console.error("Error creating deposit request:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// GET /api/check-status
app.get("/api/check-status", async (req, res) => {
  try {
    const { depositId } = req.query

    if (!depositId) {
      return res.status(400).json({ error: "depositId is required" })
    }

    // Get funding record
    const query = `
      SELECT * FROM fundings WHERE id = $1
    `
    const result = await pool.query(query, [depositId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Funding request not found" })
    }

    const funding = result.rows[0]

    // Check if expired
    if (new Date() > new Date(funding.expires_at) && funding.status === "pending") {
      await pool.query("UPDATE fundings SET status = $1, updated_at = NOW() WHERE id = $2", ["expired", depositId])
      return res.json({ status: "expired" })
    }

    // Check chain for confirmations (placeholder implementation)
    if (funding.status === "pending") {
      const chainStatus = await checkChainStatus(funding)
      if (chainStatus.confirmed) {
        // Update funding record
        await pool.query(
          `
          UPDATE fundings SET 
            status = $1, 
            funded_amount = $2, 
            funding_tx_hash = $3, 
            confirmations = $4,
            updated_at = NOW()
          WHERE id = $5
        `,
          ["confirmed", chainStatus.amount, chainStatus.txHash, chainStatus.confirmations, depositId],
        )

        // Trigger reward transfer
        await triggerRewardTransfer(funding)
      }
    }

    // Return current status
    const updatedResult = await pool.query(query, [depositId])
    const updatedFunding = updatedResult.rows[0]

    res.json({
      status: updatedFunding.status,
      confirmations: updatedFunding.confirmations || 0,
      fundedAmount: updatedFunding.funded_amount,
      fundingTxHash: updatedFunding.funding_tx_hash,
      rewardTxHash: updatedFunding.reward_tx_hash,
      explorerUrl: updatedFunding.funding_tx_hash
        ? `${CHAIN_CONFIG[updatedFunding.chain].explorer}${updatedFunding.funding_tx_hash}`
        : null,
    })
  } catch (error) {
    console.error("Error checking status:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Placeholder functions (to be implemented in later tasks)
async function generateDepositAddress(chain) {
  try {
    const addressPoolService = new AddressPoolService()

    // Try to get pre-generated address first
    const pooledAddress = await addressPoolService.getUnusedAddress(chain)
    if (pooledAddress) {
      await addressPoolService.markAddressAsUsed(pooledAddress.address)
      return pooledAddress.address
    }

    // Generate new address if pool is empty
    let service
    switch (chain) {
      case "BTC":
        service = new BTCService()
        break
      case "ETH":
        service = new ETHService()
        break
      case "SOL":
        service = new SOLService()
        break
      default:
        throw new Error(`Unsupported chain: ${chain}`)
    }

    const addressData = await service.generateAddress()

    // Store in address pool
    await addressPoolService.storeAddress(
      chain,
      addressData.address,
      addressData.privateKey,
      addressData.derivationIndex,
    )

    await addressPoolService.markAddressAsUsed(addressData.address)
    return addressData.address
  } catch (error) {
    console.error(`Failed to generate ${chain} address:`, error)
    throw error
  }
}

async function checkChainStatus(funding) {
  try {
    const result = await chainMonitor.checkFundingStatus(funding)
    return result
  } catch (error) {
    console.error("Chain status check failed:", error)
    return { confirmed: false, amount: 0, txHash: null, confirmations: 0 }
  }
}

async function triggerRewardTransfer(funding) {
  try {
    console.log(`Triggering reward transfer for funding ${funding.id}`)

    // Check if reward already sent or queued
    if (funding.status === "reward_sent" || funding.reward_tx_hash) {
      console.log(`Reward already sent for funding ${funding.id}`)
      return
    }

    // Add to reward queue for processing
    const queueId = await rewardQueue.addToQueue(
      funding.id,
      funding.evm_address,
      funding.funded_amount,
      funding.chain,
      1, // High priority for immediate processing
    )

    if (queueId) {
      console.log(`Added funding ${funding.id} to reward queue: ${queueId}`)

      // Process immediately if possible
      await processRewardQueue()
    } else {
      console.log(`Funding ${funding.id} already in reward queue`)
    }
  } catch (error) {
    console.error(`Failed to trigger reward transfer for funding ${funding.id}:`, error)

    // Log the error
    await logRewardAction(funding.id, null, "failed", null, null, null, null, error.message)
  }
}

async function processRewardQueue() {
  try {
    const pendingReward = await rewardQueue.getNextPendingReward()

    if (!pendingReward) {
      return // No pending rewards
    }

    console.log(`Processing reward for funding ${pendingReward.funding_id}`)

    // Mark as processing
    const processingReward = await rewardQueue.markAsProcessing(pendingReward.id)
    if (!processingReward) {
      console.log(`Reward ${pendingReward.id} already being processed`)
      return
    }

    try {
      // Send reward tokens
      const result = await rewardService.sendRewardTokens(
        pendingReward.evm_address,
        pendingReward.funded_amount,
        pendingReward.chain,
        pendingReward.funding_id,
      )

      // Mark as completed
      await rewardQueue.markAsCompleted(pendingReward.id, result.txHash, result.rewardAmount)

      // Update funding record
      await pool.query(
        `UPDATE fundings SET status = 'reward_sent', reward_tx_hash = $1, updated_at = NOW() WHERE id = $2`,
        [result.txHash, pendingReward.funding_id],
      )

      // Log success
      await logRewardAction(
        pendingReward.funding_id,
        pendingReward.id,
        "completed",
        result.txHash,
        result.rewardAmount,
        result.usdValue,
        result.gasUsed,
        null,
      )

      console.log(`Reward sent successfully for funding ${pendingReward.funding_id}: ${result.txHash}`)
    } catch (error) {
      // Mark as failed
      await rewardQueue.markAsFailed(pendingReward.id, error.message, pendingReward.retry_count)

      // Log failure
      await logRewardAction(pendingReward.funding_id, pendingReward.id, "failed", null, null, null, null, error.message)

      console.error(`Reward transfer failed for funding ${pendingReward.funding_id}:`, error)
    }
  } catch (error) {
    console.error("Failed to process reward queue:", error)
  }
}

async function logRewardAction(fundingId, queueId, action, txHash, rewardAmount, usdValue, gasUsed, errorMessage) {
  try {
    const query = `
      INSERT INTO reward_logs (
        funding_id, queue_id, action, tx_hash, reward_amount, 
        usd_value, gas_used, error_message, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `

    await pool.query(query, [fundingId, queueId, action, txHash, rewardAmount, usdValue, gasUsed, errorMessage])
  } catch (error) {
    console.error("Failed to log reward action:", error)
  }
}

// POST /api/admin/pre-generate-addresses
app.post("/api/admin/pre-generate-addresses", async (req, res) => {
  try {
    const { chain, count = 10 } = req.body

    if (!chain || !CHAIN_CONFIG[chain]) {
      return res.status(400).json({ error: "Invalid chain" })
    }

    const addressPoolService = new AddressPoolService()
    const addresses = await addressPoolService.preGenerateAddresses(chain, count)

    res.json({
      success: true,
      chain,
      count: addresses.length,
      addresses,
    })
  } catch (error) {
    console.error("Failed to pre-generate addresses:", error)
    res.status(500).json({ error: "Failed to pre-generate addresses" })
  }
})

// GET /api/admin/chain-status
app.get("/api/admin/chain-status", async (req, res) => {
  try {
    const { chain } = req.query

    if (chain && CHAIN_CONFIG[chain]) {
      const status = await chainMonitor.getChainStatus(chain)
      res.json(status)
    } else {
      // Get status for all chains
      const statuses = await Promise.all([
        chainMonitor.getChainStatus("BTC"),
        chainMonitor.getChainStatus("ETH"),
        chainMonitor.getChainStatus("SOL"),
      ])

      res.json({
        timestamp: new Date().toISOString(),
        chains: statuses,
      })
    }
  } catch (error) {
    console.error("Failed to get chain status:", error)
    res.status(500).json({ error: "Failed to get chain status" })
  }
})

// POST /api/admin/batch-check-fundings
app.post("/api/admin/batch-check-fundings", async (req, res) => {
  try {
    // Get all pending fundings
    const query = `
      SELECT id, chain, deposit_address, min_confirmations, created_at
      FROM fundings 
      WHERE status = 'pending' AND expires_at > NOW()
      ORDER BY created_at ASC
      LIMIT 50
    `

    const result = await pool.query(query)
    const pendingFundings = result.rows

    if (pendingFundings.length === 0) {
      return res.json({ message: "No pending fundings to check", results: [] })
    }

    // Batch check all pending fundings
    const results = await chainMonitor.batchCheckFundings(pendingFundings)

    // Update database with results
    const updates = []
    for (const result of results) {
      if (result.confirmed) {
        const updateQuery = `
          UPDATE fundings SET 
            status = 'confirmed',
            funded_amount = $1,
            funding_tx_hash = $2,
            confirmations = $3,
            updated_at = NOW()
          WHERE id = $4 AND status = 'pending'
        `

        updates.push(pool.query(updateQuery, [result.amount, result.txHash, result.confirmations, result.fundingId]))
      }
    }

    // Execute all updates
    if (updates.length > 0) {
      await Promise.all(updates)
    }

    res.json({
      message: `Checked ${pendingFundings.length} pending fundings`,
      confirmed: results.filter((r) => r.confirmed).length,
      results: results,
    })
  } catch (error) {
    console.error("Batch check failed:", error)
    res.status(500).json({ error: "Batch check failed" })
  }
})

// POST /api/admin/process-reward-queue
app.post("/api/admin/process-reward-queue", async (req, res) => {
  try {
    await processRewardQueue()

    const stats = await rewardQueue.getQueueStats()
    res.json({
      message: "Reward queue processed",
      stats,
    })
  } catch (error) {
    console.error("Failed to process reward queue:", error)
    res.status(500).json({ error: "Failed to process reward queue" })
  }
})

// POST /api/admin/retry-failed-rewards
app.post("/api/admin/retry-failed-rewards", async (req, res) => {
  try {
    const failedRewards = await rewardQueue.getFailedRewards()

    if (failedRewards.length === 0) {
      return res.json({ message: "No failed rewards to retry" })
    }

    const retryResults = []
    for (const reward of failedRewards) {
      try {
        await rewardQueue.retryFailedReward(reward.id)
        retryResults.push({ fundingId: reward.funding_id, status: "queued_for_retry" })
      } catch (error) {
        retryResults.push({ fundingId: reward.funding_id, status: "retry_failed", error: error.message })
      }
    }

    // Process the queue after retrying
    await processRewardQueue()

    res.json({
      message: `Retried ${failedRewards.length} failed rewards`,
      results: retryResults,
    })
  } catch (error) {
    console.error("Failed to retry failed rewards:", error)
    res.status(500).json({ error: "Failed to retry failed rewards" })
  }
})

// GET /api/admin/reward-info
app.get("/api/admin/reward-info", async (req, res) => {
  try {
    const tokenInfo = await rewardService.getTokenInfo()
    const queueStats = await rewardQueue.getQueueStats()

    res.json({
      tokenInfo,
      queueStats,
      configuration: {
        rewardMultiplier: process.env.REWARD_MULTIPLIER || "1.0",
        minFundingAmountUSD: process.env.MIN_FUNDING_AMOUNT_USD || "10",
      },
    })
  } catch (error) {
    console.error("Failed to get reward info:", error)
    res.status(500).json({ error: "Failed to get reward info" })
  }
})

// GET /api/admin/reward-estimate
app.get("/api/admin/reward-estimate", async (req, res) => {
  try {
    const { amount, chain } = req.query

    if (!amount || !chain || !CHAIN_CONFIG[chain]) {
      return res.status(400).json({ error: "amount and valid chain required" })
    }

    const estimate = await rewardService.estimateRewardCost(amount, chain)
    res.json(estimate)
  } catch (error) {
    console.error("Failed to estimate reward:", error)
    res.status(500).json({ error: "Failed to estimate reward" })
  }
})

// GET /api/admin/worker-status
app.get("/api/admin/worker-status", async (req, res) => {
  try {
    const query = `
      SELECT worker_name, status, last_heartbeat, processed_count, 
             error_count, metadata, started_at
      FROM worker_health 
      ORDER BY worker_name
    `

    const result = await pool.query(query)
    const workers = result.rows

    // Check if workers are healthy (heartbeat within last 2 minutes)
    const now = new Date()
    const healthyThreshold = 2 * 60 * 1000 // 2 minutes

    const workersWithHealth = workers.map((worker) => ({
      ...worker,
      isHealthy: worker.last_heartbeat && now - new Date(worker.last_heartbeat) < healthyThreshold,
      lastHeartbeatAgo: worker.last_heartbeat ? Math.floor((now - new Date(worker.last_heartbeat)) / 1000) : null,
    }))

    res.json({
      timestamp: now.toISOString(),
      workers: workersWithHealth,
      summary: {
        total: workers.length,
        running: workersWithHealth.filter((w) => w.status === "running").length,
        healthy: workersWithHealth.filter((w) => w.isHealthy).length,
        errors: workersWithHealth.reduce((sum, w) => sum + (w.error_count || 0), 0),
      },
    })
  } catch (error) {
    console.error("Failed to get worker status:", error)
    res.status(500).json({ error: "Failed to get worker status" })
  }
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error)
  res.status(500).json({ error: "Internal server error" })
})

app.listen(port, () => {
  console.log(`Multi-chain funding server running on port ${port}`)
})

module.exports = app
