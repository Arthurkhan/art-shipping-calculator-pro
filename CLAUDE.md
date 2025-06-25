# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server on port 8080
- `npm run build` - Production build to `dist/` directory
- `npm run build:dev` - Development build with debugging enabled
- `npm run lint` - Run ESLint code quality checks
- `npm run preview` - Preview production build locally

### Deployment
- `./deploy-edge-function.sh` - Deploy Supabase Edge Functions
- GitHub Actions automatically deploys to GitHub Pages on push to main

## Architecture Overview

### Frontend Stack
- **React 18** with TypeScript and Vite build system
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for styling with custom theme configuration
- **React Hook Form** with Zod validation for form management
- **Tanstack Query** for API state management
- **React Router** for client-side routing

### Backend Architecture
- **Supabase** as primary backend with PostgreSQL database
- **Edge Functions** (Deno) for server-side API logic in `supabase/functions/`
- **Row Level Security (RLS)** policies enforce data access control
- **Session-based authentication** with AES-256-GCM encryption for FedEx credentials

### Security Model
This application implements a security-first architecture safe for public repositories:
- **Zero client-side credentials** - FedEx API keys never reach the browser
- **Server-side encryption** - All sensitive data encrypted using `FEDEX_ENCRYPTION_SECRET`
- **Session isolation** - Temporary sessions with automatic expiry via Deno KV storage
- **Input sanitization** - Comprehensive XSS and injection protection
- **CSP headers** - Content Security Policy prevents unauthorized scripts

### Key Components

#### Core Application Flow
1. **FedEx Configuration** (`src/components/shipping/FedexConfigForm.tsx`)
   - Securely collects and encrypts FedEx credentials
   - Creates temporary session via `supabase/functions/fedex-config/`
   - Stores encrypted config in Deno KV with session expiry

2. **Shipping Calculator** (`src/hooks/useShippingCalculator.ts`)
   - Orchestrates rate calculation with session-based auth
   - Integrates with `calculate-shipping` Edge Function
   - Handles error states and service availability warnings

3. **Rate Calculation Flow**
   - Edge Function: `supabase/functions/calculate-shipping/index.ts`
   - Retrieves encrypted config using session ID
   - Calls FedEx API with proper authentication
   - Returns structured rate data with enhanced error handling

#### Data Architecture
- **Collections Table** - Art collection metadata
- **Sizes Table** - Predefined dimensions and weights for collections
- **Override System** - Custom dimensions bypass database lookups
- **Currency Mapping** - Automatic currency detection based on destination country

#### Component Structure
- `src/components/shipping/` - Core shipping calculator components
- `src/components/ui/` - Reusable shadcn/ui components
- `src/hooks/` - Custom React hooks for business logic
- `src/lib/` - Utility functions and shared logic

### Environment Configuration

Required environment variables:
```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=your-deployment-url
VITE_ENABLE_DEBUG=true/false
VITE_ENCRYPT_STORAGE=true/false
```

Backend environment (Supabase secrets):
```bash
FEDEX_ENCRYPTION_SECRET=strong-encryption-key
SUPABASE_URL=same-as-frontend
SUPABASE_SERVICE_ROLE_KEY=service-role-key
```

### Development Patterns

#### Error Handling
- Use `@/lib/error-utils.ts` for consistent error handling
- Service availability errors trigger route suggestion UI
- All API errors logged with request IDs for debugging

#### State Management
- React Hook Form for form state
- Custom hooks for business logic (shipping, currency, etc.)
- Zustand or context for global state when needed

#### Styling Conventions
- Tailwind utility classes with component variants
- shadcn/ui component library for consistent design
- Responsive design with mobile-first approach

### Testing Strategy
- Integration tests in `tests/` directory
- FedEx API integration testing with `tests/fedex-integration.test.ts`
- Manual testing workflow in `tests/verify-endpoints.js`

