# Update Log: Fix Currency Display and Delivery Dates

**Date**: 2025-05-29
**Task**: Fix currency display showing $ instead of THB and missing delivery dates
**Status**: In Progress

## Issue Description
1. Currency is always showing with $ symbol regardless of actual currency (should show THB)
2. Delivery dates are not being displayed even though they exist in FedEx response
3. Some rates appear to be showing incorrect values

## Changes Made

### 1. Frontend - Fix Currency Display in ResultsDisplay.tsx
- Remove hardcoded dollar sign
- Display actual currency code (THB, USD, etc.)
- Keep currency display separate from amount

### 2. Backend - Enhance Delivery Date Extraction
- Check all possible fields for delivery information
- Extract more comprehensive delivery data from FedEx response

## Files Modified
- [ ] src/components/shipping/ResultsDisplay.tsx
- [ ] supabase/functions/calculate-shipping/lib/fedex-rates.ts

## Next Steps
- Test with actual FedEx API to verify fixes
- Ensure all shipping options display correctly
- Verify delivery dates are captured and displayed
