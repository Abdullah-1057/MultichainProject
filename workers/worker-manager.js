const ChainMonitorWorker = require("./chain-monitor-worker")
const RewardProcessorWorker = require("./reward-processor-worker")
const CleanupWorker = require("./cleanup-worker")

class WorkerManager {
  constructor() {
    this.workers = {
      chainMonitor: new ChainMonitorWorker(),
      rewardProcessor: new RewardProcessorWorker(),
      cleanup: new CleanupWorker(),
    }
    this.isRunning = false
  }

  async startAll() {
    if (this.isRunning) {
      console.log("Workers already running")
      return
    }

    console.log("Starting all background workers...")

    try {
      await Promise.all([
        this.workers.chainMonitor.start(),
        this.workers.rewardProcessor.start(),
        this.workers.cleanup.start(),
      ])

      this.isRunning = true
      console.log("All background workers started successfully")

      // Handle graceful shutdown
      process.on("SIGINT", () => this.stopAll())
      process.on("SIGTERM", () => this.stopAll())
    } catch (error) {
      console.error("Failed to start workers:", error)
      await this.stopAll()
      throw error
    }
  }

  async stopAll() {
    if (!this.isRunning) return

    console.log("Stopping all background workers...")

    try {
      await Promise.all([
        this.workers.chainMonitor.stop(),
        this.workers.rewardProcessor.stop(),
        this.workers.cleanup.stop(),
      ])

      this.isRunning = false
      console.log("All background workers stopped")
    } catch (error) {
      console.error("Error stopping workers:", error)
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      workers: Object.keys(this.workers).map((name) => ({
        name,
        running: this.workers[name].isRunning || false,
      })),
    }
  }
}

module.exports = WorkerManager
