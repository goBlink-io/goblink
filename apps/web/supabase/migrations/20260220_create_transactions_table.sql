-- Create transactions table for persistent transaction history
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  wallet_chain TEXT NOT NULL,
  deposit_address TEXT,
  from_chain TEXT NOT NULL,
  from_token TEXT NOT NULL,
  to_chain TEXT NOT NULL,
  to_token TEXT NOT NULL,
  amount_in TEXT NOT NULL,
  amount_out TEXT,
  amount_usd NUMERIC,
  recipient TEXT NOT NULL,
  refund_to TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  deposit_tx_hash TEXT,
  fulfillment_tx_hash TEXT,
  refund_tx_hash TEXT,
  fee_bps INTEGER,
  fee_amount TEXT,
  quote_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transactions_deposit ON transactions(deposit_address);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

-- GIN index for full-text search on transaction hashes
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hashes ON transactions USING gin (
  to_tsvector('simple', 
    COALESCE(deposit_tx_hash, '') || ' ' || 
    COALESCE(fulfillment_tx_hash, '') || ' ' || 
    COALESCE(refund_tx_hash, '')
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS transactions_updated_at_trigger ON transactions;
CREATE TRIGGER transactions_updated_at_trigger
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transactions_updated_at();

-- Note: RLS is disabled since we use service role key server-side
-- If needed in the future, enable RLS and add appropriate policies:
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
