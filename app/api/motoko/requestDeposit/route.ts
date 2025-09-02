import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Mock implementation for now - in production this would call your Motoko canister
    const mockResponse = {
      success: true,
      data: {
        transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        depositAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        qrData: `0x${Math.random().toString(16).substr(2, 40)}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        minConfirmations: body.chain === 'ETH' ? 12 : 6,
        chain: body.chain,
        amount: body.amount
      }
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error in requestDeposit API:', error);
    return NextResponse.json(
      { Error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
