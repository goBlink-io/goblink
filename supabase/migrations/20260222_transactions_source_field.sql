-- Add source tracking fields to transaction_history
-- source: 'swap' (main swap form) | 'payment' (payment modal)
-- payment_request_id: composite key from payment request data for support tracing

ALTER TABLE transaction_history
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'swap',
  ADD COLUMN IF NOT EXISTS payment_request_id TEXT DEFAULT NULL;

COMMENT ON COLUMN transaction_history.source IS 'Origin: swap = main swap form, payment = payment modal';
COMMENT ON COLUMN transaction_history.payment_request_id IS 'Composite key from payment request (recipient:chain:token:amount) for support lookup';

CREATE INDEX IF NOT EXISTS idx_transaction_history_source ON transaction_history (source);
CREATE INDEX IF NOT EXISTS idx_transaction_history_payment_request_id ON transaction_history (payment_request_id) WHERE payment_request_id IS NOT NULL;
