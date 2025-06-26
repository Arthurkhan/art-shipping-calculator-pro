-- Fix database access for collections and sizes tables
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security on both tables
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON collections;
DROP POLICY IF EXISTS "Enable read access for all users" ON sizes;
DROP POLICY IF EXISTS "collections_read_policy" ON collections;
DROP POLICY IF EXISTS "sizes_read_policy" ON sizes;

-- Create policies to allow public read access
CREATE POLICY "Enable read access for all users" ON collections
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Enable read access for all users" ON sizes
    FOR SELECT TO anon, authenticated USING (true);

-- Grant necessary permissions
GRANT SELECT ON collections TO anon;
GRANT SELECT ON sizes TO anon;
GRANT SELECT ON collections TO authenticated;
GRANT SELECT ON sizes TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('collections', 'sizes');

-- Check table permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name IN ('collections', 'sizes') 
AND grantee IN ('anon', 'authenticated');