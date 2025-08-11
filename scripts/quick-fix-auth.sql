-- Quick fix for "Database error saving new user" issue
-- This script ensures proper Supabase auth integration

-- 1. Drop custom users table if it exists (conflicts with Supabase auth)
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Update foreign key constraints to reference auth.users
-- Fix memory_items table
ALTER TABLE public.memory_items 
DROP CONSTRAINT IF EXISTS memory_items_user_id_fkey;

ALTER TABLE public.memory_items 
ADD CONSTRAINT memory_items_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix memory_aids table
ALTER TABLE public.memory_aids 
DROP CONSTRAINT IF EXISTS memory_aids_user_id_fkey;

ALTER TABLE public.memory_aids 
ADD CONSTRAINT memory_aids_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix shares table
ALTER TABLE public.shares 
DROP CONSTRAINT IF EXISTS shares_user_id_fkey;

ALTER TABLE public.shares 
ADD CONSTRAINT shares_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Create a view for easier user data access
CREATE OR REPLACE VIEW public.users AS
SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name' as full_name,
    created_at,
    updated_at
FROM auth.users;

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;