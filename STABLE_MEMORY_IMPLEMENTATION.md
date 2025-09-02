# Stable Memory Implementation for Motoko Backend

This document explains the stable memory implementation in the Motoko backend, which ensures data persistence across canister upgrades.

## 🏗️ Architecture Overview

### Stable Memory Structure
The backend uses a combination of stable memory and HashMap management for optimal performance and data persistence:

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

## 🔄 Data Flow

### 1. **Initialization**
```motoko
private func initializeStorage() {
    if (transactions_stable.size() > 0) {
        // Load from stable memory
        transactions := HashMap.fromIter<TransactionId, Transaction>(
            transactions_stable.vals(), 
            transactions_stable.size(), 
            Text.equal, 
            Text.hash
        );
        // ... load other data structures
    } else {
        // Initialize empty storage
        transactions := HashMap.HashMap<TransactionId, Transaction>(0, Text.equal, Text.hash);
        // ... initialize other data structures
    };
}
```

### 2. **Runtime Operations**
- All operations use the runtime HashMap for fast access
- Data is automatically saved to stable memory during upgrades
- Statistics are maintained in real-time

### 3. **Upgrade Process**
```motoko
system func preupgrade() {
    // Save current state to stable memory before upgrade
    transactions_stable := Iter.toArray(transactions.entries());
    nextTransactionId_stable := nextTransactionId;
    userTransactions_stable := Iter.toArray(userTransactions.entries());
    stats_stable := stats;
};

system func postupgrade() {
    // Load state from stable memory after upgrade
    transactions := HashMap.fromIter<TransactionId, Transaction>(
        transactions_stable.vals(), 
        transactions_stable.size(), 
        Text.equal, 
        Text.hash
    );
    // ... load other data structures
    
    // Clear stable arrays to free memory
    transactions_stable := [];
    userTransactions_stable := [];
};
```

## 📊 Data Structures

### 1. **Transaction Storage**
- **Primary Storage**: HashMap for fast lookups by transaction ID
- **Stable Backup**: Array of tuples for persistence
- **User Mapping**: HashMap mapping user addresses to transaction IDs

### 2. **Statistics Tracking**
- **Real-time Updates**: Statistics are updated with every transaction change
- **Persistent Storage**: Stats are saved to stable memory
- **Efficient Access**: No need to recalculate statistics

### 3. **User Transaction Mapping**
- **Fast User Queries**: Direct mapping from user address to transaction IDs
- **Efficient Retrieval**: No need to scan all transactions for user data
- **Persistent Storage**: User mappings are preserved across upgrades

## 🚀 Key Features

### ✅ **Data Persistence**
- All transaction data survives canister upgrades
- User transaction mappings are preserved
- Statistics are maintained across upgrades
- No data loss during system updates

### ✅ **Performance Optimization**
- Runtime operations use fast HashMap access
- Statistics are pre-calculated and cached
- User queries are optimized with direct mapping
- Minimal memory overhead

### ✅ **Automatic Management**
- Automatic save/load during upgrades
- Real-time statistics updates
- Efficient memory management
- Clean separation of concerns

## 🔧 API Functions

### **Core Functions**
```motoko
// All core functions automatically initialize storage
public func requestDeposit(request: FundingRequest): async FundingResponse
public func checkStatus(transactionId: TransactionId): async StatusResponse
public func sendReward(transactionId: TransactionId): async Result.Result<Text, Text>
public func getTransaction(transactionId: TransactionId): async ?Transaction
public func getAllTransactions(): async [Transaction]
public func getTransactionsByUser(userAddress: Text): async [Transaction]
public func getTransactionStats(): async TransactionStats
```

### **Admin Functions**
```motoko
// Manual persistence control
public func saveToStableMemory(): async ()
public func loadFromStableMemory(): async ()

// Data management
public func clearExpiredTransactions(): async Nat
public func resetAllTransactions(): async ()
```

