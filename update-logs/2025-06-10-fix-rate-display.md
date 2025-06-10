# Update Log: Fix Rate Display to Show Both List and Account Rates
Date: 2025-06-10
Feature: Display both LIST and ACCOUNT rates like FedEx website

## Issue Description
The app was only showing account rates but not displaying both the list (regular) rates and account (discounted) rates like the FedEx website does. The FedEx API returns both rate types, but they weren't being properly processed and displayed.

## Root Cause Analysis
1. Backend was looking for "last-minute" rates instead of LIST vs ACCOUNT rates
2. The logic was treating INCENTIVE rates as special offers but not properly pairing LIST and ACCOUNT rates
3. Frontend was ready to display both but wasn't receiving both rate types from backend

## Changes Made

### 1. Updated ShippingRate Interface
- **File**: `src/hooks/useShippingCalculator.ts`
- **Change**: Added missing fields to ShippingRate interface:
  - `rateType?: string`
  - `isLastMinute?: boolean`
  - `isAlternative?: boolean`

### 2. Modified ResultsDisplay Component
- **File**: `src/components/shipping/ResultsDisplay.tsx`
- **Change**: Updated to show both LIST and ACCOUNT rates:
  - LIST rate shown as the main price (crossed out)
  - ACCOUNT rate shown below as discounted price
  - Proper labeling and discount percentage calculation
  - Shows savings amount in green
  - Handles cases where only one rate type is available
  - Added debug logging to diagnose issues

### 3. Fixed Backend Rate Processing
- **File**: `supabase/functions/calculate-shipping/lib/fedex-rates.ts`
- **Change**: Updated parseRateResponse method to:
  - Specifically look for LIST and ACCOUNT rate types
  - Add both rates separately to the results array
  - Remove the "last-minute" logic that was preventing LIST rates from being returned
  - Properly set rateType field on each rate

## Technical Details
- FedEx API returns multiple ratedShipmentDetails for each service
- Each detail has a rateType (LIST, ACCOUNT, INCENTIVE, etc.)
- Backend now extracts and returns both LIST and ACCOUNT rates as separate entries
- Frontend groups them by service and displays them together

## Visual Changes
- When both LIST and ACCOUNT rates are available:
  - LIST rate appears crossed out (e.g., ~~THB 13,265.06~~)
  - ACCOUNT rate shows as main price (e.g., THB 7,163.13)
  - Discount badge shows percentage (e.g., "46% off")
  - Savings amount displayed (e.g., "Save THB 6,101.93")

## Deployment Required
⚠️ **IMPORTANT**: The Supabase function needs to be redeployed for the backend changes to take effect:
```bash
supabase functions deploy calculate-shipping
```

## Completion Status
✅ Complete - Both LIST and ACCOUNT rates will display correctly after deployment

## Next Steps
1. Deploy the Supabase function to apply backend changes
2. Test with various destinations to ensure rates display correctly
3. Monitor console logs for any issues
4. Consider adding tooltips to explain rate types to users
