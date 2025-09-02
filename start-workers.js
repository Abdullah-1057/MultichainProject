const WorkerManager = require("./workers/worker-manager")

const workerManager = new WorkerManager()

async function main() {
  try {
    console.log("Multi-chain funding background workers starting...")
    await workerManager.startAll()
    console.log("Background workers are running. Press Ctrl+C to stop.")
  } catch (error) {
    console.error("Failed to start background workers:", error)
    process.exit(1)
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  process.exit(1)
})

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
  process.exit(1)
})

main()
