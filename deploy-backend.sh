#!/bin/bash

# Deploy Motoko Backend Script
echo "🚀 Deploying Motoko Backend..."

# Check if DFX is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ DFX is not installed. Please install it first:"
    echo "sh -ci \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
    exit 1
fi

# Check if we're already in a DFX project
if [ ! -f "dfx.json" ]; then
    echo "❌ dfx.json not found. Please run this script from the project root."
    exit 1
fi

# Start DFX replica if not running
echo "🔄 Starting DFX replica..."
dfx start --background --clean

# Wait a moment for replica to start
sleep 5

# Deploy the canister
echo "📦 Deploying canister..."
dfx deploy multi_chain_funding_backend

# Get the canister ID
CANISTER_ID=$(dfx canister id multi_chain_funding_backend)
echo "✅ Canister deployed with ID: $CANISTER_ID"

# Test the canister
echo "🧪 Testing canister..."
dfx canister call multi_chain_funding_backend getTransactionStats

echo "🎉 Deployment complete!"
echo "Canister ID: $CANISTER_ID"
echo "You can now update your frontend to use this canister ID."
