# Update Log: Shipping Calculator Fixes
**Date**: 2025-06-10
**Feature**: Fix 400 Error and High Rates Issue

## Issues Identified
1. 400 Bad Request when using custom shipping parameters without selecting collection/size
2. Rates appear too high - possibly calculating multiple shipments instead of one

## Root Cause Analysis
1. **400 Error**: Edge function validation was checking for empty strings in collection/size fields even when override data was provided
2. **High Rates**: The `quantity` parameter was being used as `groupPackageCount` in FedEx API, causing it to calculate rates for multiple separate packages

## Changes Made

### 1. Fixed Edge Function Validation (supabase/functions/calculate-shipping/index.ts)
- Modified validation logic to properly handle empty strings when override mode is used
- Empty strings for collection/size are now allowed when overrideData is provided

### 2. Fixed FedEx Payload Builder (supabase/functions/calculate-shipping/lib/payload-builder.ts)
- Changed `groupPackageCount` to always be 1 (single shipment)
- Added proper comment explaining this is for single shipment pricing

### 3. Enhanced Logging
- Added detailed logging to help debug quantity and pricing issues
- Logs now show whether override mode is being used

## Testing Instructions
1. Test with custom parameters only (no collection/size selected) - should work without 400 error
2. Test with quantity > 1 in custom parameters - rates should be for single shipment
3. Compare rates with FedEx website to ensure they match for single shipment

## Next Steps
- Monitor rates to ensure they match FedEx website pricing
- Consider adding UI option for multi-package shipments if needed in future
