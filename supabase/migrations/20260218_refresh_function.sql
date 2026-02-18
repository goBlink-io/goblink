-- Function to refresh the route_confidence materialized view
-- Called via supabase.rpc('refresh_route_confidence')
CREATE OR REPLACE FUNCTION refresh_route_confidence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY route_confidence;
END;
$$;
