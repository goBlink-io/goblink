-- Route statistics for Confidence Score Phase 2
-- Aggregates swap outcomes per route for data-driven trust scoring

CREATE TABLE IF NOT EXISTS route_stats (
  id            BIGSERIAL PRIMARY KEY,
  from_chain    TEXT NOT NULL,
  to_chain      TEXT NOT NULL,
  from_token    TEXT NOT NULL,
  to_token      TEXT NOT NULL,
  success       BOOLEAN NOT NULL,
  duration_secs INTEGER,          -- actual completion time (updatedAt - createdAt)
  amount_usd    NUMERIC(18,2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by route
CREATE INDEX IF NOT EXISTS idx_route_stats_route
  ON route_stats (from_chain, to_chain, from_token, to_token);

-- Materialized view for pre-aggregated route confidence data
-- Refresh periodically or after inserts
CREATE MATERIALIZED VIEW IF NOT EXISTS route_confidence AS
SELECT
  from_chain,
  to_chain,
  from_token,
  to_token,
  COUNT(*)                                          AS total_swaps,
  COUNT(*) FILTER (WHERE success)                   AS successful_swaps,
  ROUND(100.0 * COUNT(*) FILTER (WHERE success) / NULLIF(COUNT(*), 0), 1) AS success_rate,
  ROUND(AVG(duration_secs) FILTER (WHERE success), 0) AS avg_duration_secs,
  ROUND(AVG(amount_usd) FILTER (WHERE success), 2)    AS avg_amount_usd,
  MAX(created_at)                                      AS last_swap_at
FROM route_stats
GROUP BY from_chain, to_chain, from_token, to_token
HAVING COUNT(*) >= 3;  -- Only show stats after 3+ swaps

CREATE UNIQUE INDEX IF NOT EXISTS idx_route_confidence_route
  ON route_confidence (from_chain, to_chain, from_token, to_token);
