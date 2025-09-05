# Production Deployment Guide

## 🚀 Quick Start (5 minutes)

### 1. Deploy Smart Contracts

```bash
# Install contract dependencies
cd contracts
npm install

# Set your private key (for deployment)
export PRIVATE_KEY="your_private_key_here"

# Deploy to Sepolia testnet
npm run deploy:sepolia

# Or deploy to mainnet
npm run deploy:mainnet
```

### 2. Update Frontend

After deployment, copy the contract addresses and update `src/App.jsx`:

```javascript
const FACTORY_ADDRESS = '0x...' // Copy from deployment output
const ADMIN_ADDRESS = '0x...'   // Your admin wallet address
```

### 3. Build and Deploy Frontend

```bash
# Install frontend dependencies
npm install

# Build for production
npm run build

# Deploy to any hosting service (Vercel, Netlify, etc.)
# Upload the 'dist' folder contents
```

## 📋 What This Does

### For Users:
1. **Connect MetaMask** - Users connect their wallet
2. **See rotating address** - New address every hour
3. **Send payment** - Funds go to rotating address
4. **Automatic forwarding** - Funds forwarded to admin

### For Admin:
1. **Deploy contracts** - One-time setup
2. **Receive funds** - All payments forwarded to your wallet
3. **Hourly rotation** - New addresses every hour automatically

## 🔧 Technical Details

### Smart Contracts:
- **Factory.sol** - Creates rotating forwarder contracts
- **Forwarder.sol** - Receives payments and forwards to admin
- **CREATE2** - Deterministic addresses for each hour

### Security:
- ✅ **No private keys** in frontend
- ✅ **Real blockchain addresses** (not fake)
- ✅ **Automatic forwarding** to admin
- ✅ **Hourly rotation** for security

## 🌐 Deployment Options

### Frontend Hosting:
- **Vercel** (recommended)
- **Netlify**
- **GitHub Pages**
- **Any static hosting**

### Contract Networks:
- **Sepolia** (testnet)
- **Ethereum Mainnet** (production)
- **Polygon** (cheaper fees)

## 💰 Cost Estimation

### Contract Deployment:
- **Factory**: ~0.01 ETH
- **First Forwarder**: ~0.005 ETH
- **Total**: ~0.015 ETH (~$30)

### Per Transaction:
- **User payment**: Normal gas fee
- **Forwarder creation**: ~0.005 ETH (once per hour)

## 🎯 Production Ready Features

- ✅ **Real blockchain integration**
- ✅ **Automatic address rotation**
- ✅ **Fund forwarding to admin**
- ✅ **QR code generation**
- ✅ **Mobile responsive**
- ✅ **Error handling**
- ✅ **Fallback to admin address**

## 📞 Support

If you need help with deployment, contact me with:
1. Your admin wallet address
2. Preferred network (Sepolia/Mainnet)
3. Any deployment errors

**This is production-ready code that will work for your clients!** 🚀
