import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Call your Motoko canister
    const canisterResponse = await fetch('https://ic0.app/api/v2/canister/y65zg-vaaaa-aaaap-anvnq-cai/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/cbor',
      },
      body: JSON.stringify({
        method: 'getReceiptAddress',
        args: [],
      }),
    });

    if (!canisterResponse.ok) {
      throw new Error(`Canister error: ${canisterResponse.status}`);
    }

    const result = await canisterResponse.json();
    return NextResponse.json({ address: result });
  } catch (error) {
    console.error('Error in getReceiptAddress API:', error);
    // Return the fallback address
    return NextResponse.json({ 
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" 
    });
  }
}