### **System Functions**
```motoko
// Automatic upgrade handling
system func preupgrade()
system func postupgrade()
```

## 📈 Performance Benefits

### **Fast Runtime Operations**
- HashMap lookups: O(1) average case
- User transaction queries: O(1) with direct mapping
- Statistics access: O(1) with pre-calculated values
- No need to scan all data for queries

### **Efficient Memory Usage**
- Stable memory only used for persistence
- Runtime memory optimized for performance
- Automatic cleanup after upgrades
- Minimal memory fragmentation

### **Scalable Architecture**
- Handles large numbers of transactions
- Efficient user query patterns
- Optimized for high-frequency operations
- Memory usage scales linearly

## 🛡️ Data Integrity

### **Consistency Guarantees**
- All operations maintain data consistency
- Statistics are always accurate
- User mappings are kept in sync
- Transaction states are properly tracked

### **Error Handling**
- Graceful handling of storage initialization
- Automatic recovery from upgrade failures
- Consistent state across all operations
- No partial updates or corruption

### **Backup and Recovery**
- Automatic backup before upgrades
- Complete state restoration after upgrades
- Manual save/load functions for testing
- No data loss scenarios

## 🔍 Monitoring and Debugging

### **Statistics Tracking**
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

### **Debug Functions**
```motoko
// Manual persistence for testing
public func saveToStableMemory(): async ()
public func loadFromStableMemory(): async ()

// Data inspection
public func getTransaction(transactionId: TransactionId): async ?Transaction
public func getAllTransactions(): async [Transaction]
public func getTransactionsByUser(userAddress: Text): async [Transaction]
```

## 🚀 Deployment Considerations

### **Upgrade Process**
1. **Pre-upgrade**: All data is automatically saved to stable memory
2. **Upgrade**: Canister code is updated
3. **Post-upgrade**: Data is automatically restored from stable memory
4. **Cleanup**: Stable memory arrays are cleared to free space

### **Memory Management**
- Stable memory is only used during upgrades
- Runtime memory is optimized for performance
- Automatic cleanup prevents memory leaks
- Efficient data structures minimize overhead

### **Performance Monitoring**
- Statistics provide real-time insights
- User transaction patterns are trackable
- System performance is optimized
- Memory usage is predictable

## 📚 Usage Examples

### **Basic Operations**
```motoko
// Create transaction (automatically initializes storage)
let response = await requestDeposit({
    userAddress = "0x...";
    chain = #ETH;
    amount = 100.0;
});

// Check status (uses optimized HashMap lookup)
let status = await checkStatus(response.transactionId);

// Get user transactions (uses direct mapping)
let userTxs = await getTransactionsByUser("0x...");
```

### **Admin Operations**
```motoko
// Manual persistence (for testing)
await saveToStableMemory();
await loadFromStableMemory();

// Data management
let cleared = await clearExpiredTransactions();
await resetAllTransactions();
```

### **Statistics Access**
```motoko
// Get real-time statistics
let stats = await getTransactionStats();
// Returns: { totalTransactions, pendingTransactions, ... }
```

## 🎯 Benefits Summary

### **For Developers**
- **Simple API**: All functions work transparently with stable memory
- **No Manual Management**: Automatic save/load during upgrades
- **Performance**: Fast runtime operations with HashMap
- **Reliability**: Data persistence guaranteed

### **For Users**
- **Data Safety**: No data loss during system updates
- **Fast Queries**: Optimized user transaction retrieval
- **Real-time Stats**: Accurate statistics and monitoring
- **Consistent Experience**: Reliable data access

### **For Operations**
- **Upgrade Safety**: Seamless canister upgrades
- **Memory Efficiency**: Optimized memory usage
- **Monitoring**: Real-time statistics and insights
- **Maintenance**: Easy data management and cleanup

This stable memory implementation provides a robust, scalable, and efficient foundation for the multi-chain funding platform with guaranteed data persistence across canister upgrades.
