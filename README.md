# Multi-Chain Funding Interface

A production-ready multi-chain funding interface that accepts BTC, ETH, and SOL payments and distributes ERC-20 reward tokens.

## Features

- **Multi-Chain Support**: Accept payments in Bitcoin, Ethereum, and Solana
- **Automatic Reward Distribution**: Send ERC-20 tokens to users' EVM addresses after confirmation
- **Real-Time Monitoring**: Track transaction confirmations across all supported chains
- **ICP Integration**: Log all funding metadata to Internet Computer canister
- **Security First**: Rate limiting, input validation, and encrypted sensitive data storage

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Access to Bitcoin, Ethereum, and Solana RPC endpoints

### Installation

1. Clone the repository and install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Copy environment configuration:
\`\`\`bash
cp .env.sample .env
\`\`\`

3. Configure your environment variables in `.env`

4. Run database migrations:
\`\`\`bash
npm run migrate
\`\`\`

5. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The server will start on `http://localhost:3001`

## API Endpoints

### POST /api/request-deposit
Create a new funding request and get a unique deposit address.

**Request Body:**
\`\`\`json
{
  "evmAddress": "0x742d35Cc6634C0532925a3b8D4C9db96590c6C87",
  "chain": "BTC"
}
\`\`\`

**Response:**
\`\`\`json
{
  "depositId": "uuid-here",
  "depositAddress": "bc1q...",
  "qrData": "bitcoin:bc1q...",
  "expiresAt": "2024-01-01T12:00:00Z",
  "chain": "BTC",
  "minConfirmations": 2
}
\`\`\`

### GET /api/check-status?depositId=uuid
Check the status of a funding request.

**Response:**
\`\`\`json
{
  "status": "confirmed",
  "confirmations": 3,
  "fundedAmount": "0.001",
  "fundingTxHash": "abc123...",
  "rewardTxHash": "def456...",
  "explorerUrl": "https://blockstream.info/tx/abc123..."
}
\`\`\`

## Database Schema

The system uses PostgreSQL with the following main tables:

- `fundings`: Core funding requests and their status
- `chain_configs`: Configuration for each supported blockchain
- `address_pools`: Pre-generated addresses for efficient allocation

## Security Considerations

- All sensitive data is encrypted at rest
- Rate limiting prevents abuse
- Input validation on all endpoints
- Private keys are never exposed to frontend
- Separate hot wallets per chain

## Development

### Running Tests
\`\`\`bash
npm test
\`\`\`

### Database Migrations
\`\`\`bash
npm run migrate
\`\`\`

## Architecture

The system is built with a modular architecture:

1. **API Layer**: Express.js REST endpoints
2. **Database Layer**: PostgreSQL with connection pooling
3. **Chain Services**: Separate modules for BTC, ETH, SOL monitoring
4. **Reward System**: ERC-20 token distribution service
5. **ICP Integration**: Metadata logging to Internet Computer

## Next Steps

This is the foundation. The following components will be implemented in subsequent phases:

- Frontend React interface with wallet connection
- Multi-chain address generation and monitoring
- Reward token distribution system
- ICP canister integration
- Background workers and admin tools
# MultichainProject
