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