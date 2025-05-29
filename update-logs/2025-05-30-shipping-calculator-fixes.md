# Update Log: Shipping Calculator Fixes
**Date:** May 30, 2025
**Feature:** Multiple UI/UX fixes for shipping calculator

## Issues to Fix:
1. ✅ Add comma formatting in prices for thousands separator
2. ✅ Fix ship date showing 1 day prior in Shipping Route section
3. ✅ Fix default button feature not changing the default origin address
4. ✅ Add note under preferred currency about account currency override
5. ✅ Ensure origin address changes are properly reflected in FedEx API calls

## Changes Made:

### 1. Price Formatting with Thousand Separators
**File:** `src/components/shipping/ResultsDisplay.tsx`
**Changes:**
- Added a utility function `formatPrice` to format numbers with comma separators
- Updated price display to use the new formatting
- Prices now display as "1,234.56" instead of "1234.56"

### 2. Ship Date Display Fix
**File:** `src/components/shipping/ParameterPreview.tsx`
**Changes:**
- Fixed date formatting in `getFormattedShipDate` function
- Changed from `toISOString().split('T')[0]` to using `format(shipDate, 'yyyy-MM-dd')`
- Now correctly displays the selected date without timezone issues

### 3. Default Address Button Fix
**File:** `src/hooks/useOriginAddress.ts`
**Changes:**
- Updated initialization to check localStorage for custom defaults first
- Now properly reads from `origin_country` and `origin_postal_code` localStorage keys
- "Set as Default" button now works correctly with page refreshes

### 4. Preferred Currency Note
**File:** `src/components/shipping/ShippingDetailsForm.tsx`
**Changes:**
- Added Info icon import from lucide-react
- Added an informational note box below the currency selector
- Note warns users that account-assigned currency may override their selection

### 5. Origin Address in FedEx API
**Status:** Verified - already working correctly
- The origin address is properly passed through the shipping calculator hook to the API
- No changes needed

## Testing Notes:
✅ Test price display with values over 1000 to verify comma formatting
✅ Test ship date selection to ensure correct date is displayed
✅ Test "Set as Default" and "Use Thailand Default" buttons
✅ Verify currency note displays correctly
✅ Test changing origin address and verify it's used in API calls

## Completion Status:
All requested fixes have been successfully implemented.

## Next Steps:
- Monitor for any additional formatting or display issues
- Consider adding more currency formatting options based on selected currency
- Consider adding more visual feedback when default address is set
