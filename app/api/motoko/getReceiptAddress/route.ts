import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock implementation for now - in production this would call your Motoko canister
    // Return a fixed receipt address for rewards
    return NextResponse.json({ 
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" 
    });
  } catch (error) {
    console.error('Error in getReceiptAddress API:', error);
    // Return the fallback address
    return NextResponse.json({ 
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" 
    });
  }
}
