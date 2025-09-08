#!/usr/bin/env node

/**
 * Environment variable validation script
 * Checks if all required environment variables are set
 */

const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
];

const optionalEnvVars = [
  'STRIPE_WEBHOOK_SECRET',
  'DATABASE_URL',
  'JWT_SECRET'
];

console.log('🔍 Checking environment variables...\n');

let allRequired = true;

// Check required variables
console.log('📋 Required variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`  ❌ ${varName}: NOT SET`);
    allRequired = false;
  }
});

console.log('\n📋 Optional variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`  ⚠️  ${varName}: NOT SET (optional)`);
  }
});

console.log('\n' + '='.repeat(50));

if (allRequired) {
  console.log('🎉 All required environment variables are set!');
  console.log('✅ Your Stripe integration should work correctly.');
} else {
  console.log('❌ Some required environment variables are missing!');
  console.log('\n🔧 To fix this:');
  console.log('1. Create a .env.local file in your project root');
  console.log('2. Add the missing variables:');
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`   ${varName}=your_value_here`);
    }
  });
  console.log('3. Restart your development server');
  console.log('\n💡 For production deployment:');
  console.log('   Set these variables in your hosting platform\'s environment settings');
}

process.exit(allRequired ? 0 : 1);
