-- Migration to fix Supabase security warnings
-- This addresses the function_search_path_mutable warnings

-- Fix 1: Set search_path for ensure_datetime_format function
ALTER FUNCTION public.ensure_datetime_format(text)
SET search_path = public, pg_catalog;

-- Fix 2: Set search_path for validate_datetime_format function
ALTER FUNCTION public.validate_datetime_format(text)
SET search_path = public, pg_catalog;

-- Fix 3: Set search_path for export_time_logs_csv function
ALTER FUNCTION public.export_time_logs_csv(uuid, date, date, uuid)
SET search_path = public, pg_catalog;

-- Fix 4: Set search_path for import_time_log_csv function
ALTER FUNCTION public.import_time_log_csv(uuid, text)
SET search_path = public, pg_catalog;

-- Fix 5: Set search_path for update_updated_at_column function
ALTER FUNCTION public.update_updated_at_column()
SET search_path = public, pg_catalog;

-- Note: The auth warnings (leaked password protection and MFA options) 
-- need to be fixed in the Supabase dashboard, not through SQL migrations.
