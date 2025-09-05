// Quick test to verify the mapping functions work correctly
// This simulates the variant types returned by the Motoko backend

// Simulate the mapping functions
function mapMotokoStatus(motokoStatus) {
  console.log('Mapping status:', motokoStatus);
  
  if (!motokoStatus) return 'PENDING';
  
  // Handle string format first
  if (typeof motokoStatus === 'string') {
    return motokoStatus;
  }
  
  // Handle variant format: {PENDING: null} or {PAID: null}
  if (typeof motokoStatus === 'object' && motokoStatus !== null) {
    if ('PENDING' in motokoStatus) return 'PENDING';
    if ('CONFIRMED' in motokoStatus) return 'CONFIRMED';
    if ('REWARD_SENT' in motokoStatus) return 'REWARD_SENT';
    if ('FAILED' in motokoStatus) return 'FAILED';
    if ('EXPIRED' in motokoStatus) return 'EXPIRED';
    if ('PAID' in motokoStatus) return 'PAID';
  }
  
  console.warn('Unknown status format:', motokoStatus);
  return 'PENDING';
}

function mapMotokoChain(motokoChain) {
  console.log('Mapping chain:', motokoChain);
  
  if (!motokoChain) return 'ETH';
  
  // Handle string format first
  if (typeof motokoChain === 'string') {
    return motokoChain;
  }
  
  // Handle variant format: {ETH: null}, {SOL: null}, {BTC: null}
  if (typeof motokoChain === 'object' && motokoChain !== null) {
    if ('ETH' in motokoChain) return 'ETH';
    if ('BTC' in motokoChain) return 'BTC';
    if ('SOL' in motokoChain) return 'SOL';
    if ('POLYGON' in motokoChain) return 'POLYGON';
    if ('ARBITRUM' in motokoChain) return 'ARBITRUM';
    if ('OPTIMISM' in motokoChain) return 'OPTIMISM';
  }
  
  // Handle array format [chain, null]
  if (Array.isArray(motokoChain) && motokoChain.length > 0) {
    const chainName = motokoChain[0];
    if (typeof chainName === 'string') {
      return chainName;
    }
  }
  
  console.warn('Unknown chain format:', motokoChain);
  return 'ETH';
}

// Test cases based on the image description
console.log('Testing status mapping:');
console.log('{PENDING: null} ->', mapMotokoStatus({PENDING: null}));
console.log('{PAID: null} ->', mapMotokoStatus({PAID: null}));
console.log('"PENDING" ->', mapMotokoStatus("PENDING"));

console.log('\nTesting chain mapping:');
console.log('{ETH: null} ->', mapMotokoChain({ETH: null}));
console.log('{SOL: null} ->', mapMotokoChain({SOL: null}));
console.log('"ETH" ->', mapMotokoChain("ETH"));

console.log('\nAll tests completed!');
