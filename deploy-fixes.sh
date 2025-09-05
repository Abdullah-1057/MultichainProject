#!/bin/bash

# Deploy Backend Fixes Script
echo "🚀 Deploying Backend Fixes..."

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

# Deploy the canister with the fixes
echo "📦 Deploying canister with fixes..."
dfx deploy multi_chain_funding_backend

# Get the canister ID
CANISTER_ID=$(dfx canister id multi_chain_funding_backend)
echo "✅ Canister deployed with ID: $CANISTER_ID"

# Test the canister functions
echo "🧪 Testing canister functions..."

echo "Testing getAllTransactions..."
dfx canister call multi_chain_funding_backend getAllTransactions

echo "Testing getTransactionsByUser..."
dfx canister call multi_chain_funding_backend getTransactionsByUser '("0x23f8f22bc0ed154a9ea7cb581c6e15ed93be9708")'

echo "Testing markAsPaid..."
dfx canister call multi_chain_funding_backend markAsPaid '("tx_1")'

echo "🎉 Deployment complete!"
echo "Canister ID: $CANISTER_ID"
echo ""
echo "🔧 Fixed Issues:"
echo "✅ getAllTransactions - Now a query function"
echo "✅ getTransactionsByUser - Now a query function" 
echo "✅ getTransaction - Now a query function"
echo "✅ markAsPaid - Added new function"
echo "✅ PAID status - Added new status"
echo ""
echo "📝 Next Steps:"
echo "1. Update your frontend canister ID if it changed"
echo "2. Test the My Tokens section"
echo "3. Test the Mark as Paid functionality"
