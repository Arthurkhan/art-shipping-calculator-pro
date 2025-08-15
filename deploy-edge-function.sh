#!/bin/bash

# Deployment script for edge functions
# Make sure you have the Supabase CLI installed and are logged in

echo "Deploying fedex-config edge function..."
supabase functions deploy fedex-config --project-ref lkqekrhbxtbowaswvvqs

echo "Deploying calculate-shipping edge function..."
supabase functions deploy calculate-shipping --project-ref lkqekrhbxtbowaswvvqs

echo "Deployment complete!"
echo ""
echo "To test the functions locally, run:"
echo "supabase functions serve fedex-config --env-file ./supabase/.env.local"
echo "supabase functions serve calculate-shipping --env-file ./supabase/.env.local"
