#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔗 WalletConnect Setup Script');
console.log('============================\n');

console.log('This script will help you set up WalletConnect for your project.');
console.log('You need a WalletConnect Project ID to use WalletConnect wallets.\n');

console.log('Steps to get your Project ID:');
console.log('1. Go to https://cloud.walletconnect.com/');
console.log('2. Sign up or log in');
console.log('3. Create a new project');
console.log('4. Copy your Project ID\n');

rl.question('Enter your WalletConnect Project ID: ', (projectId) => {
  if (!projectId || projectId.trim() === '') {
    console.log('❌ No Project ID provided. Exiting...');
    rl.close();
    return;
  }

  const envContent = `# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${projectId.trim()}

# Optional: Add your own RPC endpoints for better performance
# NEXT_PUBLIC_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-project-id
# NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/your-project-id
# NEXT_PUBLIC_ARBITRUM_RPC_URL=https://arbitrum-mainnet.infura.io/v3/your-project-id
# NEXT_PUBLIC_OPTIMISM_RPC_URL=https://optimism-mainnet.infura.io/v3/your-project-id
`;

  const envPath = path.join(process.cwd(), '.env.local');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local file created successfully!');
    console.log('🚀 You can now use WalletConnect wallets in your application.');
    console.log('\nNext steps:');
    console.log('1. Restart your development server');
    console.log('2. Test wallet connections');
    console.log('3. Deploy to production with your Project ID');
  } catch (error) {
    console.log('❌ Error creating .env.local file:', error.message);
  }

  rl.close();
});
