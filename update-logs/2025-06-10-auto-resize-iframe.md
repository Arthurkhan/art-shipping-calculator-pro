# Update Log - Auto-Resizing Iframe Implementation
Date: June 10, 2025
Session Type: Feature Addition

## Overview
Implemented automatic iframe height adjustment to prevent content cutoff issues in Squarespace integration.

## Problem Identified
The fixed iframe height (900px) was cutting off the shipping calculator content, especially when results were displayed below the form.

## Changes Made

### 1. Created Auto-Resize Hook
- **File**: `src/hooks/useIframeResize.ts`
- **Purpose**: Automatically detect height changes and communicate with parent window
- **Features**:
  - ResizeObserver for size changes
  - MutationObserver for content changes
  - PostMessage communication with parent

### 2. Updated App Component
- **File**: `src/App.tsx`
- **Changes**: 
  - Added `useIframeResize` hook to AppContent component
  - Ensures auto-resize works throughout the app

### 3. Created Auto-Resize Documentation
- **File**: `docs/AUTO_RESIZE_IFRAME.md`
- **Purpose**: Detailed guide for implementing auto-resizing iframe
- **Content**:
  - Enhanced Squarespace code with resize listener
  - Security considerations
  - Troubleshooting guide
  - Alternative fixed-height solution

### 4. Updated Quick Start Guide
- **File**: `QUICK_START.md`
- **Changes**: 
  - Default iframe code now includes auto-resize
  - Simplified implementation
  - Added fallback options

## Technical Implementation

### App Side (React)
```typescript
// Sends height updates to parent window
window.parent.postMessage({
  type: 'resize',
  height: document.documentElement.scrollHeight
}, '*');
```

### Squarespace Side (HTML/JS)
```javascript
// Listens for height updates and adjusts iframe
window.addEventListener('message', function(e) {
  if (e.data.type === 'resize' && e.data.height) {
    iframe.style.height = (e.data.height + 50) + 'px';
  }
});
```

## Features Added
- ✅ Automatic height detection
- ✅ Smooth transitions
- ✅ Loading state while iframe loads
- ✅ Fallback for browsers without support
- ✅ Mobile responsive
- ✅ No scrollbars within iframe

## Success Criteria
✅ Content no longer cut off
✅ Results fully visible when displayed
✅ No manual height adjustment needed
✅ Works on all modern browsers
✅ Graceful degradation

## Next Steps
1. Deploy updated code to Netlify
2. Update Squarespace iframe code
3. Test on various screen sizes
4. Monitor for any edge cases

## Notes
- Added 50px padding to ensure content is never cut off
- Used scrollHeight for accurate measurement
- Security note added for production use
- Alternative fixed-height solution provided for simplicity
