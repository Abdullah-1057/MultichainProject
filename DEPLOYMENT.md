# Multi-Chain Funding Interface - Deployment Guide

## Overview
This guide covers deploying the complete multi-chain funding interface with frontend, backend, and background workers.

## Prerequisites

### Environment Setup
1. **Node.js** 18+ and npm
2. **PostgreSQL** 14+ database
3. **Blockchain RPC Access**:
   - Bitcoin: bitcoind RPC or public RPC
   - Ethereum: Infura/Alchemy/local node
   - Solana: RPC endpoint
4. **ICP Canister** (optional but recommended)

### Required Environment Variables

\`\`\`bash
# Server Configuration
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/funding_db

# Security
JWT_SECRET=your-super-secret-jwt-key-here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Bitcoin Configuration
BITCOIN_RPC_URL=http://localhost:8332
BITCOIN_RPC_USER=your-rpc-user
BITCOIN_RPC_PASS=your-rpc-password
BTC_XPUB=xpub... # Optional: for address derivation
BTC_DERIVATION_PATH=m/84'/0'/0' # Optional

# Ethereum Configuration
ETH_RPC_URL=https://mainnet.infura.io/v3/your-project-id
ETH_MASTER_SEED=your-eth-master-seed-phrase
REWARD_TOKEN_ADDRESS=0x... # ERC-20 token contract
REWARD_TREASURY_PRIVATE_KEY=0x... # Treasury wallet private key
REWARD_TOKEN_DECIMALS=18
ETHERSCAN_API_KEY=your-etherscan-api-key

# Solana Configuration
SOL_RPC_URL=https://api.mainnet-beta.solana.com
SOL_MASTER_SEED=your-sol-master-seed-phrase

# Reward System
REWARD_MULTIPLIER=1.0 # 1:1 USD conversion
MIN_FUNDING_AMOUNT_USD=10

# ICP Integration
ICP_CANISTER_ID=your-canister-id
ICP_HOST=https://ic0.app
ICP_IDENTITY_PATH=/path/to/identity.pem # Optional
\`\`\`

## Deployment Steps

### 1. Database Setup

\`\`\`bash
# Create database
createdb funding_db

# Run migrations
npm run migrate

# Run additional migrations
psql $DATABASE_URL -f scripts/002-create-reward-queue-table.sql
psql $DATABASE_URL -f scripts/003-create-icp-logs-table.sql
psql $DATABASE_URL -f scripts/004-create-worker-monitoring-table.sql
\`\`\`

### 2. Address Pool Pre-generation

\`\`\`bash
# Pre-generate addresses for better performance
npm run pre-generate
\`\`\`

### 3. Start Services

#### Option A: Development Mode
\`\`\`bash
# Terminal 1: Start API server
npm run dev

# Terminal 2: Start background workers
npm run workers:dev

# Terminal 3: Start frontend (if separate)
cd frontend && npm run dev
\`\`\`

#### Option B: Production Mode
\`\`\`bash
# Start API server
npm start

# Start background workers (in separate process/container)
npm run workers
\`\`\`

### 4. Docker Deployment (Recommended)

\`\`\`dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["npm", "start"]
\`\`\`

\`\`\`yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: funding_db
      POSTGRES_USER: funding_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://funding_user:secure_password@postgres:5432/funding_db
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - postgres
    restart: unless-stopped

  workers:
    build: .
    command: npm run workers
    environment:
      - DATABASE_URL=postgresql://funding_user:secure_password@postgres:5432/funding_db
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - postgres
      - api
    restart: unless-stopped

volumes:
  postgres_data:
\`\`\`

### 5. Monitoring & Health Checks

The system includes comprehensive monitoring:

- **API Health**: `GET /api/health`
- **Chain Status**: `GET /api/admin/chain-status`
- **Worker Health**: Database table `worker_health`
- **Admin Dashboard**: `/admin` (frontend)

### 6. Security Considerations

1. **Private Keys**: Store securely, use environment variables
2. **Database**: Use connection pooling and SSL in production
3. **Rate Limiting**: Configured per environment
4. **CORS**: Configure for your frontend domain
5. **Helmet**: Security headers enabled

### 7. Scaling Considerations

- **Horizontal Scaling**: Multiple API instances behind load balancer
- **Worker Scaling**: Single worker instance recommended (database coordination)
- **Database**: Connection pooling, read replicas for analytics
- **Caching**: Redis for frequently accessed data

## Troubleshooting

### Common Issues

1. **Address Generation Fails**
   - Check RPC connectivity
   - Verify seed phrases/private keys
   - Ensure sufficient entropy

2. **Reward Transfers Fail**
   - Check treasury wallet balance
   - Verify token contract address
   - Monitor gas prices

3. **Chain Monitoring Issues**
   - Verify RPC endpoints
   - Check API rate limits
   - Monitor network connectivity

### Logs and Debugging

\`\`\`bash
# View API logs
docker-compose logs -f api

# View worker logs
docker-compose logs -f workers

# Database queries for debugging
psql $DATABASE_URL -c "SELECT * FROM fundings WHERE status = 'pending';"
psql $DATABASE_URL -c "SELECT * FROM worker_health;"
\`\`\`

## Maintenance

### Regular Tasks

1. **Database Cleanup**: Automated via cleanup worker
2. **Address Pool Refill**: Monitor and refill as needed
3. **Log Rotation**: Configure log management
4. **Backup**: Regular database backups
5. **Security Updates**: Keep dependencies updated

### Monitoring Alerts

Set up alerts for:
- Worker health status
- Failed reward transfers
- Low token balance
- High error rates
- Database connection issues

## Support

For issues and support:
1. Check logs and error messages
2. Verify environment configuration
3. Test individual components
4. Review blockchain network status
5. Contact development team with detailed error information
