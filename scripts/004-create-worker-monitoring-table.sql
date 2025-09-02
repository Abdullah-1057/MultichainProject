-- Worker monitoring and health check table
CREATE TABLE IF NOT EXISTS worker_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_name VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'stopped', -- running, stopped, error
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_error TEXT,
  processed_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient worker lookups
CREATE INDEX IF NOT EXISTS idx_worker_health_name ON worker_health(worker_name);
CREATE INDEX IF NOT EXISTS idx_worker_health_status ON worker_health(status);
CREATE INDEX IF NOT EXISTS idx_worker_health_heartbeat ON worker_health(last_heartbeat);

-- Function to update worker heartbeat
CREATE OR REPLACE FUNCTION update_worker_heartbeat(
  p_worker_name VARCHAR(50),
  p_status VARCHAR(20) DEFAULT 'running',
  p_processed_count INTEGER DEFAULT NULL,
  p_error_count INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO worker_health (
    worker_name, status, last_heartbeat, processed_count, error_count, metadata
  ) VALUES (
    p_worker_name, p_status, NOW(), 
    COALESCE(p_processed_count, 0), 
    COALESCE(p_error_count, 0),
    COALESCE(p_metadata, '{}')
  )
  ON CONFLICT (worker_name) DO UPDATE SET
    status = EXCLUDED.status,
    last_heartbeat = NOW(),
    processed_count = CASE 
      WHEN p_processed_count IS NOT NULL THEN EXCLUDED.processed_count 
      ELSE worker_health.processed_count 
    END,
    error_count = CASE 
      WHEN p_error_count IS NOT NULL THEN EXCLUDED.error_count 
      ELSE worker_health.error_count 
    END,
    metadata = COALESCE(EXCLUDED.metadata, worker_health.metadata),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create unique constraint on worker_name
ALTER TABLE worker_health ADD CONSTRAINT unique_worker_name UNIQUE (worker_name);
