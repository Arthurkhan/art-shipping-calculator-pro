-- Create table for storing encrypted FedEx configurations
CREATE TABLE IF NOT EXISTS fedex_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  encrypted_account_number TEXT NOT NULL,
  encrypted_client_id TEXT NOT NULL,
  encrypted_client_secret TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

-- Create index for faster lookups
CREATE INDEX idx_fedex_sessions_session_id ON fedex_sessions(session_id);
CREATE INDEX idx_fedex_sessions_expires_at ON fedex_sessions(expires_at);

-- Enable Row Level Security
ALTER TABLE fedex_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow Edge Functions to manage sessions
CREATE POLICY "Service role can manage fedex sessions" ON fedex_sessions
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_fedex_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM fedex_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a cron job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-fedex-sessions', '0 * * * *', 'SELECT cleanup_expired_fedex_sessions();');