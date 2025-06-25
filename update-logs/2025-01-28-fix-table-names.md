# Update Log: Fix Table Names in Webapp
**Date**: 2025-01-28
**Feature/Issue**: Fix webapp to use existing Supabase table names

## Context
The user clarified that they want to keep the existing Supabase table names ('sizes' not 'collection_sizes') as another project uses the same database. Need to update webapp code to match.

## Changes Made

### 1. Frontend Hook Updated
- File: `src/hooks/useCollectionData.ts`
- Changed query from `collection_sizes` to `sizes` table
- No other changes needed to hook logic

### 2. Backend Function Updated
- File: `supabase/functions/calculate-shipping/lib/collection-service.ts`
- Changed query from `collection_sizes` to `sizes` table
- Added comments explaining the change

### 3. Database Structure
- Reverted table name from `collection_sizes` back to `sizes`
- Kept the dimension columns (width_cm, length_cm, height_cm, weight_kg)
- The 'size' column name remains (not reverting to 'size_code')

## Status
- [x] Update frontend hook to use 'sizes' table
- [x] Update backend function to use 'sizes' table
- [x] Revert table name in database
- [ ] Update dimension data for existing sizes

## Next Steps
1. Deploy the updated Edge Function to apply backend changes
2. Add dimension data to existing size records
3. Test shipping calculations with collections that have dimension data

## Notes
- The app now correctly uses the 'sizes' table as it exists in Supabase
- Sample collections (Pop Art, Modern Art, Classic Art) already have dimension data
- Other collections need their dimension data added to the width_cm, length_cm, height_cm, and weight_kg columns
