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

### 3. Frontend Component Updated
- File: `src/components/shipping/ParameterPreview.tsx`
- Changed query from `collection_sizes` to `sizes` table (line 87)
- This component was causing the 404 error when displaying size data

### 4. Database Structure
- Reverted table name from `collection_sizes` back to `sizes`
- Kept the dimension columns (width_cm, length_cm, height_cm, weight_kg)
- The 'size' column name remains (not reverting to 'size_code')

### 5. Dimension Data Migration
- Updated 64 existing size records
- Copied dimension data from JSONB column to numeric columns
- All existing collections now have proper dimension data

### 6. Edge Function Single-File Version
- File: `supabase/functions/calculate-shipping/index-single-file.ts`
- Created single-file version for easier deployment via Supabase Dashboard
- Includes all modules combined into one file

## Status
- [x] Update frontend hook to use 'sizes' table
- [x] Update backend function to use 'sizes' table
- [x] Update ParameterPreview component to use 'sizes' table
- [x] Revert table name in database
- [x] Update dimension data for existing sizes
- [x] Create single-file Edge Function for deployment

## Completion Status
✅ **COMPLETE** - All references to 'collection_sizes' have been updated to 'sizes'

## Next Steps
1. Deploy the Edge Function using the single-file version
2. Test shipping calculations with any collection

## Notes
- The app now correctly uses the 'sizes' table throughout all components
- All 64 existing size records have been updated with dimension data
- The webapp should now properly display size dimensions in the Parameter Preview
- Edge Function is ready for deployment (use index-single-file.ts for easier deployment)
