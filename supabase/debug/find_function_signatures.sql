-- First, let's identify the correct function signatures
-- Run this query to see all functions and their parameters:

SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proname IN (
    'ensure_datetime_format',
    'validate_datetime_format', 
    'export_time_logs_csv',
    'import_time_log_csv',
    'update_updated_at_column'
)
ORDER BY p.proname;
