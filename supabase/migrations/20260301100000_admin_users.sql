CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Urban as first admin
INSERT INTO admin_users (email, name) VALUES ('urban@goblink.io', 'Urban Blazer') ON CONFLICT DO NOTHING;