### Deployment Architecture
- **GitHub Pages** for frontend hosting
- **Supabase** for backend and database
- **GitHub Actions** for CI/CD pipeline
- **Custom domain** support via CNAME configuration

### Key Files to Understand
- `src/App.tsx` - Main application component
- `src/pages/Index.tsx` - Primary shipping calculator page
- `src/hooks/useShippingCalculator.ts` - Core business logic
- `supabase/functions/calculate-shipping/index.ts` - Main API endpoint
- `vite.config.ts` - Build configuration with security optimizations

## Business Logic Rules

### FedEx API Integration
- **NEVER modify the n8n-compliant payload structure** in `calculate-shipping/index.ts`
- Preserve exact field ordering: accountNumber → requestedShipment → shipper → recipient
- The `preferredCurrency` field is CRITICAL for accurate rate calculations
- Ship date must be in YYYY-MM-DD format
- `rateRequestType` array determines which services are returned

### Currency Mapping
- Auto-suggest currency based on recipient country (e.g., ID → SGD, TH → THB)
- ALWAYS allow manual currency override
- Currency affects FedEx rate calculations significantly
- Default to USD if country mapping not found

### Collection Size System
- Database-driven dimensions from `collection_sizes` table
- Override dimensions take precedence over database values
- Weight calculations include packaging materials
- Dimensions must be in centimeters, weight in kilograms

## Code Quality Standards

### File Size Limits
- No file should exceed 15KB (current violations: Index.tsx @ 21KB)
- Extract large components into smaller, focused modules
- Move business logic to custom hooks

### Function Complexity
- Maximum 50 lines per function
- Single responsibility principle
- Extract complex logic into utility functions

### Component Structure
- Extract business logic to custom hooks
- Keep components focused on UI rendering
- Use composition over inheritance

### Import Organization
Group imports in this order:
1. External libraries
2. Internal modules
3. Components
4. Hooks
5. Utilities/Types

### TypeScript Standards
- Strict mode enabled
- No `any` types without justification
- Explicit return types for functions
- Interface over type for object shapes

## Session Management

### Session Flow
1. User enters FedEx credentials
2. Credentials encrypted with AES-256-GCM
3. Session ID generated (UUID v4)
4. Encrypted data stored in Deno KV
5. Session expires after 30 minutes

### Session ID Usage
- Passed as `x-session-id` header
- Required for all shipping calculations
- Automatically cleared on expiry
- One session per browser tab

## Common Issues and Solutions

### FedEx Rate Errors
- **Session Expired**: Check 30-minute timeout, re-authenticate
- **Missing Encryption Secret**: Verify `FEDEX_ENCRYPTION_SECRET` in Supabase
- **Invalid Credentials**: Use test endpoint to verify
- **API Timeout**: Check FedEx service status

### Service Availability Warnings
- Some routes (e.g., TH → ID) may have limited services
- UI should suggest alternative routes when services unavailable
- Check for service-specific restrictions
- Consider destination country regulations

### Database Connection
- RLS policies must allow public read for collections/sizes
- Service role key required for Edge Functions
- Check Supabase connection pooling limits
- Monitor database performance metrics

## Testing Requirements

### Before Any Major Change
- Run `npm run test:fedex` to verify API integration
- Test Thailand → Indonesia shipping calculation
- Verify currency auto-selection works
- Check error message propagation
- Test session expiry handling

### Critical Test Scenarios
1. Valid FedEx credentials → successful rate calculation
2. Invalid credentials → proper error handling
3. Service unavailable → route suggestion UI appears
4. Session expiry → re-authentication flow
5. Override dimensions → bypass database values
6. Currency selection → affects rate calculation

## Refactoring Guidelines

When refactoring large files:
1. **NEVER simplify or mock existing functionality**
2. Extract logic to hooks/utilities while preserving behavior
3. Test each extraction independently
4. Document changes in UPDATE_LOGS/
5. Follow the Refactoring Roadmap phases in order
6. Maintain backward compatibility
7. Preserve all error handling

