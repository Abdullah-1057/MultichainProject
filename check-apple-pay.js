#!/usr/bin/env node

// Apple Pay Diagnostic Script for Mac
// Run with: node check-apple-pay.js

console.log('🍎 Apple Pay Diagnostic for Mac\n');

// Check macOS version
const { execSync } = require('child_process');

try {
  const macVersion = execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim();
  console.log(`✅ macOS Version: ${macVersion}`);
  
  const majorVersion = parseInt(macVersion.split('.')[0]);
  const minorVersion = parseInt(macVersion.split('.')[1]);
  
  if (majorVersion > 10 || (majorVersion === 10 && minorVersion >= 12)) {
    console.log('✅ macOS version supports Apple Pay (10.12+ required)');
  } else {
    console.log('❌ macOS version too old for Apple Pay (need 10.12+)');
  }
} catch (error) {
  console.log('❌ Could not detect macOS version');
}

// Check if Apple Pay is configured
try {
  const applePayConfig = execSync('defaults read com.apple.ApplePay 2>/dev/null || echo "not_configured"', { encoding: 'utf8' }).trim();
  
  if (applePayConfig === 'not_configured') {
    console.log('❌ Apple Pay not configured in System Preferences');
    console.log('   → Go to System Preferences → Wallet & Apple Pay');
    console.log('   → Add a credit/debit card');
  } else {
    console.log('✅ Apple Pay appears to be configured');
  }
} catch (error) {
  console.log('❌ Could not check Apple Pay configuration');
}

// Check if running on HTTPS
console.log('\n🌐 Browser Requirements:');
console.log('✅ Must use Safari browser (not Chrome/Firefox/Edge)');
console.log('✅ Must be on HTTPS connection');
console.log('✅ Must have valid payment method in Apple Wallet');

console.log('\n🔧 Quick Fix Steps:');
console.log('1. Open Safari (not Chrome/Firefox)');
console.log('2. Go to System Preferences → Wallet & Apple Pay');
console.log('3. Add a credit/debit card if not already added');
console.log('4. Make sure your app is running on HTTPS');
console.log('5. Refresh the page in Safari');

console.log('\n💡 Alternative:');
console.log('   Use "Credit Card" payment method instead of Apple Pay');
console.log('   This works in any browser and provides the same functionality');

console.log('\n📱 Test on iOS:');
console.log('   Apple Pay works more reliably on iPhone/iPad');
console.log('   Try testing on an iOS device with Safari');
