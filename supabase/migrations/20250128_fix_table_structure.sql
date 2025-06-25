-- Migration to fix table structure after Supabase project recreation
-- Run this in your Supabase SQL editor

-- Step 1: Rename tables to match expected names
ALTER TABLE IF EXISTS collection RENAME TO collections;
ALTER TABLE IF EXISTS sizes RENAME TO collection_sizes;

-- Step 2: Add missing columns to collections table if they don't exist
ALTER TABLE collections 
ADD COLUMN IF NOT EXISTS batch_id_prefix TEXT DEFAULT 'BATCH',
ADD COLUMN IF NOT EXISTS has_different_positions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Step 3: Add missing columns to collection_sizes table
ALTER TABLE collection_sizes
ADD COLUMN IF NOT EXISTS collection_id UUID,
ADD COLUMN IF NOT EXISTS width_cm NUMERIC,
ADD COLUMN IF NOT EXISTS length_cm NUMERIC,
ADD COLUMN IF NOT EXISTS height_cm NUMERIC,
ADD COLUMN IF NOT EXISTS weight_kg NUMERIC,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Step 4: Add ID columns if they don't exist
DO $$ 
BEGIN
    -- Add ID to collections if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'collections' AND column_name = 'id') THEN
        ALTER TABLE collections ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
    END IF;
    
    -- Add ID to collection_sizes if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'collection_sizes' AND column_name = 'id') THEN
        ALTER TABLE collection_sizes ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
    END IF;
END $$;

-- Step 5: Create foreign key relationship if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'collection_sizes_collection_id_fkey') THEN
        ALTER TABLE collection_sizes
        ADD CONSTRAINT collection_sizes_collection_id_fkey 
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_sizes_collection_id ON collection_sizes(collection_id);
CREATE INDEX IF NOT EXISTS idx_collections_name ON collections(name);

-- Step 7: Insert sample data (optional - uncomment if you want test data)
-- INSERT INTO collections (name, batch_id_prefix, has_different_positions) VALUES
-- ('Pop Art Collection', 'POP', false),
-- ('Modern Art Collection', 'MOD', false),
-- ('Classic Art Collection', 'CLS', false)
-- ON CONFLICT (id) DO NOTHING;

-- Sample sizes for Pop Art Collection (uncomment if you want test data)
-- INSERT INTO collection_sizes (collection_id, size, width_cm, length_cm, height_cm, weight_kg)
-- SELECT 
--     c.id,
--     s.size,
--     s.width_cm,
--     s.length_cm,
--     s.height_cm,
--     s.weight_kg
-- FROM collections c,
-- (VALUES 
--     ('Small', 30, 40, 5, 2.5),
--     ('Medium', 50, 70, 5, 4.5),
--     ('Large', 70, 100, 5, 7.5),
--     ('Extra Large', 100, 150, 5, 12.0)
-- ) AS s(size, width_cm, length_cm, height_cm, weight_kg)
-- WHERE c.name = 'Pop Art Collection';

-- Step 8: Grant necessary permissions (RLS policies)
-- Enable Row Level Security
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_sizes ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Enable read access for all users" ON collections
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON collection_sizes
    FOR SELECT USING (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at on collections
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at 
    BEFORE UPDATE ON collections 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
