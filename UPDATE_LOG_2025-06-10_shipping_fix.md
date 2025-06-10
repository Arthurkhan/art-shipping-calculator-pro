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
- Added proper validation to check for either override data OR collection/size
- Enhanced logging to show whether override mode is being used

### 2. Fixed FedEx Payload Builder (supabase/functions/calculate-shipping/lib/payload-builder.ts)
- Changed `groupPackageCount` to always be 1 (single shipment)
- Added detailed comments explaining this is for single shipment pricing
- Enhanced logging to show user requested quantity vs FedEx API quantity
- Added note that rates are for ONE package/shipment

### 3. Enhanced Edge Function Processing
- When override data is provided, quantity is always set to 1 for FedEx API
- User requested quantity is logged but not used in FedEx calculation
- This ensures rates match FedEx website pricing for single shipments

## Testing Instructions
1. Test with custom parameters only (no collection/size selected) - should work without 400 error
2. Test with quantity > 1 in custom parameters - rates should be for single shipment
3. Compare rates with FedEx website to ensure they match for single shipment

## Next Steps
- Monitor rates to ensure they match FedEx website pricing
- Consider adding UI option for multi-package shipments if needed in future
- Add UI indicator showing rates are for single shipment when quantity > 1

## Deployment
Edge function has been deployed successfully:
- Function ID: de252d3b-4be3-4b79-8c27-44e3c9939caa
- Version: 5
- Status: ACTIVE
- Deployed at: 2025-06-10 10:32:21 UTC

## Status: COMPLETED & DEPLOYED ✅
Both issues have been fixed and deployed. The application now:
1. Accepts custom shipping parameters without requiring collection/size selection
2. Always calculates rates for single shipment to match FedEx website pricing
3. Edge function is live and ready for testing
