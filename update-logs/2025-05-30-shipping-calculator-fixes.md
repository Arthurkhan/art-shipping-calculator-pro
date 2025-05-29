# Update Log: Shipping Calculator Fixes
**Date:** May 30, 2025
**Feature:** Multiple UI/UX fixes for shipping calculator

## Issues to Fix:
1. Add comma formatting in prices for thousands separator
2. Fix ship date showing 1 day prior in Shipping Route section
3. Fix default button feature not changing the default origin address
4. Add note under preferred currency about account currency override
5. Ensure origin address changes are properly reflected in FedEx API calls

## Changes Made:

### 1. Price Formatting with Thousand Separators
**File:** `src/components/shipping/ResultsDisplay.tsx`
**Changes:**
- Added a utility function to format numbers with comma separators
- Updated price display to use the new formatting

### 2. Ship Date Display Fix
**File:** `src/components/shipping/ParameterPreview.tsx`
**Changes:**
- Fixed date formatting to show the correct selected date instead of 1 day prior
- Updated the getFormattedShipDate function to properly handle date conversion

### 3. Default Address Button Fix
**File:** `src/hooks/useOriginAddress.ts`
**Changes:**
- Updated initialization to properly read from localStorage
- Fixed the initial state to check for custom defaults before using Thailand defaults

### 4. Preferred Currency Note
**File:** `src/components/shipping/ShippingDetailsForm.tsx`
**Changes:**
- Added informational note about account-assigned currency potentially overriding the selected currency

### 5. Origin Address in FedEx API
**Status:** Verified - already working correctly
- The origin address is properly passed through the shipping calculator hook to the API

## Testing Notes:
- Test price display with values over 1000 to verify comma formatting
- Test ship date selection to ensure correct date is displayed
- Test "Set as Default" and "Use Thailand Default" buttons
- Verify currency note displays correctly
- Test changing origin address and verify it's used in API calls

## Next Steps:
- Monitor for any additional formatting or display issues
- Consider adding more currency formatting options based on selected currency
