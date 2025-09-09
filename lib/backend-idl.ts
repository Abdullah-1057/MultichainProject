// IDL Factory for the Motoko Backend
// This is generated from the Motoko backend's Candid interface

import { IDL } from '@dfinity/candid';

export const idlFactory = ({ IDL }: { IDL: any }) => {
  const ChainType = IDL.Variant({
    'ETH': IDL.Null,
    'BTC': IDL.Null,
    'SOL': IDL.Null,
    'POLYGON': IDL.Null,
    'ARBITRUM': IDL.Null,
    'OPTIMISM': IDL.Null,
    'STRIPE': IDL.Null,
    'APPLE_PAY': IDL.Null,
  });

  const TransactionStatus = IDL.Variant({
    'PENDING': IDL.Null,
    'CONFIRMED': IDL.Null,
    'REWARD_SENT': IDL.Null,
    'FAILED': IDL.Null,
    'EXPIRED': IDL.Null,
    'PAID': IDL.Null,
  });

  const Transaction = IDL.Record({
    'id': IDL.Text,
    'userAddress': IDL.Text,
    'depositAddress': IDL.Text,
    'chain': ChainType,
    'amount': IDL.Float64,
    'status': TransactionStatus,
    'createdAt': IDL.Int,
    'confirmedAt': IDL.Opt(IDL.Int),
    'rewardSentAt': IDL.Opt(IDL.Int),
    'fundingTxHash': IDL.Opt(IDL.Text),
    'rewardTxHash': IDL.Opt(IDL.Text),
    'explorerUrl': IDL.Opt(IDL.Text),
  });

  const FundingRequest = IDL.Record({
    'userAddress': IDL.Text,
    'chain': ChainType,
    'amount': IDL.Float64,
  });

  const FundingResponse = IDL.Variant({
    'Success': IDL.Record({
      'transactionId': IDL.Text,
      'depositAddress': IDL.Text,
      'qrData': IDL.Text,
      'expiresAt': IDL.Int,
      'minConfirmations': IDL.Nat,
    }),
    'Error': IDL.Text,
  });

  const StatusResponse = IDL.Variant({
    'Success': IDL.Record({
      'status': TransactionStatus,
      'confirmations': IDL.Nat,
      'fundedAmount': IDL.Opt(IDL.Float64),
      'fundingTxHash': IDL.Opt(IDL.Text),
      'rewardTxHash': IDL.Opt(IDL.Text),
      'explorerUrl': IDL.Opt(IDL.Text),
    }),
    'Error': IDL.Text,
  });

  const TransactionStats = IDL.Record({
    'totalTransactions': IDL.Nat,
    'pendingTransactions': IDL.Nat,
    'confirmedTransactions': IDL.Nat,
    'rewardSentTransactions': IDL.Nat,
    'failedTransactions': IDL.Nat,
    'expiredTransactions': IDL.Nat,
    'totalRewardAmount': IDL.Float64,
  });

  // Certificates
  const Certificate = IDL.Record({
    'id': IDL.Text,
    'userAddress': IDL.Text,
    'recipientName': IDL.Text,
    'courseName': IDL.Text,
    'issuedAt': IDL.Int,
    'verificationCode': IDL.Text,
    'pdfBase64': IDL.Text,
    'transactionId': IDL.Opt(IDL.Text),
  });

  const StorageStatus = IDL.Record({
    'initialized': IDL.Bool,
    'transactionCount': IDL.Nat,
    'userCount': IDL.Nat,
    'nextId': IDL.Nat,
  });

  return IDL.Service({
    'requestDeposit': IDL.Func([FundingRequest], [FundingResponse], []),
    'checkStatus': IDL.Func([IDL.Text], [StatusResponse], []),
    'sendReward': IDL.Func([IDL.Text], [IDL.Variant({ 'ok': IDL.Text, 'err': IDL.Text })], []),
    'getTransaction': IDL.Func([IDL.Text], [IDL.Opt(Transaction)], ['query']),
    'getAllTransactions': IDL.Func([], [IDL.Vec(Transaction)], ['query']),
    'getTransactionsByUser': IDL.Func([IDL.Text], [IDL.Vec(Transaction)], ['query']),
    'getTransactionStats': IDL.Func([], [TransactionStats], ['query']),
    'getFixedReceiptAddress': IDL.Func([], [IDL.Text], ['query']),
    'getRewardAmount': IDL.Func([], [IDL.Float64], ['query']),
    'getStorageStatus': IDL.Func([], [StorageStatus], ['query']),
    'markAsPaid': IDL.Func([IDL.Text], [IDL.Variant({ 'ok': IDL.Text, 'err': IDL.Text })], []),
    'clearExpiredTransactions': IDL.Func([], [IDL.Nat], []),
    'resetAllTransactions': IDL.Func([], [], []),
    'saveToStableMemory': IDL.Func([], [], []),
    'loadFromStableMemory': IDL.Func([], [], []),
    // Certificates
    'createCertificate': IDL.Func([
      IDL.Text, // userAddress
      IDL.Text, // recipientName
      IDL.Text, // courseName
      IDL.Text, // verificationCode
      IDL.Text, // pdfBase64
      IDL.Opt(IDL.Text), // transactionId
    ], [IDL.Text], []),
    'getCertificate': IDL.Func([IDL.Text], [IDL.Opt(Certificate)], ['query']),
    'getCertificatesByUser': IDL.Func([IDL.Text], [IDL.Vec(Certificate)], ['query']),
  });
};
