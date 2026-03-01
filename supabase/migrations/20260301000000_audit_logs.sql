-- Audit Logs — track sensitive actions for forensics
-- No RLS needed — only accessed via service role from API routes

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL,            -- IP address, wallet address, or "system"
  action TEXT NOT NULL,           -- e.g. "quote.requested", "deposit.submitted", "transfer_link.created"
  resource_type TEXT,             -- "quote", "deposit", "transfer_link", "payment_request"
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
