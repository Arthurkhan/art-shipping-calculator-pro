# URGENT: Setup Default FedEx Credentials

## Quick Setup (Required for Default Credentials to Work)

The default credentials toggle requires two things:
1. Supabase secrets must be set
2. Edge functions must be deployed with CORS fix

Follow these steps:

### Step 1: Set Supabase Secrets

Run these commands in your terminal:

```bash
# Set the default FedEx credentials
supabase secrets set FEDEX_DEFAULT_ACCOUNT="393735619" --project-ref lkqekrhbxtbowaswvvqs
supabase secrets set FEDEX_DEFAULT_CLIENT_ID="l737494b6fbe364f7cb21170155fb98f3a" --project-ref lkqekrhbxtbowaswvvqs
supabase secrets set FEDEX_DEFAULT_CLIENT_SECRET="d1e97080f3aa4f2d97e73593d6bff2c6" --project-ref lkqekrhbxtbowaswvvqs

# Set the encryption secret (if not already set)
supabase secrets set FEDEX_ENCRYPTION_SECRET="your-strong-encryption-key-here" --project-ref lkqekrhbxtbowaswvvqs

# Verify the secrets are set
supabase secrets list --project-ref lkqekrhbxtbowaswvvqs
```

### Step 2: Deploy the Edge Functions

```bash
# Run the deployment script
./deploy-edge-function.sh
```

This will deploy both the `fedex-config` and `calculate-shipping` edge functions with:
- Access to the secrets you just set
- Fixed CORS headers for localhost:4173 (preview server) and Netlify

### Step 3: Test the Default Credentials

1. Open the app in your browser
2. Go to the FedEx Configuration tab
3. Toggle "Use Default Credentials" to ON
4. The status should change to "Using Default FedEx Credentials"
5. Go back to Rate Calculator tab
6. Try calculating a shipping rate - it should work without entering custom credentials

## Why This Is Required

- The edge functions run on Supabase's servers and need the secrets to be set there
- The secrets are NOT stored in the codebase for security reasons
- Each deployment environment needs its own secrets configured
- The `fedex-config` function must be deployed to check for default credentials

## Troubleshooting

If defaults still don't work after following these steps:

1. Check the edge function logs:
   ```bash
   supabase functions logs fedex-config --project-ref lkqekrhbxtbowaswvvqs
   ```

2. Verify the secrets are properly set:
   ```bash
   supabase secrets list --project-ref lkqekrhbxtbowaswvvqs
   ```

3. Make sure both edge functions are deployed:
   ```bash
   supabase functions list --project-ref lkqekrhbxtbowaswvvqs
   ```

4. Clear browser cache and reload the app

## Security Note

These are YOUR FedEx API credentials. Keep them secure and monitor usage in the FedEx Developer Portal.