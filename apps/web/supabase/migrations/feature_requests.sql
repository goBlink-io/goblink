CREATE TABLE feature_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  github_user_id text NOT NULL,
  github_username text NOT NULL,
  github_avatar_url text,
  title text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'declined')),
  github_issue_number integer,
  github_issue_url text,
  votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE feature_request_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_request_id uuid REFERENCES feature_requests(id) ON DELETE CASCADE,
  github_user_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(feature_request_id, github_user_id)
);

CREATE TABLE feature_request_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_request_id uuid REFERENCES feature_requests(id) ON DELETE CASCADE,
  github_user_id text NOT NULL,
  github_username text NOT NULL,
  github_avatar_url text,
  body text NOT NULL,
  is_admin boolean DEFAULT false,
  github_comment_id integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_request_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_request_comments ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read feature requests" ON feature_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can read votes" ON feature_request_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can read comments" ON feature_request_comments FOR SELECT USING (true);

-- Authenticated write (handled via API routes with GitHub token validation)
-- We use service role in API routes, so no RLS insert policies needed for anon
