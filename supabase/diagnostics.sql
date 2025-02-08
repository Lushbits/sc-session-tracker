-- Database Version and Settings
SELECT version() as postgres_version;
SELECT current_setting('search_path') as current_search_path;

-- List all schemas
SELECT nspname as schema_name, 
       pg_catalog.pg_get_userbyid(nspowner) as schema_owner
FROM pg_catalog.pg_namespace
WHERE nspname NOT LIKE 'pg_%' 
  AND nspname != 'information_schema'
ORDER BY schema_name;

-- List all extensions
SELECT extname as extension_name, 
       extversion as version,
       n.nspname as schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid;

-- List all tables and their columns
SELECT 
    t.table_schema,
    t.table_name,
    c.column_name,
    c.data_type,
    c.column_default,
    c.is_nullable,
    c.character_maximum_length,
    tc.constraint_type,
    cc.constraint_name
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON c.table_name = ccu.table_name 
    AND c.column_name = ccu.column_name
LEFT JOIN information_schema.table_constraints tc 
    ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- List all indexes
SELECT
    schemaname as schema_name,
    tablename as table_name,
    indexname as index_name,
    indexdef as index_definition
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- List all RLS policies
SELECT schemaname, 
       tablename, 
       policyname,
       permissive,
       roles,
       cmd,
       qual as using_expression,
       with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- List all functions
SELECT n.nspname as schema_name,
       p.proname as function_name,
       l.lanname as language,
       case when l.lanname = 'internal' then p.prosrc
            else pg_get_functiondef(p.oid)
       end as definition,
       pg_get_function_arguments(p.oid) as arguments,
       CASE
           WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
           WHEN p.provolatile = 's' THEN 'STABLE'
           WHEN p.provolatile = 'v' THEN 'VOLATILE'
       END as volatility,
       p.prosecdef as security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
ORDER BY schema_name, function_name;

-- List all triggers
SELECT 
    tgname as trigger_name,
    relname as table_name,
    proname as function_name,
    CASE tgtype::integer & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as activation,
    CASE tgtype::integer & 60
        WHEN 16 THEN 'UPDATE'
        WHEN 8 THEN 'DELETE'
        WHEN 4 THEN 'INSERT'
        WHEN 20 THEN 'INSERT OR UPDATE'
        WHEN 28 THEN 'INSERT OR UPDATE OR DELETE'
    END as event,
    CASE tgtype::integer & 1
        WHEN 1 THEN 'ROW'
        ELSE 'STATEMENT'
    END as level
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE NOT t.tgisinternal
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY relname, tgname;

-- List all sequences
SELECT 
    sequence_schema,
    sequence_name,
    data_type as sequence_type,
    start_value,
    minimum_value,
    maximum_value,
    increment
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- List table privileges
SELECT 
    grantee,
    table_name,
    string_agg(privilege_type, ', ') as privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
GROUP BY grantee, table_name
ORDER BY table_name, grantee; 