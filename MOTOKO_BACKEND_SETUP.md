# Motoko Backend Setup Guide

This guide explains how to set up and deploy the Motoko backend for your multi-chain funding platform.

## 🏗️ Backend Architecture

### Core Features
- **Stable Memory Storage**: Data persists across canister upgrades using stable memory + HashMap
- **Transaction Storage**: Stores all funding transactions with full history
- **Fixed Receipt Address**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **$2 Reward System**: Automatic $2 reward for each successful transaction
- **Multi-Chain Support**: Bitcoin, Ethereum, Solana, Polygon, Arbitrum, Optimism
- **Real-time Status**: Transaction status tracking and updates
- **Performance Optimized**: Fast HashMap operations with persistent storage

### Key Components

#### 1. Stable Memory Architecture
```motoko
// Stable Storage (persists across upgrades)
private stable var transactions_stable: [(TransactionId, Transaction)] = [];
private stable var nextTransactionId_stable: Nat = 1;
private stable var userTransactions_stable: [(Text, [TransactionId])] = [];
private stable var stats_stable: (Nat, Nat, Nat, Nat, Nat, Nat, Float) = (0, 0, 0, 0, 0, 0, 0.0);

// Runtime Storage (loaded from stable memory)
private var transactions: HashMap.HashMap<TransactionId, Transaction>;
private var nextTransactionId: Nat;
private var userTransactions: HashMap.HashMap<Text, [TransactionId]>;
private var stats: (Nat, Nat, Nat, Nat, Nat, Nat, Float);
```

#### 2. Transaction Management
```motoko
public type Transaction = {
  id: TransactionId;
  userAddress: Text;
  depositAddress: Text;
  chain: ChainType;
  amount: Float;
  status: TransactionStatus;
  createdAt: Time.Time;
  confirmedAt: ?Time.Time;
  rewardSentAt: ?Time.Time;
  fundingTxHash: ?Text;
  rewardTxHash: ?Text;
  explorerUrl: ?Text;
};
```

#### 3. Fixed Receipt Address
- **Address**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Purpose**: All reward tokens are sent to this address
- **Amount**: $2 USD worth of tokens per successful transaction

#### 4. Chain Support
- **EVM Chains**: Ethereum, Polygon, Arbitrum, Optimism
- **Bitcoin**: Native Bitcoin support
- **Solana**: Native Solana support

## 🚀 Deployment Options

### Option 1: Internet Computer (Recommended)
Deploy directly to the Internet Computer blockchain:

```bash
# Install DFX (Internet Computer SDK)
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Initialize your project
dfx new multi-chain-funding-backend
cd multi-chain-funding-backend

# Replace the default main.mo with our backend.mo
cp ../backend.mo src/multi_chain_funding_backend/main.mo

# Deploy to local network
dfx start --background
dfx deploy

# Deploy to mainnet
dfx deploy --network ic
```

### Option 2: Local Development
Run locally for development and testing:

```bash
# Install DFX
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Start local replica
dfx start --background

# Deploy backend
dfx deploy multi-chain-funding-backend

# Get canister ID
dfx canister id multi-chain-funding-backend
```

### Option 3: Mock Backend (Current Implementation)
The current implementation uses a TypeScript mock that simulates the Motoko backend:

```typescript
// lib/motoko-backend.ts
export class MotokoBackendService {
  // Mock implementation for development
  // Replace with actual IC calls in production
}
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file:

```bash
# Internet Computer Configuration
NEXT_PUBLIC_IC_HOST=https://ic0.app
NEXT_PUBLIC_BACKEND_CANISTER_ID=your-canister-id

# Fixed Receipt Address (configured in backend.mo)
FIXED_RECEIPT_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8

