#!/bin/bash

echo "🚀 Production Deployment Script"
echo "================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy env.example to .env and fill in your details."
    exit 1
fi

# Load environment variables
source .env

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building frontend..."
npm run build

echo "📋 Deployment Summary:"
echo "======================"
echo "✅ Frontend built successfully"
echo "📁 Build files in: dist/"
echo ""
echo "🌐 Next steps:"
echo "1. Deploy contracts: cd contracts && npm run deploy:sepolia"
echo "2. Update FACTORY_ADDRESS in src/App.jsx"
echo "3. Upload dist/ folder to your hosting service"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
echo ""
echo "🎉 Ready for production!"
