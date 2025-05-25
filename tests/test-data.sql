-- FedEx Integration Testing Data - Phase 4
-- This script creates test data in the collection_sizes table for comprehensive testing

-- Insert test collection data for FedEx integration testing
INSERT INTO collection_sizes (collection, size, weight_kg, height_cm, length_cm, width_cm) 
VALUES 
  -- Test Collection - Standard sizes
  ('test-collection', 'small', 2.5, 15, 25, 20),
  ('test-collection', 'medium', 5.0, 25, 35, 30),
  ('test-collection', 'large', 10.0, 35, 50, 40),
  
  -- Premium Collection - Slightly different dimensions for variety
  ('premium-collection', 'small', 3.0, 18, 28, 23),
  ('premium-collection', 'medium', 6.0, 28, 38, 33),
  ('premium-collection', 'large', 12.0, 38, 53, 43),
  
  -- Art Print Collection - Flat packages
  ('art-print-collection', 'small', 0.5, 2, 30, 21),
  ('art-print-collection', 'medium', 1.0, 3, 42, 30),
  ('art-print-collection', 'large', 2.0, 4, 60, 42),
  
  -- Canvas Collection - Thicker packages
  ('canvas-collection', 'small', 4.0, 20, 30, 25),
  ('canvas-collection', 'medium', 8.0, 30, 40, 35),
  ('canvas-collection', 'large', 15.0, 40, 60, 45),
  
  -- Frame Collection - Heavier packages
  ('frame-collection', 'small', 6.0, 25, 35, 30),
  ('frame-collection', 'medium', 12.0, 35, 45, 40),
  ('frame-collection', 'large', 20.0, 45, 65, 50),
  
  -- Digital Art Collection - Lightweight
  ('digital-art-collection', 'small', 0.2, 1, 25, 18),
  ('digital-art-collection', 'medium', 0.3, 1, 35, 25),
  ('digital-art-collection', 'large', 0.5, 2, 50, 35),
  
  -- Sculpture Collection - Heavy items
  ('sculpture-collection', 'small', 8.0, 30, 30, 30),
  ('sculpture-collection', 'medium', 16.0, 40, 40, 40),
  ('sculpture-collection', 'large', 25.0, 50, 50, 50),
  
  -- Mixed Media Collection - Variable sizes
  ('mixed-media-collection', 'small', 3.5, 22, 32, 27),
  ('mixed-media-collection', 'medium', 7.5, 32, 42, 37),
  ('mixed-media-collection', 'large', 14.0, 42, 62, 47)
ON CONFLICT (collection, size) DO UPDATE SET
  weight_kg = EXCLUDED.weight_kg,
  height_cm = EXCLUDED.height_cm,
  length_cm = EXCLUDED.length_cm,
  width_cm = EXCLUDED.width_cm;

-- Verify the data was inserted
SELECT 
  collection,
  size,
  weight_kg,
  height_cm,
  length_cm,
  width_cm,
  created_at
FROM collection_sizes 
WHERE collection LIKE '%collection'
ORDER BY collection, 
  CASE size 
    WHEN 'small' THEN 1 
    WHEN 'medium' THEN 2 
    WHEN 'large' THEN 3 
    ELSE 4 
  END;

-- Create some additional edge case test data
INSERT INTO collection_sizes (collection, size, weight_kg, height_cm, length_cm, width_cm) 
VALUES 
  -- Edge cases for testing validation
  ('edge-case-collection', 'tiny', 0.1, 5, 10, 8),
  ('edge-case-collection', 'extra-large', 30.0, 60, 80, 60),
  ('edge-case-collection', 'custom', 7.3, 33, 47, 39),
  
  -- International shipping test sizes
  ('international-test', 'document', 0.3, 1, 35, 25),
  ('international-test', 'package', 5.5, 28, 38, 33),
  ('international-test', 'freight', 22.0, 45, 65, 55)
ON CONFLICT (collection, size) DO UPDATE SET
  weight_kg = EXCLUDED.weight_kg,
  height_cm = EXCLUDED.height_cm,
  length_cm = EXCLUDED.length_cm,
  width_cm = EXCLUDED.width_cm;

-- Create a view for easy test data querying
CREATE OR REPLACE VIEW test_collection_summary AS
SELECT 
  collection,
  COUNT(*) as size_variants,
  MIN(weight_kg) as min_weight,
  MAX(weight_kg) as max_weight,
  AVG(weight_kg) as avg_weight,
  MIN(height_cm * length_cm * width_cm) as min_volume,
  MAX(height_cm * length_cm * width_cm) as max_volume,
  string_agg(size, ', ' ORDER BY 
    CASE size 
      WHEN 'tiny' THEN 1
      WHEN 'small' THEN 2 
      WHEN 'medium' THEN 3 
      WHEN 'large' THEN 4 
      WHEN 'extra-large' THEN 5
      ELSE 6 
    END
  ) as available_sizes
FROM collection_sizes 
WHERE collection LIKE '%collection'
GROUP BY collection
ORDER BY collection;

-- Display the test data summary
SELECT * FROM test_collection_summary;

-- Comments for testing guidance
COMMENT ON TABLE collection_sizes IS 'Test data for FedEx integration Phase 4 testing. Contains various package sizes and weights for comprehensive shipping calculation validation.';

-- Create indexes for better test performance
CREATE INDEX IF NOT EXISTS idx_collection_sizes_test_lookup 
ON collection_sizes (collection, size) 
WHERE collection LIKE '%collection';

-- Analyze the table for better query performance during testing
ANALYZE collection_sizes;

-- Test data validation query
SELECT 
  'Test Data Validation' as check_type,
  COUNT(*) as total_test_records,
  COUNT(DISTINCT collection) as unique_collections,
  COUNT(DISTINCT size) as unique_sizes,
  MIN(weight_kg) as min_weight,
  MAX(weight_kg) as max_weight,
  MIN(height_cm) as min_height,
  MAX(height_cm) as max_height,
  MIN(length_cm) as min_length,
  MAX(length_cm) as max_length,
  MIN(width_cm) as min_width,
  MAX(width_cm) as max_width
FROM collection_sizes 
WHERE collection LIKE '%collection';