## Edge Function Development

### CORS Configuration
- Already configured for production URL
- Add new origins to `corsHeaders` in Edge Functions
- Include credentials for session-based auth

### Error Responses
- Use consistent error format with `requestId`
- Include user-friendly message
- Log detailed error for debugging
- Return appropriate HTTP status codes

### Logging
- Use structured logging with context
- Include session ID in all logs
- Log API call durations
- Monitor error rates

### Performance
- Set appropriate timeouts for FedEx API calls (30s)
- Implement retry logic with exponential backoff
- Cache responses where appropriate (5-minute TTL)
- Monitor response times

## UI/UX Guidelines

### Loading States
- Show skeleton loaders during API calls
- Indicate progress for multi-step operations
- Maintain layout stability during loading

### Error Messages
- User-friendly messages with actionable solutions
- Distinguish between user errors and system errors
- Provide contact information for support
- Include error codes for technical support

### Form Validation
- Real-time validation with clear error indicators
- Validate on blur and submit
- Show success states for valid inputs
- Group related validation errors

### Responsive Design
- Mobile-first with breakpoints at 640px, 768px, 1024px
- Touch-friendly tap targets (minimum 44px)
- Collapsible sections on mobile
- Optimized form layouts for small screens

### Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader announcements for dynamic content
- Color contrast meeting WCAG AA standards

## Performance Considerations

### API Optimization
- Cache FedEx rates for identical requests (5-minute TTL)
- Batch database queries where possible
- Implement request debouncing
- Use connection pooling

### Frontend Performance
- Lazy load route components
- Optimize bundle size with code splitting
- Minimize re-renders with memo/callback
- Use production builds for deployment

### Database Performance
- Use indexes on frequently queried columns
- Optimize query patterns
- Monitor slow queries
- Regular VACUUM operations

## Version Control Best Practices

### Commit Messages
Use conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build/tooling changes

### Branch Strategy
- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `refactor/*` - Code improvements

### PR Requirements
- Update logs in UPDATE_LOGS/
- All tests must pass
- No console errors or warnings
- Code review approval required
- Update documentation if needed

## Critical Implementation Details

### FedEx API Payload Structure (DO NOT MODIFY)
The exact structure that works with n8n integration:
```json
{
  "accountNumber": {
    "value": "YOUR_ACCOUNT_NUMBER"
  },
  "requestedShipment": {
    "shipper": {
      "address": {
        "postalCode": "10240",
        "countryCode": "TH"
      }
    },
    "recipient": {
      "address": {
        "postalCode": "10330",
        "countryCode": "ID"
      }
    },
    "preferredCurrency": "SGD",
    "shipDateStamp": "2025-05-25",
    "pickupType": "DROPOFF_AT_FEDEX_LOCATION",
    "packagingType": "YOUR_PACKAGING",
    "rateRequestType": ["LIST", "ACCOUNT", "INCENTIVE"],
    "requestedPackageLineItems": [{
      "groupPackageCount": 1,
      "weight": {
        "units": "KG",
        "value": 4
      },
      "dimensions": {
        "length": 40,
        "width": 31,
        "height": 28,
        "units": "CM"
      }
    }]
  }
}
```

### State Management Patterns
- **Form state**: React Hook Form with Zod schemas
- **API state**: Tanstack Query with 5-minute cache
- **Global state**: Context for session management
- **Local state**: useState for UI-only concerns

### Error Handling Hierarchy
1. **Network errors** → Retry with exponential backoff
2. **Auth errors** → Clear session, show re-auth UI
3. **Validation errors** → Show inline form errors
4. **Service errors** → Display route alternatives
5. **Unknown errors** → Log with request ID, show generic message

### Database Schema Constraints
- `collections.name`: Unique, required
- `collection_sizes.collection_id`: Foreign key to collections
- `sizes` table: Predefined dimension standards
- All tables: RLS policies for public read access
- Soft deletes: Use `deleted_at` timestamp