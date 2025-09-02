-- Create the fundings table for storing multi-chain funding requests
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS fundings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evm_address VARCHAR(42) NOT NULL,
    chain VARCHAR(10) NOT NULL CHECK (chain IN ('BTC', 'ETH', 'SOL')),
    deposit_address VARCHAR(100) NOT NULL,
    deposit_memo TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'reward_sent', 'expired', 'failed')),
    min_confirmations INTEGER NOT NULL DEFAULT 1,
    funded_amount DECIMAL(20, 8) DEFAULT 0,
    funding_tx_hash VARCHAR(100),
    confirmations INTEGER DEFAULT 0,
    reward_tx_hash VARCHAR(100),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    audit JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fundings_status ON fundings(status);
CREATE INDEX IF NOT EXISTS idx_fundings_chain ON fundings(chain);
CREATE INDEX IF NOT EXISTS idx_fundings_evm_address ON fundings(evm_address);
CREATE INDEX IF NOT EXISTS idx_fundings_deposit_address ON fundings(deposit_address);
CREATE INDEX IF NOT EXISTS idx_fundings_expires_at ON fundings(expires_at);
CREATE INDEX IF NOT EXISTS idx_fundings_created_at ON fundings(created_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_fundings_updated_at 
    BEFORE UPDATE ON fundings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create table for storing chain-specific configuration
CREATE TABLE IF NOT EXISTS chain_configs (
    chain VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    min_confirmations INTEGER NOT NULL DEFAULT 1,
    explorer_url VARCHAR(200) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default chain configurations
INSERT INTO chain_configs (chain, name, min_confirmations, explorer_url) VALUES
('BTC', 'Bitcoin', 2, 'https://blockstream.info/tx/'),
('ETH', 'Ethereum', 1, 'https://etherscan.io/tx/'),
('SOL', 'Solana', 1, 'https://solscan.io/tx/')
ON CONFLICT (chain) DO NOTHING;

-- Create table for storing deposit address pools (for pre-generated addresses)
CREATE TABLE IF NOT EXISTS address_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain VARCHAR(10) NOT NULL,
    address VARCHAR(100) NOT NULL,
    private_key_encrypted TEXT,
    derivation_index INTEGER,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_address_pools_chain_unused ON address_pools(chain, is_used) WHERE is_used = false;
