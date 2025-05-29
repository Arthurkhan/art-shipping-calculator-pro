# Update Log - Currency Display Fix
**Date:** 2025-05-29
**Issue:** Shipping rates showing incorrect currency symbols instead of currency codes
**Affected Components:** FedEx rate parsing in backend

## Problem Description
The FedEx API was returning currency symbols (like "$") instead of proper currency codes (like "THB") for some service types. This caused the frontend to display rates incorrectly as "$18542.33 THB" where the "$" was the currency field and "THB" was just a label.

## Root Cause
In the `FedexRatesService.parseRateResponse()` method, the code was directly using the currency value returned by FedEx API without checking if it was a symbol or a proper currency code.

## Solution Implemented
Modified `supabase/functions/calculate-shipping/lib/fedex-rates.ts`:

1. Added logic to detect if the returned currency is a symbol (like $, €, £, etc.)
2. If a symbol is detected, use the `preferredCurrency` instead
3. Otherwise, use the currency code from the API response

### Code Changes
```typescript
// FIX: Handle currency properly - if API returns symbol, use preferredCurrency
if (selectedDetail.currency) {
  // If currency is a symbol (like $, €, £), use the preferredCurrency instead
  const currencySymbols = ['$', '€', '£', '¥', '₹', '₩', 'R$', '₱'];
  if (currencySymbols.includes(selectedDetail.currency)) {
    rateCurrency = preferredCurrency;
    Logger.info('Currency was a symbol, using preferredCurrency instead', { 
      symbolFound: selectedDetail.currency,
      usingCurrency: preferredCurrency 
    });
  } else {
    // Otherwise use the currency code from API
    rateCurrency = selectedDetail.currency;
  }
}
```

## Files Modified
- `supabase/functions/calculate-shipping/lib/fedex-rates.ts` - Added currency symbol detection and fallback logic

## Testing Required
1. Test shipping rate calculation from Thailand to various countries
2. Verify all FedEx service types show correct currency codes (THB, USD, SGD, etc.)
3. Ensure no currency symbols ($, €, etc.) appear in the rate display
4. Test with different destination countries to verify auto-currency mapping still works

## Status
✅ COMPLETED - The fix has been implemented and committed

## Next Steps
- Monitor FedEx API responses to ensure consistent currency handling
- Consider adding currency code validation in the future
- May need to expand the currency symbols list if more are discovered
