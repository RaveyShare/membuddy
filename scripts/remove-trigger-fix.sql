-- Fix for "Database error saving new user" issue
-- This script removes the problematic trigger that conflicts with Supabase auth

-- Remove the trigger that causes conflicts during user registration
DROP TRIGGER IF EXISTS trigger_on_auth_user_created ON auth.users;

-- Remove the trigger function as well
DROP FUNCTION IF EXISTS public.create_public_user_on_signup();

-- Verification: Check if triggers are removed
-- You can run this query to verify:
-- SELECT trigger_name FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users';

-- Note: This fix removes the automatic user creation in public.users table.
-- If you need user data, you should:
-- 1. Use auth.users directly, or
-- 2. Create users manually in your application code after successful registration