-- Sapphire Database Schema
-- PostgreSQL schema for transaction tracking and audit trail

-- Transactions table: stores all swap transactions
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    origin_asset VARCHAR(255) NOT NULL,
    destination_asset VARCHAR(255) NOT NULL,
    amount VARCHAR(100) NOT NULL,
    deposit_address VARCHAR(255),
    recipient VARCHAR(255) NOT NULL,
    refund_to VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_QUOTE',
    quote_details JSONB,
    app_fee_bps INTEGER,
    user_ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Status history table: tracks status changes over time
CREATE TABLE IF NOT EXISTS status_history (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_session_id ON transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_transactions_deposit_address ON transactions(deposit_address);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_status_history_transaction_id ON status_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_status_history_timestamp ON status_history(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE transactions IS 'Stores all swap transaction records';
COMMENT ON TABLE status_history IS 'Tracks status changes for transactions';
COMMENT ON COLUMN transactions.session_id IS 'Unique session identifier from frontend';
COMMENT ON COLUMN transactions.deposit_address IS 'Deposit address provided by 1Click API';
COMMENT ON COLUMN transactions.quote_details IS 'Full quote response from 1Click API';
COMMENT ON COLUMN transactions.app_fee_bps IS 'Application fee in basis points at time of quote';
