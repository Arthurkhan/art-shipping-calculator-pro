# Update Log: Fix Currency Display and Delivery Dates

**Date**: 2025-05-29
**Task**: Fix currency display showing $ instead of THB and missing delivery dates
**Status**: Completed

## Issue Description
1. Currency is always showing with $ symbol regardless of actual currency (should show THB)
2. Delivery dates are not being displayed even though they exist in FedEx response
3. Some rates appear to be showing incorrect values

## Changes Made

### 1. Frontend - Fix Currency Display in ResultsDisplay.tsx
- ✅ Removed hardcoded dollar sign
- ✅ Display actual currency code (THB, USD, etc.) before the amount
- ✅ Added friendly currency names below the amount (Thai Baht, US Dollar, etc.)
- ✅ Removed the DollarSign icon to avoid confusion

### 2. Backend - Enhance Delivery Date Extraction in fedex-rates.ts
- ✅ Added comprehensive delivery date extraction from multiple fields:
  - Top-level deliveryTimestamp field
  - operationalDetail.deliveryDate and deliveryDayOfWeek
  - commit.dateDetail.dayOfWeek and dayCxsFormat
  - commit.label (which often contains formatted delivery info)
- ✅ Added formatDeliveryDate helper function to parse and format dates
- ✅ Enhanced logging to debug delivery information extraction
- ✅ Prioritized checking multiple fields to ensure we capture delivery info

## Files Modified
- ✅ src/components/shipping/ResultsDisplay.tsx
- ✅ supabase/functions/calculate-shipping/lib/fedex-rates.ts

## Technical Details

### Currency Display Fix
The issue was that the ResultsDisplay component was hardcoding a dollar sign icon for all currencies. Now it displays:
- Currency code (e.g., "THB") followed by the amount
- A friendly name below (e.g., "Thai Baht")

### Delivery Date Extraction
The FedEx API returns delivery information in various fields depending on the service type. The enhanced implementation now checks:
1. rateDetail.deliveryTimestamp
2. rateDetail.transitTime
3. rateDetail.operationalDetail (deliveryDate, deliveryDayOfWeek, transitTime)
4. rateDetail.commit (label, dateDetail.dayOfWeek, dateDetail.dayCxsFormat)

## Testing Required
- Verify THB currency displays correctly
- Verify USD and other currencies display correctly
- Verify delivery dates appear for all service types
- Test with different origin/destination combinations

## Next Steps
- Monitor logs to ensure delivery dates are being captured correctly
- Consider adding more sophisticated date formatting if needed
- May need to adjust currency symbol positioning based on user feedback
