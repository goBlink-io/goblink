-- Short payment links
-- Maps a short nanoid to payment request data so URLs stay compact
-- e.g. goblink.io/pay/aBc12x3d instead of goblink.io/pay/<200-char-base64>

CREATE TABLE IF NOT EXISTS payment_links (
  id                 TEXT PRIMARY KEY,       -- nanoid (8 chars)
  recipient          TEXT NOT NULL,
  to_chain           TEXT NOT NULL,
  to_token           TEXT NOT NULL,
  amount             TEXT NOT NULL,
  memo               TEXT,
  requester_name     TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: public read (anyone with the short ID can view), service write
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_payment_links"
  ON payment_links FOR SELECT USING (true);
CREATE POLICY "service_write_payment_links"
  ON payment_links FOR ALL USING (true);
