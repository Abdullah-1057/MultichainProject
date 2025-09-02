import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Call your Motoko canister
    const canisterResponse = await fetch('https://ic0.app/api/v2/canister/y65zg-vaaaa-aaaap-anvnq-cai/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/cbor',
      },
      body: JSON.stringify({
        method: 'checkStatus',
        args: [body.transactionId],
      }),
    });

    if (!canisterResponse.ok) {
      throw new Error(`Canister error: ${canisterResponse.status}`);
    }

    const result = await canisterResponse.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in checkStatus API:', error);
    return NextResponse.json(
      { Error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
