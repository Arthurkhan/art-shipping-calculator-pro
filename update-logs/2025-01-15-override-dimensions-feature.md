# Update Log: Override Dimensions Feature
**Date**: January 15, 2025
**Feature**: Add ability to override collection dimensions, weight, and quantity of boxes

## Summary
Implementing a major feature that allows users to override the default collection dimensions, weight, and quantity of boxes for shipping calculations.

## Files Created
- [x] `src/hooks/useOverrideSettings.ts` - State management for override functionality
- [x] `src/components/shipping/OverrideToggleButton.tsx` - Toggle button component
- [x] `src/components/shipping/OverrideForm.tsx` - Form for custom values input

## Files Modified
- [x] `src/pages/Index.tsx` - Integrate override functionality
- [x] `src/components/shipping/ParameterPreview.tsx` - Display override values
- [x] `src/hooks/useShippingCalculator.ts` - Send override values to backend
- [ ] `src/hooks/useShippingValidation.ts` - Update validation logic (may not need modification)
- [x] `supabase/functions/calculate-shipping/index.ts` - Handle override values
- [x] `supabase/functions/calculate-shipping/types/shipping-types.ts` - Add override types
- [x] `supabase/functions/calculate-shipping/lib/payload-builder.ts` - Use override values
- [x] `supabase/functions/calculate-shipping/lib/fedex-rates.ts` - Support quantity parameter
- [x] `supabase/functions/calculate-shipping/types/fedex-types.ts` - Add quantity to PayloadParams

## Implementation Status
- [x] Frontend hook created
- [x] UI components created
- [x] Frontend integration complete
- [x] Backend types updated
- [x] Backend logic updated
- [ ] Testing complete

## Feature Details
The override feature allows users to:
1. Toggle between using default collection dimensions and custom values
2. Enter custom dimensions (length, width, height) in centimeters
3. Enter custom weight in kilograms
4. Specify quantity of boxes (multiple packages)
5. See real-time validation of entered values
6. View dimensional weight calculations
7. Reset to default values

## Integration Points
1. **Frontend:**
   - Override toggle button in the collection selection section
   - Override form appears when enabled
   - Parameter preview shows override values when active
   - Validation includes override values check
   - Calculate button disabled if override values are invalid

2. **Backend:**
   - Accepts override data in shipping request
   - Uses override values instead of database values when provided
   - Supports quantity parameter for multiple boxes
   - FedEx API payload correctly uses override values

## Next Steps
1. Test the complete flow with override enabled
2. Test with multiple boxes (quantity > 1)
3. Verify FedEx API accepts the override values
4. Test validation edge cases
5. Ensure UI responsiveness on mobile devices
