# Update Log - FedEx Rate Extraction Fix
**Date:** 2025-05-29
**Issue:** Shipping rates showing incorrect amounts (too low) for all services except INTERNATIONAL_FIRST
**Affected Components:** FedEx rate parsing logic in backend

## Problem Description
The shipping calculator was displaying incorrect rates for most FedEx services:
- INTERNATIONAL_FIRST: Correct at THB 18,542.33
- Other services: Showing rates around THB 7,000-8,000 instead of expected THB 11,000-13,000

## Root Cause Analysis
After analyzing the FedEx API sample response and comparing with our TypeScript type definitions, we found:

1. **Type Mismatch**: Our TypeScript types expected `totalNetCharge` to be an object with `amount` and `currency` properties, but the actual API returns it as a direct number.

2. **Inconsistent API Response**: The FedEx API may return rates in different formats or locations depending on the service type.

3. **Insufficient Field Checking**: The code was only checking for `totalNetCharge` in one location and format.

## Solution Implemented
Modified `supabase/functions/calculate-shipping/lib/fedex-rates.ts` with:

### 1. Enhanced Rate Extraction
- Modified `extractAmount()` to handle string values with currency symbols or formatting
- Added cleaning logic to remove non-numeric characters before parsing

### 2. Multiple Field Checking
The code now checks for rates in multiple possible locations:
- `totalNetCharge` (primary field)
- `totalNetFedExCharge` (alternative field name found in some responses)
- `shipmentRateDetail.totalNetCharge` (nested location)

### 3. Improved Type Handling
- Cast detail objects to `any` to handle the mismatch between TypeScript types and actual API response
- This allows the code to work with both expected object structure and actual numeric values

### 4. Better Fallback Logic
- If LIST rate extraction fails, properly fall back to ACCOUNT rates
- Apply the same multi-field checking for fallback rates
- Last resort: try extracting from the first available detail

### 5. Enhanced Logging
Added detailed logging to track:
- Which field the rate was extracted from
- The structure of the totalNetCharge field
- Whether fallback logic was used

## Code Changes Summary
```typescript
// Enhanced extraction logic
let extractedAmount = this.extractAmount(detailAny.totalNetCharge);

// Try alternative fields if primary extraction fails
if (!extractedAmount && detailAny.totalNetFedExCharge) {
  extractedAmount = this.extractAmount(detailAny.totalNetFedExCharge);
  Logger.info('Using totalNetFedExCharge instead of totalNetCharge');
}

// Try nested location
if (!extractedAmount && detailAny.shipmentRateDetail?.totalNetCharge) {
  extractedAmount = this.extractAmount(detailAny.shipmentRateDetail.totalNetCharge);
  Logger.info('Using shipmentRateDetail.totalNetCharge');
}
```

## Files Modified
- `supabase/functions/calculate-shipping/lib/fedex-rates.ts` - Enhanced rate extraction logic with multiple field checking and better error handling

## Testing Required
1. Test rate calculation for all FedEx service types
2. Verify rates match expected values (not showing low 7-8k values)
3. Ensure INTERNATIONAL_FIRST continues to work correctly
4. Check that both LIST and ACCOUNT rates are extracted properly
5. Test with different origin/destination combinations

## Status
✅ COMPLETED - The enhanced extraction logic has been implemented

## Next Steps
- Monitor FedEx API responses to ensure consistent rate extraction
- Consider updating TypeScript types to match actual API response structure
- May need to add more alternative field names if discovered in logs
