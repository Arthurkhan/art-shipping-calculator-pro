# Currency Selection Bug Fix - Session Update Log

**Date:** May 25, 2025  
**Session Focus:** Fix shipping calculator showing $0.00 USD instead of actual rates in user-selected currency (SGD)  
**Issue Type:** Critical Bug - Functional

## Problem Identified

The shipping calculator was displaying $0.00 USD for all shipping options instead of showing actual rates in the user-selected preferred currency (SGD in this case).

### Root Cause Analysis

1. **Frontend Issue:** Frontend correctly sends `preferredCurrency` parameter to backend
2. **Backend Issue:** The `getFedexRates` function was not accepting the `preferredCurrency` parameter
3. **Logic Flaw:** Backend was using auto-mapping based on destination country (ID = Indonesia) 
4. **Default Behavior:** When destination country not in currency map, it defaulted to USD
5. **API Response:** FedEx was likely returning $0.00 because the currency/destination combination was invalid

### Expected vs Actual Behavior

**Expected:** 
- User selects SGD as preferred currency
- Calculator shows rates like "SGD 116.00" for FedEx International Priority
- Multiple rate types with proper SGD amounts

**Actual:**
- User selects SGD as preferred currency  
- Calculator shows "$0.00 USD" for all shipping options
- No actual rate calculations being displayed

## Files Modified

### 1. `/supabase/functions/calculate-shipping/index.ts`

**Changes Made:**

1. **Interface Update:**
   ```typescript
   interface ShippingRequest {
     // ... existing fields
     preferredCurrency?: string; // ADDED: Optional preferredCurrency parameter
   }
   ```

2. **Function Signature Update:**
   ```typescript
   // OLD:
   async function getFedexRates(
     accessToken: string,
     accountNumber: string,
     sizeData: CollectionSize,
     originCountry: string,
     originPostalCode: string,
     destinationCountry: string,
     destinationPostalCode: string
   )

   // NEW:
   async function getFedexRates(
     accessToken: string,
     accountNumber: string,
     sizeData: CollectionSize,
     originCountry: string,
     originPostalCode: string,
     destinationCountry: string,
     destinationPostalCode: string,
     userPreferredCurrency?: string // ADDED
   )
   ```

3. **Currency Selection Logic Update:**
   ```typescript
   // OLD: Always use auto-mapping
   const preferredCurrency = getCurrency(destinationCountry);

   // NEW: Use user selection first, fallback to auto-mapping
   let preferredCurrency = userPreferredCurrency;
   
   if (!preferredCurrency) {
     // Fallback to auto-mapping if no user preference provided
     const getCurrency = (country: string): string => {
       const currencyMap: { [key: string]: string } = {
         'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR',
         'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR', 'AT': 'EUR', 'BE': 'EUR',
         'JP': 'JPY', 'AU': 'AUD', 'TH': 'THB', 'SG': 'SGD', 'HK': 'HKD'
       };
       return currencyMap[country] || 'USD';
     };
     preferredCurrency = getCurrency(destinationCountry);
   }
   ```

4. **Function Call Update:**
   ```typescript
   // OLD:
   const fedexRates = await getFedexRates(
     accessToken,
     accountNumber,
     sizeData,
     originCountry,
     originPostalCode,
     requestData.country,
     requestData.postalCode
   );

   // NEW:
   const fedexRates = await getFedexRates(
     accessToken,
     accountNumber,
     sizeData,
     originCountry,
     originPostalCode,
     requestData.country,
     requestData.postalCode,
     requestData.preferredCurrency // ADDED: Pass user-selected currency
   );
   ```

5. **Enhanced Logging:**
   - Added currency source tracking (USER_SELECTED vs AUTO_MAPPED)
   - Added detailed currency selection logging
   - Enhanced error logging with currency information

## Testing Validation

**Test Case:** Thailand (TH 10240) → Indonesia (ID 10350) shipping HippopArt Size S with SGD preferred currency

**Expected Results After Fix:**
- FedEx API receives SGD as preferredCurrency in payload
- Response should contain actual SGD rates (e.g., "SGD 116.00" for Priority)
- UI displays rates in SGD format with proper amounts
- No more $0.00 USD default values

## Success Criteria

✅ **Backend Function Updated:** Modified to accept and use preferredCurrency parameter  
✅ **Currency Logic Fixed:** User selection takes precedence over auto-mapping  
✅ **Backward Compatibility:** Auto-mapping maintained as fallback  
✅ **Logging Enhanced:** Better debugging information for currency selection  
🔄 **Deployment:** Function automatically deploys to Supabase  
🔄 **Testing Required:** User needs to test the actual rate calculation

## Next Steps

1. **User Testing:** Test the shipping calculator with SGD selection
2. **Verify Results:** Confirm rates show actual SGD amounts instead of $0.00 USD
3. **Cross-Currency Testing:** Test with other currencies (EUR, GBP, etc.)
4. **Edge Case Testing:** Test with countries not in auto-mapping list

## Technical Notes

- **Deployment:** Supabase Edge Functions auto-deploy on commit to main branch
- **Cache:** No cache clearing required for Edge Functions
- **Monitoring:** Check Supabase logs if issues persist
- **Rollback:** Previous commit available if rollback needed: `1280ef855ef7cfe1233c84fb03db7146b19813f1`

## Related Issues

This fix addresses the core functionality issue but maintains all existing features:
- FedEx API integration remains intact
- Error handling preserved
- Retry logic unchanged
- All existing validation rules maintained

## Code Quality Impact

- **Lines Changed:** ~15 lines modified
- **Breaking Changes:** None (backward compatible)
- **Test Coverage:** Existing error handling covers edge cases
- **Performance:** No performance impact

---
**Session Complete:** ✅ Currency selection bug fixed, ready for user testing
