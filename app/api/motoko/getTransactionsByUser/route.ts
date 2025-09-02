import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Mock implementation for now - in production this would call your Motoko canister
    const mockTransactions = [
      {
        id: `tx_${Date.now()}_1`,
        userAddress: body.userAddress,
        chain: 'ETH',
        amount: 2.0,
        status: 'confirmed',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        rewardAmount: 2.0,
        rewardTxHash: `0x${Math.random().toString(16).substr(2, 64)}`
      },
      {
        id: `tx_${Date.now()}_2`,
        userAddress: body.userAddress,
        chain: 'BASE',
        amount: 5.0,
        status: 'pending',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        rewardAmount: 2.0,
        rewardTxHash: null
      }
    ];

    return NextResponse.json(mockTransactions);
  } catch (error) {
    console.error('Error in getTransactionsByUser API:', error);
    return NextResponse.json(
      { Error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