# Reward Amount (configured in backend.mo)
REWARD_AMOUNT_USD=2.0
```

### Backend Configuration
The backend is configured with these constants:

```motoko
private let FIXED_RECEIPT_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
private let REWARD_AMOUNT_USD = 2.0; // $2 reward per successful transaction
private let TRANSACTION_EXPIRY_MINUTES = 30; // 30 minutes expiry
```

## 📡 API Endpoints

### Core Functions

#### 1. Request Deposit
```motoko
public func requestDeposit(request: FundingRequest): async FundingResponse
```
- Creates a new deposit request
- Generates unique deposit address
- Returns transaction ID and deposit details

#### 2. Check Status
```motoko
public func checkStatus(transactionId: TransactionId): async StatusResponse
```
- Checks transaction status
- Returns current state and confirmations
- Automatically progresses transaction states

#### 3. Send Reward
```motoko
public func sendReward(transactionId: TransactionId): async Result.Result<Text, Text>
```
- Sends $2 reward to fixed receipt address
- Updates transaction status to REWARD_SENT
- Returns success/failure status

### Admin Functions

#### 1. Get All Transactions
```motoko
public func getAllTransactions(): async [Transaction]
```

#### 2. Get User Transactions
```motoko
public func getTransactionsByUser(userAddress: Text): async [Transaction]
```

#### 3. Get Statistics
```motoko
public func getTransactionStats(): async TransactionStats
```

#### 4. Clear Expired Transactions
```motoko
public func clearExpiredTransactions(): async Nat
```

## 🔄 Transaction Flow

### 1. User Initiates Funding
```
User → Frontend → requestDeposit() → Backend
```

### 2. Backend Creates Transaction
```
Backend → Generate Address → Store Transaction → Return Details
```

### 3. User Sends Funds
```
User → Blockchain → Deposit Address
```

### 4. Status Monitoring
```
Frontend → checkStatus() → Backend → Blockchain → Status Update
```

### 5. Reward Distribution
```
Backend → Detect Confirmation → sendReward() → Fixed Address
```

## 🛡️ Security Features

### 1. Stable Memory Persistence
- **Data Safety**: All data persists across canister upgrades
- **No Data Loss**: Transactions and user data are preserved
- **Automatic Backup**: Data is automatically saved before upgrades
- **Consistent State**: Data integrity maintained across operations

### 2. Transaction Validation
- All transactions are validated before processing
- Address validation for all supported chains
- Amount validation and limits

### 3. Fixed Receipt Address
- Hardcoded receipt address prevents manipulation
- All rewards go to the same secure address
- Transparent reward distribution

### 4. Transaction Expiry
- 30-minute expiry for pending transactions
- Automatic cleanup of expired transactions
- Prevents stale transaction states

### 5. Error Handling
- Comprehensive error handling for all operations
- User-friendly error messages
- Graceful failure recovery

## ⚡ Performance Benefits

### 1. Stable Memory + HashMap Architecture
- **Fast Runtime Operations**: HashMap provides O(1) average lookup time
- **Persistent Storage**: Data survives canister upgrades
- **Memory Efficient**: Only stable memory used during upgrades
- **Optimized Queries**: Direct user transaction mapping

### 2. Real-time Statistics
- **Pre-calculated Stats**: No need to scan all transactions
- **Instant Access**: Statistics available in O(1) time
- **Accurate Counts**: Real-time updates with every transaction
- **Memory Efficient**: Stats stored in stable memory

### 3. User Transaction Optimization
- **Direct Mapping**: User address → transaction IDs mapping
- **Fast Queries**: No need to scan all transactions for user data
- **Efficient Retrieval**: O(1) access to user transaction lists
- **Scalable**: Performance doesn't degrade with more transactions

## 📊 Monitoring & Analytics

### Transaction Statistics
The backend provides comprehensive statistics:

```motoko
public type TransactionStats = {
  totalTransactions: Nat;
  pendingTransactions: Nat;
  confirmedTransactions: Nat;
  rewardSentTransactions: Nat;
  failedTransactions: Nat;
  expiredTransactions: Nat;
  totalRewardAmount: Float;
};
```

### Real-time Updates
- Transaction status updates in real-time
- Automatic reward distribution
- Explorer link generation for all transactions

## 🔧 Frontend Integration

### TypeScript Interface
```typescript
// lib/motoko-backend.ts
export class MotokoBackendService {
  async requestDeposit(request: FundingRequest): Promise<FundingResponse>
  async checkStatus(transactionId: string): Promise<StatusResponse>
  async sendReward(transactionId: string): Promise<{success: boolean}>
  async getTransactionsByUser(userAddress: string): Promise<Transaction[]>
  async getTransactionStats(): Promise<TransactionStats>
}
```

### Usage Example
```typescript
const motokoBackend = MotokoBackendService.getInstance()

// Request deposit
const response = await motokoBackend.requestDeposit({
  userAddress: "0x...",
  chain: "ETH",
  amount: 100.0
})

// Check status
const status = await motokoBackend.checkStatus(response.data.transactionId)
```

## 🚀 Production Deployment

### 1. Deploy to Internet Computer
```bash
# Deploy to mainnet
dfx deploy --network ic

# Get canister ID
dfx canister id multi-chain-funding-backend --network ic
```

### 2. Update Frontend Configuration
```typescript
// Update the service to use real IC calls
const BACKEND_CANISTER_ID = process.env.NEXT_PUBLIC_BACKEND_CANISTER_ID
```

### 3. Configure Domain
```bash
# Set up custom domain
dfx canister update-settings multi-chain-funding-backend \
  --controller $(dfx identity get-principal) \
  --network ic
```

## 🔍 Testing

### Local Testing
```bash
# Test with local replica
dfx start --background
dfx deploy
dfx canister call multi-chain-funding-backend getTransactionStats
```

### Integration Testing
```typescript
// Test the full flow
const response = await motokoBackend.requestDeposit({
  userAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  chain: "ETH",
  amount: 10.0
})

// Verify transaction was created
const status = await motokoBackend.checkStatus(response.data.transactionId)
```

## 📈 Performance Optimization

### 1. Caching
- Transaction data is cached in memory
- Efficient HashMap storage for fast lookups
- Minimal database operations

### 2. Batch Operations
- Batch transaction status updates
- Efficient bulk operations for admin functions
- Optimized data structures

### 3. Error Recovery
- Automatic retry mechanisms
- Graceful degradation
- Comprehensive logging

## 🔧 Maintenance

### Regular Tasks
1. **Clear Expired Transactions**: Run `clearExpiredTransactions()` periodically
2. **Monitor Statistics**: Check transaction stats for anomalies
3. **Update Dependencies**: Keep Motoko and DFX updated
4. **Backup Data**: Regular backups of transaction data

### Monitoring
- Track transaction success rates
- Monitor reward distribution
- Watch for failed transactions
- Analyze user patterns

This backend provides a robust, scalable foundation for your multi-chain funding platform with automatic reward distribution to the fixed receipt address.
