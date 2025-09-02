-- Create reward queue table for managing reward token distribution
CREATE TABLE IF NOT EXISTS reward_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funding_id UUID NOT NULL REFERENCES fundings(id),
    evm_address VARCHAR(42) NOT NULL,
    funded_amount DECIMAL(20, 8) NOT NULL,
    chain VARCHAR(10) NOT NULL,
    priority INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    tx_hash VARCHAR(100),
    reward_amount DECIMAL(20, 8),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure one reward per funding
    UNIQUE(funding_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reward_queue_status ON reward_queue(status);
CREATE INDEX IF NOT EXISTS idx_reward_queue_priority ON reward_queue(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_reward_queue_funding_id ON reward_queue(funding_id);
CREATE INDEX IF NOT EXISTS idx_reward_queue_evm_address ON reward_queue(evm_address);
CREATE INDEX IF NOT EXISTS idx_reward_queue_created_at ON reward_queue(created_at);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_reward_queue_updated_at 
    BEFORE UPDATE ON reward_queue 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create table for reward distribution logs
CREATE TABLE IF NOT EXISTS reward_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funding_id UUID NOT NULL REFERENCES fundings(id),
    queue_id UUID REFERENCES reward_queue(id),
    action VARCHAR(50) NOT NULL, -- 'queued', 'processing', 'completed', 'failed', 'retried'
    tx_hash VARCHAR(100),
    reward_amount DECIMAL(20, 8),
    usd_value DECIMAL(10, 2),
    gas_used BIGINT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for reward logs
CREATE INDEX IF NOT EXISTS idx_reward_logs_funding_id ON reward_logs(funding_id);
CREATE INDEX IF NOT EXISTS idx_reward_logs_action ON reward_logs(action);
CREATE INDEX IF NOT EXISTS idx_reward_logs_created_at ON reward_logs(created_at);
