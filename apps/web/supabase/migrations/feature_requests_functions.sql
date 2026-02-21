-- Function to increment votes
CREATE OR REPLACE FUNCTION increment_votes(request_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE feature_requests
  SET votes = votes + 1, updated_at = now()
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement votes
CREATE OR REPLACE FUNCTION decrement_votes(request_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE feature_requests
  SET votes = GREATEST(votes - 1, 0), updated_at = now()
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql;
