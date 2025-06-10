# UPDATE LOG: FedEx Last-Minute Rates Feature
**Date**: 2025-01-13
**Feature**: Add support for FedEx last-minute rates and fix rate discrepancies

## Overview
Adding support for FedEx last-minute rates and fixing the issue where our app shows rates ~1,000 THB higher than the FedEx website.

## Problem Analysis
1. **Missing rate types**: We're only parsing LIST and ACCOUNT rates, but not INCENTIVE rates
2. **No last-minute rates**: FedEx website shows special "LAST-MINUTE RATE" options that are significantly cheaper
3. **Rate selection logic**: We might not be selecting the best available rate from the response

## Changes Required

### 1. Backend Changes (supabase/functions/calculate-shipping/)

#### lib/fedex-rates.ts
- **Modified**: parseRateResponse() method to:
  - Parse INCENTIVE rates in addition to LIST and ACCOUNT
  - Look for all available rate types in the response
  - Select the lowest rate when multiple options are available
  - Add support for identifying last-minute rates

#### lib/payload-builder.ts
- **No changes needed**: Already requesting ["LIST", "ACCOUNT", "INCENTIVE"] rates

#### types/fedex-types.ts
- **Modified**: Add new rate type constants and interfaces for last-minute rates

### 2. Frontend Changes

#### src/components/shipping/ShippingRateCard.tsx
- **Modified**: Display last-minute rates with special styling/badge
- Show both regular and last-minute rates when available

#### src/types/shipping.ts
- **Modified**: Add fields for rate type and last-minute flag

## Implementation Details

### Rate Parsing Logic Changes
- Check for all rate types: LIST, ACCOUNT, INCENTIVE, RATED_ACCOUNT, etc.
- When multiple rates exist for a service, select the lowest one
- Mark rates as "last-minute" based on rate type or special indicators

### Display Changes
- Show both regular and last-minute rates similar to FedEx website
- Add visual indicators for last-minute rates (badges, different styling)
- Display savings percentage when last-minute rates are available

## Testing Plan
1. Test with same origin/destination as FedEx website (Thailand → Indonesia)
2. Compare rates between our app and FedEx website
3. Verify all rate types are being parsed correctly
4. Ensure last-minute rates are displayed properly

## Success Criteria
- [ ] Rates match FedEx website more closely (within reasonable margin)
- [ ] Last-minute rates are displayed when available
- [ ] All rate types (LIST, ACCOUNT, INCENTIVE) are parsed
- [ ] UI clearly shows regular vs last-minute rates

## Next Steps
1. Deploy backend changes
2. Test with production FedEx account
3. Monitor rate accuracy compared to FedEx website
