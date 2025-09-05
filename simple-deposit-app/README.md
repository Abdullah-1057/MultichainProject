# Simple Deposit Address Generator

A super simple app that generates a new deposit address every hour for you to receive funds in MetaMask.

## What it does

1. **Connect MetaMask** - Just click connect
2. **Get New Address** - Fresh address every hour automatically  
3. **Receive Funds** - All funds go to your MetaMask wallet
4. **That's it!** - No complex setup, no backend needed

## How to use

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the app:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   - Go to `http://localhost:3000`
   - Connect your MetaMask
   - Get your hourly deposit address!

## Features

- ✅ **Super Simple** - Just connect and use
- ✅ **Hourly Rotation** - New address every hour
- ✅ **QR Code** - Easy to share
- ✅ **Copy Address** - One click copy
- ✅ **Time Counter** - See when next address comes
- ✅ **No Backend** - Everything runs in browser

## How it works

1. Uses your MetaMask address as a seed
2. Generates deterministic addresses for each hour
3. All addresses forward to your MetaMask wallet
4. New address every hour automatically

## Security

- Your private keys never leave MetaMask
- Addresses are generated deterministically
- No data is stored or sent anywhere
- Everything runs locally in your browser

## Build for production

```bash
npm run build
```

The built files will be in the `dist` folder - just upload them to any web server!

---

**That's it! Super simple deposit address generator. No complexity, just works!** 🚀
