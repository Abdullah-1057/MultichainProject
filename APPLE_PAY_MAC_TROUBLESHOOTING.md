# Apple Pay on Mac Mini - Troubleshooting Guide

## The Issue
You're seeing "Apple Pay is not available on this device" even though you're on a Mac Mini. This is a common issue with specific requirements.

## Why Apple Pay Might Not Work on Mac

### 1. **Browser Requirements** 🚨
- **MUST use Safari** - Apple Pay only works in Safari on macOS
- Chrome, Firefox, Edge, and other browsers are NOT supported
- Even if you have Apple Pay set up, it won't work in non-Safari browsers

### 2. **macOS Version Requirements**
- macOS 10.12 (Sierra) or later
- Check your version: Apple Menu → About This Mac

### 3. **Apple Pay Setup Requirements**
- Must have Apple Pay configured in System Preferences
- Must have at least one payment method added to Apple Wallet
- Must be signed in to iCloud

## Step-by-Step Fix

### Step 1: Check Your Browser
```bash
# Open Safari (not Chrome/Firefox/Edge)
# Go to: Safari → About Safari
# Check version (should be recent)
```

### Step 2: Set Up Apple Pay on Mac
1. **Open System Preferences** (or System Settings on newer macOS)
2. **Go to Wallet & Apple Pay**
3. **Click "Add Card"**
4. **Follow the setup process** to add a credit/debit card
5. **Verify the card** with your bank if required

### Step 3: Test Apple Pay
1. **Open Safari** (not Chrome/Firefox)
2. **Go to your app** (make sure it's HTTPS)
3. **Select Apple Pay** as payment method
4. **Try the payment flow**

### Step 4: Check HTTPS
- Apple Pay requires HTTPS
- Make sure your development server is running on HTTPS
- For local development, you might need to set up SSL

## Quick Test Commands

```bash
# Check if you're using Safari
echo "User Agent: $(curl -s -A "Mozilla/5.0" http://localhost:3000 | grep -o 'Safari')"

# Check macOS version
sw_vers

# Check if Apple Pay is configured
defaults read com.apple.ApplePay
```

## Alternative Solutions

### Option 1: Use Stripe Credit Card Instead
- Select "Credit Card" from the payment method dropdown
- This works in any browser
- Same security and functionality

### Option 2: Test on iOS Device
- Apple Pay works more reliably on iPhone/iPad
- Use Safari on iOS with Apple Pay set up

### Option 3: Set Up HTTPS for Development
```bash
# Install mkcert for local HTTPS
brew install mkcert

# Create local CA
mkcert -install

# Generate certificates
mkcert localhost 127.0.0.1 ::1

# Update your Next.js config to use HTTPS
```

## Debug Information

The updated component now shows:
- Current browser detection
- Specific requirements for your setup
- Step-by-step instructions for Mac users

## Still Having Issues?

1. **Check browser console** for detailed error messages
2. **Try a different Mac** with Apple Pay already set up
3. **Use the Stripe Credit Card option** as a fallback
4. **Test on an iOS device** for comparison

## Common Mistakes

❌ **Using Chrome/Firefox** - Apple Pay only works in Safari
❌ **Not having Apple Pay set up** - Must be configured in System Preferences
❌ **Using HTTP instead of HTTPS** - Apple Pay requires secure connection
❌ **Old macOS version** - Need macOS 10.12 or later

✅ **Use Safari browser**
✅ **Set up Apple Pay in System Preferences**
✅ **Use HTTPS connection**
✅ **Have valid payment method in Apple Wallet**
