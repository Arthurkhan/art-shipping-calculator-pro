# Update Log: Fixed Error Message Propagation - 2025-06-25

## Session Summary
Fixed the issue where FedEx service availability errors were showing as generic "Edge Function returned a non-2xx status code" instead of the actual error message.

## Issue Identified
When FedEx doesn't service a route (e.g., Thailand → Italy), the edge function correctly returns the error message "FedEx does not currently offer service between these locations" in the response body with a 500 status. However, the frontend was only showing the generic Supabase error message instead of extracting the actual error from the response data.

## Changes Made

### 1. Enhanced Error Extraction in useShippingCalculator Hook
**File**: `src/hooks/useShippingCalculator.ts`
- **Added**: Check for `response.data.success === false` and extract `response.data.error`
- **Modified**: Error handling to prioritize the actual error message from the edge function
- **Added**: Fallback logic to extract error message from response data even when Supabase reports an error

### Error Handling Flow
```typescript
// 1. Check if edge function returned an error in the response data
if (response.data && response.data.success === false && response.data.error) {
  throw new Error(response.data.error);
}

// 2. Check for Supabase-level errors but still try to extract our error
if (response.error) {
  if (response.data && response.data.error) {
    throw new Error(response.data.error);
  }
  throw response.error;
}
```

## User Experience Improvement

### Before:
- Error shown: "Edge Function returned a non-2xx status code"
- User confused about what went wrong
- No indication that it's a service availability issue

### After:
- Error shown: "FedEx does not currently offer service between these locations"
- Clear service availability alert with route alternatives
- User understands it's a FedEx limitation, not a technical error

## Testing Verification

Test these scenarios:
1. **Service Unavailable**: TH (10240) → IT (20100)
   - Should show: "FedEx does not currently offer service..." with alternatives
   
2. **Valid Route**: TH (10240) → SG (238823)
   - Should work normally and show rates
   
3. **Invalid Credentials**: Use wrong FedEx credentials
   - Should show appropriate authentication error

## Technical Details

The issue was that Supabase's `functions.invoke()` wraps errors in its own error object. When our edge function returns a 500 status with an error message in the body, Supabase creates a generic error. We now extract the actual error message from the response data before throwing the error.

## Completion Status
✅ Fixed error message extraction from edge function response
✅ Proper error propagation to UI components
✅ Service availability errors now display correctly
✅ User gets meaningful feedback about FedEx service limitations

## Notes
- The edge function correctly identifies and returns service availability errors
- The frontend now properly extracts and displays these errors
- The ServiceAvailabilityAlert component shows appropriate alternatives
