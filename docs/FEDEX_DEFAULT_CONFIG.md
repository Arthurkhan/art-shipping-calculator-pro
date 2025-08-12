# FedEx Default Configuration Setup

This document explains how to set up default FedEx API credentials for your Art Shipping Calculator Pro deployment.

## Overview

The application now supports default FedEx API credentials that are securely stored as environment variables on the server. This allows users to calculate shipping rates without entering their own FedEx credentials.

## Security Architecture

- **Server-Side Only**: Credentials are stored as Supabase secrets and never exposed to the client
- **Fallback Mechanism**: Default credentials are used only when no user-specific session exists
- **User Override**: Users can still enter their own credentials to override defaults
- **Encrypted Storage**: All credentials are encrypted using AES-256-GCM

## Setup Instructions

### 1. Set Supabase Secrets

Run the following commands to set up your default FedEx credentials:

```bash
# Set the default FedEx credentials as Supabase secrets
supabase secrets set FEDEX_DEFAULT_ACCOUNT="393735619"
supabase secrets set FEDEX_DEFAULT_CLIENT_ID="l737494b6fbe364f7cb21170155fb98f3a"
supabase secrets set FEDEX_DEFAULT_CLIENT_SECRET="d1e97080f3aa4f2d97e73593d6bff2c6"

# Verify the secrets are set
supabase secrets list
```

Alternatively, use the provided setup script:

```bash
./scripts/setup-fedex-defaults.sh
```

### 2. Deploy Edge Functions

After setting the secrets, deploy the updated Edge Functions:

```bash
./deploy-edge-function.sh
```

## How It Works

### Backend Flow

1. **calculate-shipping Edge Function**:
   - First checks for session-based credentials
   - Falls back to default credentials if no session exists
   - Uses the same encryption and security measures for both

2. **fedex-config Edge Function**:
   - Enhanced to check for default credentials availability
   - Returns `sessionId: 'default'` when using defaults
   - Allows validation of both user and default credentials

### Frontend Flow

1. **Initial Load**:
   - App checks for existing FedEx configuration
   - If defaults are available, shows "Using default configuration" message
   - Calculator is immediately ready to use

2. **User Override**:
   - Users can navigate to Configuration tab
   - See notification about default config being active
   - Can enter their own credentials to override

3. **Visual Indicators**:
   - Green alert banner shows when using defaults
   - Configuration tab shows default status
   - "Use Custom Config" option available

## User Experience

### With Default Credentials

1. User loads the application
2. Sees green banner: "Using default FedEx API configuration"
3. Can immediately calculate shipping rates
4. Optional: Can provide custom credentials

### Without Default Credentials

1. User loads the application
2. Sees yellow banner: "FedEx API configuration required"
3. Must configure credentials before calculating rates
4. Standard configuration flow applies

## Testing

### Verify Default Configuration

1. Clear browser storage/cookies
2. Load the application
3. Should see green "Using default configuration" banner
4. Try calculating a shipping rate - should work immediately

### Test Override Flow

1. With defaults active, go to Configuration tab
2. Enter custom credentials
3. Save and validate
4. Green banner should disappear
5. Custom credentials now in use

### Test Fallback

1. Use custom credentials
2. Clear configuration (trash icon)
3. Should fall back to defaults if available
4. Green banner reappears

## Important Notes

- **Never commit credentials to the repository**
- Default credentials are only for your deployment
- Each deployment needs its own Supabase secrets
- Monitor FedEx API usage in the FedEx Developer Portal
- Consider rate limiting if using shared defaults

## Troubleshooting

### Defaults Not Working

1. Verify secrets are set: `supabase secrets list`
2. Check Edge Function logs for errors
3. Ensure `FEDEX_ENCRYPTION_SECRET` is also set
4. Redeploy Edge Functions after setting secrets

### Session Issues

1. Clear browser storage
2. Check network tab for session ID
3. Verify `fedex-config` endpoint returns `hasConfig: true`

### Rate Calculation Fails

1. Check if credentials are valid with FedEx
2. Verify all three credential fields are set
3. Check Edge Function logs for authentication errors
4. Test credentials in FedEx Developer Portal

## Environment Variables Reference

| Variable | Description | Location |
|----------|-------------|----------|
| `FEDEX_DEFAULT_ACCOUNT` | Default FedEx account number | Supabase Secrets |
| `FEDEX_DEFAULT_CLIENT_ID` | Default OAuth2 client ID | Supabase Secrets |
| `FEDEX_DEFAULT_CLIENT_SECRET` | Default OAuth2 client secret | Supabase Secrets |
| `FEDEX_ENCRYPTION_SECRET` | Encryption key for session data | Supabase Secrets |