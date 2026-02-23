-- Payment link status tracking
-- Keyed on the URL link_id (base64 encoded payment request)
-- Prevents double-payment and shows rich paid confirmation UI

CREATE TABLE IF NOT EXISTS payment_link_status (
  link_id            TEXT PRIMARY KEY,
  status             TEXT NOT NULL DEFAULT 'processing', -- 'processing' | 'paid' | 'failed'
  recipient          TEXT NOT NULL,
  to_chain           TEXT NOT NULL,
  to_token           TEXT NOT NULL,
  amount             TEXT NOT NULL,
  memo               TEXT,
  requester_name     TEXT,
  link_created_at    BIGINT NOT NULL,       -- PaymentRequestData.createdAt (ms timestamp)
  paid_at            TIMESTAMPTZ,
  send_tx_hash       TEXT,                 -- hash from payer's source chain
  deposit_address    TEXT,                 -- 1Click deposit address
  payer_address      TEXT,
  payer_chain        TEXT,
  fulfillment_tx_hash TEXT,                -- hash on destination chain (from 1Click outcome)
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Quick lookup by recipient (for "all payments to me" queries later)
CREATE INDEX IF NOT EXISTS idx_payment_link_status_recipient
  ON payment_link_status (recipient);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_payment_link_status_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payment_link_status_updated_at ON payment_link_status;
CREATE TRIGGER payment_link_status_updated_at
  BEFORE UPDATE ON payment_link_status
  FOR EACH ROW EXECUTE FUNCTION update_payment_link_status_updated_at();

-- RLS: public read (anyone with the link_id can check status)
ALTER TABLE payment_link_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_payment_link_status"
  ON payment_link_status FOR SELECT USING (true);
CREATE POLICY "service_write_payment_link_status"
  ON payment_link_status FOR ALL USING (true);
