-- Migration to fix table structure after Supabase project recreation
-- Run this in your Supabase SQL editor

-- Step 1: Rename the sizes table to collection_sizes
ALTER TABLE IF EXISTS sizes RENAME TO collection_sizes;

-- Step 2: Rename size_code column to size
ALTER TABLE collection_sizes RENAME COLUMN size_code TO size;

-- Step 3: Add missing columns to collection_sizes table
ALTER TABLE collection_sizes
ADD COLUMN IF NOT EXISTS width_cm NUMERIC,
ADD COLUMN IF NOT EXISTS length_cm NUMERIC,
ADD COLUMN IF NOT EXISTS height_cm NUMERIC,
ADD COLUMN IF NOT EXISTS weight_kg NUMERIC;

-- Step 4: Add missing columns to collections table if they don't exist
ALTER TABLE collections 
ADD COLUMN IF NOT EXISTS batch_id_prefix TEXT DEFAULT 'BATCH',
ADD COLUMN IF NOT EXISTS has_different_positions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Step 5: Update existing data - extract dimensions from JSONB if it exists
DO $$
BEGIN
    -- Check if dimensions column exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'collection_sizes' AND column_name = 'dimensions') THEN
        -- Update the numeric columns from the JSONB data
        UPDATE collection_sizes 
        SET 
            width_cm = (dimensions->>'width')::NUMERIC,
            length_cm = (dimensions->>'length')::NUMERIC,
            height_cm = (dimensions->>'height')::NUMERIC,
            weight_kg = (dimensions->>'weight')::NUMERIC
        WHERE dimensions IS NOT NULL;
    END IF;
END $$;

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_sizes_collection_id ON collection_sizes(collection_id);
CREATE INDEX IF NOT EXISTS idx_collections_name ON collections(name);

-- Step 7: Enable Row Level Security
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_sizes ENABLE ROW LEVEL SECURITY;

-- Step 8: Create policies for public read access
DROP POLICY IF EXISTS "Enable read access for all users" ON collections;
CREATE POLICY "Enable read access for all users" ON collections
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON collection_sizes;
CREATE POLICY "Enable read access for all users" ON collection_sizes
    FOR SELECT USING (true);

-- Step 9: Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 10: Create trigger for updated_at on collections
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at 
    BEFORE UPDATE ON collections 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Insert sample data for testing (uncomment if you want test data)
-- First, let's check if we have any collections
-- DO $$
-- DECLARE
--     pop_art_id UUID;
-- BEGIN
--     -- Insert a sample collection if none exists
--     INSERT INTO collections (name, batch_id_prefix, has_different_positions) 
--     VALUES ('Pop Art Collection', 'POP', false)
--     ON CONFLICT (name) DO UPDATE SET id = collections.id
--     RETURNING id INTO pop_art_id;
--     
--     -- Insert sample sizes for the collection
--     INSERT INTO collection_sizes (collection_id, size, width_cm, length_cm, height_cm, weight_kg)
--     VALUES 
--         (pop_art_id, 'Small', 30, 40, 5, 2.5),
--         (pop_art_id, 'Medium', 50, 70, 5, 4.5),
--         (pop_art_id, 'Large', 70, 100, 5, 7.5),
--         (pop_art_id, 'Extra Large', 100, 150, 5, 12.0)
--     ON CONFLICT DO NOTHING;
-- END $$;

-- Step 12: Optionally drop the dimensions column if no longer needed
-- ALTER TABLE collection_sizes DROP COLUMN IF EXISTS dimensions;
