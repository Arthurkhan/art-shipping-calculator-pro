-- Updated migration file - ONLY adds dimension columns, does NOT rename tables
-- This respects that other projects use the same Supabase database

-- Step 1: Add missing columns to sizes table if they don't exist
ALTER TABLE sizes
ADD COLUMN IF NOT EXISTS width_cm NUMERIC,
ADD COLUMN IF NOT EXISTS length_cm NUMERIC,
ADD COLUMN IF NOT EXISTS height_cm NUMERIC,
ADD COLUMN IF NOT EXISTS weight_kg NUMERIC;

-- Step 2: Update existing data - extract dimensions from JSONB if it exists
DO $$
BEGIN
    -- Check if dimensions column exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sizes' AND column_name = 'dimensions') THEN
        -- Update the numeric columns from the JSONB data
        UPDATE sizes 
        SET 
            width_cm = (dimensions->>'width_cm')::NUMERIC,
            length_cm = (dimensions->>'length_cm')::NUMERIC,
            height_cm = (dimensions->>'height_cm')::NUMERIC,
            weight_kg = (dimensions->>'weight_kg')::NUMERIC
        WHERE dimensions IS NOT NULL
        AND width_cm IS NULL;
    END IF;
END $$;

-- Step 3: Add missing columns to collections table if they don't exist
ALTER TABLE collections 
ADD COLUMN IF NOT EXISTS batch_id_prefix TEXT DEFAULT 'BATCH',
ADD COLUMN IF NOT EXISTS has_different_positions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sizes_collection_id ON sizes(collection_id);
CREATE INDEX IF NOT EXISTS idx_collections_name ON collections(name);

-- Step 5: Enable Row Level Security (if needed)
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policies for public read access
DROP POLICY IF EXISTS "Enable read access for all users" ON collections;
CREATE POLICY "Enable read access for all users" ON collections
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON sizes;
CREATE POLICY "Enable read access for all users" ON sizes
    FOR SELECT USING (true);

-- Step 7: Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Create trigger for updated_at on collections
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at 
    BEFORE UPDATE ON collections 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Note: This migration respects the existing table names (sizes, collections)
-- and only adds the necessary columns for the shipping calculator to work