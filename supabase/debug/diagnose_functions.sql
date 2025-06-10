-- Step 1: First, let's see what functions actually exist in your database
-- Run this query to list ALL functions in the public schema:

SELECT 
    p.proname as function_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN p.prosecdef THEN 'definer'
        ELSE 'invoker'
    END as security
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- Step 2: Alternative - Check for functions without search_path
-- This will show you which functions need to be fixed:

SELECT 
    n.nspname::text || '.' || p.proname::text || '(' || 
    pg_catalog.pg_get_function_identity_arguments(p.oid) || ')' as function_signature,
    p.proname as function_name
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
AND NOT p.proconfig @> ARRAY['search_path=pg_catalog, public']
AND p.prokind = 'f'
ORDER BY p.proname;

-- Step 3: Generic fix for ALL functions without search_path
-- After you run the above queries and identify the functions, 
-- you can use this template to fix them:

/*
ALTER FUNCTION public.FUNCTION_NAME(PARAMETERS)
SET search_path = public, pg_catalog;
*/

-- Common shipping calculator functions that might exist:
-- (Only run these if they show up in your query results above)

-- If you have any RLS helper functions:
-- ALTER FUNCTION public.auth()
-- SET search_path = public, pg_catalog;

-- If you have any trigger functions:
-- ALTER FUNCTION public.update_updated_at_column()
-- SET search_path = public, pg_catalog;
