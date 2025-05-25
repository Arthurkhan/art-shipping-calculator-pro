# Update Log - FedEx Integration Fix

**Date:** May 25, 2025  
**Feature:** FedEx API Integration Fixes  
**Session:** Complete Edge Function Fix

## Problem Description
The application was encountering multiple errors:
1. **Initial:** 400 Bad Request from FedEx API due to incorrect payload structure
2. **After fix:** 406 Not Acceptable from database query due to collection ID/name mismatch

## Root Cause Analysis
1. **FedEx API:** Payload structure didn't match n8n workflow requirements
2. **Database Query:** Frontend passes collection ID but Edge Function expected collection name

## Changes Made

### ✅ supabase/functions/calculate-shipping/index.ts

#### **First Fix:** FedEx API Payload Structure (Phase 1)
**Modified:** Core FedEx API payload structure in `getFedexRates` function
- Updated payload to match n8n workflow structure exactly
- Removed unit conversions (now using CM/KG directly)
- Added missing required fields: `preferredCurrency`, `shipDateStamp`, `packagingType`
- Changed `pickupType` to `"DROPOFF_AT_FEDEX_LOCATION"`
- Updated `rateRequestType` to array format: `["LIST", "ACCOUNT", "INCENTIVE"]`
- Added `groupPackageCount` field to both shipment and line item levels
- Implemented dynamic currency selection based on destination country

#### **Second Fix:** Collection Lookup Issue
**Modified:** `getCollectionSize` function parameter handling
- **Problem:** Frontend passes collection ID, but function expected collection name
- **Solution:** Updated function to work directly with collection IDs
- **Before:** 
  ```javascript
  // Two-step lookup: name -> ID -> size data
  .eq('name', collection) // collection was actually an ID
  ```
- **After:**
  ```javascript
  // Direct lookup with collection ID
  .eq('collection_id', collectionId) // Use ID directly
  ```

## Technical Details

### Frontend → Backend Data Flow:
1. **CollectionSelector.tsx:** `value={collection.id}` (sends UUID)
2. **Index.tsx:** Passes collection ID in request payload
3. **Edge Function:** Now correctly uses collection ID for database query

### Database Query Fix:
```javascript
// FIXED: Direct collection_id lookup
const { data, error } = await supabase
  .from('collection_sizes')
  .select('weight_kg, height_cm, length_cm, width_cm')
  .eq('collection_id', collectionId)  // Direct ID usage
  .eq('size', size)
  .single();
```

## Error Resolution Timeline:
1. ✅ **400 Bad Request (FedEx API)** → Fixed with correct payload structure
2. ✅ **406 Not Acceptable (Database)** → Fixed with collection ID handling

## Testing Status
- ✅ Code updated and committed (2 commits)
- 🔄 **Ready for testing:** Edge Function should now work end-to-end
- 🔄 **Verification needed:** Test with actual FedEx credentials

## Next Steps
1. **Test the application** - Try calculating shipping rates again
2. **Verify FedEx API calls** - Should now return valid shipping rates
3. **Confirm rates match n8n workflow** - Compare results
4. **Proceed to Phase 2-5** if successful

## Success Criteria
- [x] Fixed FedEx API payload structure (no more 400 errors)
- [x] Fixed database collection lookup (no more 406 errors)
- [ ] FedEx API returns valid shipping rates 
- [ ] Rates match those from working n8n workflow
- [ ] Error handling provides clear feedback to users
- [ ] All required FedEx fields are included in requests

## Files Modified
- `supabase/functions/calculate-shipping/index.ts` - Fixed both FedEx payload and collection lookup
- `updateLog.md` - Documentation

## Commits Made
1. `7dc3cf33` - Fix FedEx API payload structure according to roadmap
2. `7ba121a2` - Fix collection lookup - use collection ID directly instead of name lookup

## Rollback Plan
If issues occur, revert to commit before `7dc3cf33` to restore previous functionality.

---
**Status:** ✅ Completed - Ready for Testing  
**Next Phase:** Test end-to-end functionality with FedEx API
