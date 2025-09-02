// Fixes for the live backend.mo file
// Add these functions to replace the commented-out ones

// Fixed getTransactionsByUser function
public func getTransactionsByUser(userAddress : Text) : async [Transaction] {
  // Initialize storage if not already done
  initializeStorage();

  switch (userTransactions.get(userAddress)) {
    case (null) { [] };
    case (?transactionIds) {
      let userTransactionList = Array.filterMap<TransactionId, Transaction>(
        transactionIds,
        func(id) = transactions.get(id),
      );
      userTransactionList;
    };
  };
};

// Fixed updateStats function
private func updateStats(transaction : Transaction, oldStatus : ?TransactionStatus) {
  let (total, pending, confirmed, rewardSent, failed, expired, totalReward) = stats;

  // Remove old status from stats if it exists
  switch (oldStatus) {
    case (null) {};
    case (?status) {
      switch (status) {
        case (#PENDING) { pending -= 1 };
        case (#CONFIRMED) { confirmed -= 1 };
        case (#REWARD_SENT) {
          rewardSent -= 1;
          totalReward -= REWARD_AMOUNT_USD;
        };
        case (#FAILED) { failed -= 1 };
        case (#EXPIRED) { expired -= 1 };
      };
    };
  };

  // Add new status to stats
  switch (transaction.status) {
    case (#PENDING) {
      pending += 1;
      if (oldStatus == null) { total += 1 };
    };
    case (#CONFIRMED) {
      confirmed += 1;
      if (oldStatus == null) { total += 1 };
    };
    case (#REWARD_SENT) {
      rewardSent += 1;
      totalReward += REWARD_AMOUNT_USD;
      if (oldStatus == null) { total += 1 };
    };
    case (#FAILED) {
      failed += 1;
      if (oldStatus == null) { total += 1 };
    };
    case (#EXPIRED) {
      expired += 1;
      if (oldStatus == null) { total += 1 };
    };
  };

  stats := (total, pending, confirmed, rewardSent, failed, expired, totalReward);
};

// Fixed clearExpiredTransactions function
public func clearExpiredTransactions() : async Nat {
  // Initialize storage if not already done
  initializeStorage();

  var clearedCount = 0;
  let expiredIds = Array.filter<TransactionId>(
    Iter.toArray(transactions.keys()),
    func(id) = switch (transactions.get(id)) {
      case (null) { false };
      case (?transaction) {
        isTransactionExpired(transaction) and transaction.status == #EXPIRED;
      };
    },
  );

  for (id in expiredIds.vals()) {
    switch (transactions.get(id)) {
      case (null) {};
      case (?transaction) {
        // Remove from user transactions mapping
        switch (userTransactions.get(transaction.userAddress)) {
          case (null) {};
          case (?userTxIds) {
            let filteredIds = Array.filter<TransactionId>(
              userTxIds,
              func(txId) = txId != id,
            );
            if (filteredIds.size() == 0) {
              userTransactions.delete(transaction.userAddress);
            } else {
              userTransactions.put(transaction.userAddress, filteredIds);
            };
          };
        };

        // Update stats (remove from stats since we're deleting)
        let (total, pending, confirmed, rewardSent, failed, expired, totalReward) = stats;
        let newStats = switch (transaction.status) {
          case (#PENDING) {
            (total - 1, pending - 1, confirmed, rewardSent, failed, expired, totalReward);
          };
          case (#CONFIRMED) {
            (total - 1, pending, confirmed - 1, rewardSent, failed, expired, totalReward);
          };
          case (#REWARD_SENT) {
            (total - 1, pending, confirmed, rewardSent - 1, failed, expired, totalReward - REWARD_AMOUNT_USD);
          };
          case (#FAILED) {
            (total - 1, pending, confirmed, rewardSent, failed - 1, expired, totalReward);
          };
          case (#EXPIRED) {
            (total - 1, pending, confirmed, rewardSent, failed, expired - 1, totalReward);
          };
        };
        stats := newStats;

        // Remove transaction
        transactions.delete(id);
        clearedCount += 1;
      };
    };
  };

  clearedCount;
};
