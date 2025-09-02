# Multi-Chain Funding Interface Setup Guide

## Quick Start

1. **Install Dependencies**
   \`\`\`bash
   npm install
   npm run setup
   \`\`\`

2. **Environment Setup**
   Copy `.env.sample` to `.env` and configure:
   \`\`\`bash
   cp backend/.env.sample backend/.env
   \`\`\`

3. **Database Setup**
   - Add Neon integration in Project Settings
   - Run migrations: `cd backend && npm run migrate`

4. **Start Development**
   \`\`\`bash
   npm run dev:full
   \`\`\`
   This starts:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Background Workers: Automatic monitoring

## Environment Variables

### Required
- `DATABASE_URL` - Neon PostgreSQL connection
- `JWT_SECRET` - Random 32+ character string
- `ETH_RPC_URL` - Ethereum RPC endpoint
- `SOL_RPC_URL` - Solana RPC endpoint

### Optional (for full functionality)
- `BITCOIN_RPC_URL` - Bitcoin Core RPC
- `REWARD_TOKEN_ADDRESS` - ERC-20 token contract
- `ICP_CANISTER_ID` - Internet Computer canister

## Architecture

- **Frontend**: Next.js 14 with Tailwind CSS
- **Backend**: Express.js with PostgreSQL
- **Chains**: BTC, ETH, SOL address generation and monitoring
- **Rewards**: Cross-chain ERC-20 token distribution
- **Logging**: ICP canister integration for audit trails

## API Endpoints

- `POST /api/request-deposit` - Generate deposit address
- `GET /api/check-status` - Check funding status
- `GET /admin/stats` - System statistics
- `POST /admin/process-rewards` - Manual reward processing

## Security Features

- Rate limiting (100 requests/15min)
- Input validation and sanitization
- Encrypted private key storage
- CORS protection
- Helmet security headers

## Monitoring

Background workers automatically:
- Monitor blockchain confirmations
- Process reward distributions
- Clean up expired requests
- Log to ICP canister
- Retry failed operations

## Troubleshooting

1. **Connection Issues**: Check RPC endpoints and API keys
2. **Database Errors**: Verify Neon integration and migrations
3. **Worker Issues**: Check logs in `backend/logs/`
4. **Frontend Issues**: Ensure backend is running on port 3001

For support, check the logs or contact the development team.
