# Update Log: Add Shipping Date Selection Feature

**Date**: 2025-05-29
**Task**: Add ability for users to choose the shipping date
**Status**: In Progress

## Feature Description
Currently, the system automatically generates tomorrow's date as the shipping date. Users need the ability to select their preferred shipping date for more flexibility in planning shipments.

## Changes Made

### 1. Frontend - Add Date Picker to Shipping Form
- [ ] Update ShippingDetailsForm.tsx to include a date picker
- [ ] Add ship date state to Index.tsx
- [ ] Pass ship date through the shipping calculator

### 2. Backend - Accept User-Selected Ship Date
- [ ] Update shipping-types.ts to include shipDate field
- [ ] Modify fedex-rates.ts to use provided date instead of auto-generating
- [ ] Update payload-builder.ts to use user-provided date

### 3. UI Components
- [ ] Use existing calendar component for date selection
- [ ] Add validation to prevent past dates
- [ ] Default to tomorrow's date if not specified

## Files Modified
- [ ] src/components/shipping/ShippingDetailsForm.tsx
- [ ] src/pages/Index.tsx
- [ ] src/hooks/useShippingCalculator.ts
- [ ] supabase/functions/calculate-shipping/types/shipping-types.ts
- [ ] supabase/functions/calculate-shipping/lib/fedex-rates.ts
- [ ] supabase/functions/calculate-shipping/lib/payload-builder.ts

## Technical Details
- Using the existing calendar UI component from shadcn/ui
- Date validation to ensure selected date is not in the past
- Maintaining backwards compatibility by defaulting to tomorrow if no date is provided

## Next Steps
- Test date picker functionality
- Verify FedEx API accepts custom ship dates
- Consider adding date range restrictions based on FedEx requirements
