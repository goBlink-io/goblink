-- zkLogin salt storage for @goblink/connect
-- Maps OAuth provider subject IDs to deterministic salts.
-- Same Google/Apple account always produces the same Sui address.

create table if not exists public.zklogin_salts (
  id uuid primary key default gen_random_uuid(),
  provider text not null,           -- 'google', 'apple', 'twitch'
  subject_id text not null,         -- OAuth 'sub' claim (hashed)
  salt text not null,               -- Deterministic salt for zkLogin address derivation
  sui_address text,                 -- Derived Sui address (cached for lookup)
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  
  constraint zklogin_salts_provider_subject_unique unique (provider, subject_id)
);

-- Index for fast lookup by provider + subject
create index if not exists idx_zklogin_salts_lookup 
  on public.zklogin_salts (provider, subject_id);

-- Index for address lookup (reverse: given a Sui address, find the salt)
create index if not exists idx_zklogin_salts_address 
  on public.zklogin_salts (sui_address) where sui_address is not null;

-- RLS: Only the API service role can read/write salts (never client-side)
alter table public.zklogin_salts enable row level security;

-- No public access — only service_role key (used by API routes)
-- Clients call /api/zklogin/salt which uses the service role internally
create policy "Service role only" on public.zklogin_salts
  for all using (false);

comment on table public.zklogin_salts is 
  'Stores deterministic salts for Sui zkLogin. Each OAuth identity maps to exactly one salt, producing a stable Sui address. Access restricted to service_role only.';
