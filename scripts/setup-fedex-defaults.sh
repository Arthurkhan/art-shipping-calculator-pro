#!/bin/bash

# Script to set up default FedEx credentials as Supabase secrets
# These credentials will be used as defaults when users don't provide their own

echo "Setting up default FedEx credentials as Supabase secrets..."
echo "WARNING: Only run this on your Supabase project, not in the repository!"
echo ""

# Default FedEx credentials (provided by user)
FEDEX_DEFAULT_ACCOUNT="393735619"
FEDEX_DEFAULT_CLIENT_ID="l737494b6fbe364f7cb21170155fb98f3a"
FEDEX_DEFAULT_CLIENT_SECRET="d1e97080f3aa4f2d97e73593d6bff2c6"

echo "The following commands will set up your Supabase secrets:"
echo ""
echo "supabase secrets set FEDEX_DEFAULT_ACCOUNT=$FEDEX_DEFAULT_ACCOUNT"
echo "supabase secrets set FEDEX_DEFAULT_CLIENT_ID=$FEDEX_DEFAULT_CLIENT_ID"
echo "supabase secrets set FEDEX_DEFAULT_CLIENT_SECRET=$FEDEX_DEFAULT_CLIENT_SECRET"
echo ""
echo "Run these commands in your terminal to set up the secrets."
echo "Make sure you have the Supabase CLI installed and are logged in to your project."
echo ""
echo "To verify the secrets are set, run:"
echo "supabase secrets list"