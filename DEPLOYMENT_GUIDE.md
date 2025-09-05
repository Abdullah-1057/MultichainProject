# Hourly Rotating Payment Integration - Deployment Guide

## Overview
This guide explains how to deploy the hourly rotating payment functionality that has been integrated into your existing multi-chain funding project.

## What's Been Added

### 1. Smart Contracts
- **Forwarder.sol**: Receives ETH and immediately forwards to admin address
- **Factory.sol**: Creates Forwarder contracts using CREATE2 for deterministic addresses
- **Deploy Script**: Automatically deploys contracts and creates first forwarder

### 2. Frontend Component
- **HourlyPayment Component**: New React component with hourly rotating addresses
- **QR Code Support**: Generate QR codes for easy payment scanning
- **Real-time Updates**: Address changes every hour automatically
- **MetaMask Integration**: Direct wallet connection and payment sending

### 3. Dependencies Added
- `qrcode.react`: For QR code generation
- `@nomicfoundation/hardhat-toolbox`: For smart contract development
- `hardhat`: For contract compilation and deployment

## Deployment Steps

### Step 1: Deploy Smart Contracts

1. **Set up environment variables:**
   ```bash
   cd contracts
   cp env.example .env
   # Edit .env with your private key and RPC URLs
   ```

2. **Deploy to Sepolia (Testnet):**
   ```bash
   npm run deploy:sepolia
   ```

3. **Deploy to Mainnet (Production):**
   ```bash
   npm run deploy:mainnet
   ```

### Step 2: Update Frontend Configuration

After deployment, update the contract address in `components/hourly-payment.tsx`:

```typescript
// Replace this line:
const FACTORY_ADDRESS = '0x0000000000000000000000000000000000000000';

// With your deployed factory address:
const FACTORY_ADDRESS = '0xYourDeployedFactoryAddress';
```

### Step 3: Update Admin Address

Update the admin address in `components/hourly-payment.tsx`:

```typescript
// Replace with your admin wallet address:
const ADMIN_ADDRESS = '0xYourAdminWalletAddress';
```

## How It Works

### Address Rotation Logic
1. **Hour Buckets**: Addresses are generated based on UTC hour buckets (e.g., `2024-09-05T12:00:00Z`)
2. **Deterministic Generation**: Same hour bucket always generates the same address using CREATE2
3. **Automatic Forwarding**: All payments to generated addresses are immediately forwarded to admin
4. **Real-time Updates**: Frontend automatically generates new addresses every hour

### User Flow
1. User connects MetaMask wallet
2. System generates current hour's deposit address
3. User enters payment amount and sends ETH
4. Funds are automatically forwarded to admin address
5. Address changes automatically at the next hour

### Security Features
- **Gas Estimation**: Prevents failed transactions
- **Balance Validation**: Checks user has sufficient funds
- **Error Handling**: Comprehensive error messages
- **Transaction Confirmation**: Waits for blockchain confirmation

## Testing

### Local Testing
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Connect MetaMask and test the payment flow

### Testnet Testing
1. Deploy contracts to Sepolia
2. Update FACTORY_ADDRESS in the component
3. Test with Sepolia ETH from faucets

## Production Deployment

### Prerequisites
- Admin wallet with sufficient ETH for gas
- RPC provider (Infura, Alchemy, etc.)
- Private key for deployment

### Steps
1. Deploy contracts to mainnet
2. Update frontend with mainnet addresses
3. Test thoroughly on mainnet
4. Monitor contract events for payments

## Monitoring

### Contract Events
Monitor these events for payment tracking:
- `PaymentReceived`: When funds are received and forwarded
- `ForwarderCreated`: When new hourly addresses are created

### Admin Dashboard
The existing admin panel can be extended to show:
- Total payments received
- Payment history by hour
- Failed transactions
- Gas costs

## Troubleshooting

### Common Issues
1. **"Contract Not Deployed" Warning**: Update FACTORY_ADDRESS
2. **Transaction Failures**: Check gas limits and user balance
3. **Address Not Updating**: Verify hour bucket calculation
4. **MetaMask Connection Issues**: Check browser permissions

### Support
- Check browser console for detailed error messages
- Verify contract addresses are correct
- Ensure MetaMask is connected to the right network
- Check gas prices and network congestion

## Next Steps

1. **Deploy contracts** to your preferred network
2. **Update frontend** with deployed addresses
3. **Test thoroughly** before production use
4. **Monitor payments** and contract events
5. **Extend admin panel** for payment tracking

The integration is now complete and ready for deployment! 🚀
