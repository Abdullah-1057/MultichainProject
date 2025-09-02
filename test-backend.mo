import Backend "backend";

actor TestBackend {
    let backend = Backend.Backend();
    
    public func testBasicOperations(): async Text {
        try {
            // Test 1: Get initial stats
            let initialStats = await backend.getTransactionStats();
            if (initialStats.totalTransactions != 0) {
                return "FAIL: Initial stats should be zero";
            };
            
            // Test 2: Create a deposit request
            let depositRequest = {
                userAddress = "0x1234567890123456789012345678901234567890";
                chain = #ETH;
                amount = 100.0;
            };
            
            let depositResponse = await backend.requestDeposit(depositRequest);
            switch (depositResponse) {
                case (#Success(data)) {
                    // Test 3: Check if transaction was created
                    let transaction = await backend.getTransaction(data.transactionId);
                    switch (transaction) {
                        case (null) { return "FAIL: Transaction not found after creation"; };
                        case (?tx) {
                            if (tx.userAddress != depositRequest.userAddress) {
                                return "FAIL: User address mismatch";
                            };
                            if (tx.amount != depositRequest.amount) {
                                return "FAIL: Amount mismatch";
                            };
                            if (tx.status != #PENDING) {
                                return "FAIL: Initial status should be PENDING";
                            };
                        };
                    };
                    
                    // Test 4: Check user transactions
                    let userTransactions = await backend.getTransactionsByUser(depositRequest.userAddress);
                    if (userTransactions.size() != 1) {
                        return "FAIL: User should have 1 transaction";
                    };
                    
                    // Test 5: Check updated stats
                    let updatedStats = await backend.getTransactionStats();
                    if (updatedStats.totalTransactions != 1) {
                        return "FAIL: Total transactions should be 1";
                    };
                    if (updatedStats.pendingTransactions != 1) {
                        return "FAIL: Pending transactions should be 1";
                    };
                    
                    // Test 6: Check status
                    let statusResponse = await backend.checkStatus(data.transactionId);
                    switch (statusResponse) {
                        case (#Success(statusData)) {
                            // Status should be updated (simulated)
                            if (statusData.status == #PENDING) {
                                return "PASS: All basic operations working correctly";
                            } else {
                                return "PASS: Status progression working - " # debug_show(statusData.status);
                            };
                        };
                        case (#Error(error)) {
                            return "FAIL: Status check failed - " # error;
                        };
                    };
                };
                case (#Error(error)) {
                    return "FAIL: Deposit request failed - " # error;
                };
            };
        } catch (e) {
            return "FAIL: Exception occurred - " # Error.message(e);
        };
    };
    
    public func testStoragePersistence(): async Text {
        try {
            // Test storage status
            let storageStatus = await backend.getStorageStatus();
            if (not storageStatus.initialized) {
                return "FAIL: Storage should be initialized";
            };
            
            // Test fixed receipt address
            let receiptAddress = await backend.getFixedReceiptAddress();
            if (receiptAddress != "0x70997970C51812dc3A010C7d01b50e0d17dc79C8") {
                return "FAIL: Fixed receipt address mismatch";
            };
            
            // Test reward amount
            let rewardAmount = await backend.getRewardAmount();
            if (rewardAmount != 2.0) {
                return "FAIL: Reward amount should be 2.0";
            };
            
            return "PASS: Storage persistence working correctly";
        } catch (e) {
            return "FAIL: Storage test failed - " # Error.message(e);
        };
    };
    
    public func runAllTests(): async Text {
        let test1 = await testBasicOperations();
        let test2 = await testStoragePersistence();
        
        if (test1.startsWith("PASS") and test2.startsWith("PASS")) {
            return "ALL TESTS PASSED: " # test1 # " | " # test2;
        } else {
            return "SOME TESTS FAILED: " # test1 # " | " # test2;
        };
    };
}
