-- Fix database schema to properly integrate with Supabase auth
-- This script resolves the "Database error saving new user" issue

-- Step 1: Drop the custom users table if it exists (conflicts with Supabase auth)
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 2: Update memory_items table to reference auth.users instead of custom users table
ALTER TABLE public.memory_items 
DROP CONSTRAINT IF EXISTS memory_items_user_id_fkey;

ALTER TABLE public.memory_items 
ADD CONSTRAINT memory_items_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Update memory_aids table to reference auth.users
ALTER TABLE public.memory_aids 
DROP CONSTRAINT IF EXISTS memory_aids_user_id_fkey;

ALTER TABLE public.memory_aids 
ADD CONSTRAINT memory_aids_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 4: Update shares table to reference auth.users
ALTER TABLE public.shares 
DROP CONSTRAINT IF EXISTS shares_user_id_fkey;

ALTER TABLE public.shares 
ADD CONSTRAINT shares_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 5: Ensure review_schedules is correctly configured (should already be correct)
ALTER TABLE public.review_schedules 
DROP CONSTRAINT IF EXISTS review_schedules_user_id_fkey;

ALTER TABLE public.review_schedules 
ADD CONSTRAINT review_schedules_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 6: Create a public.users view for easier access to auth.users data
-- This provides a convenient way to access user data without directly querying auth.users
CREATE OR REPLACE VIEW public.users AS
SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'avatar_url' as avatar_url,
    created_at,
    updated_at
FROM auth.users;

-- Step 7: Enable Row Level Security (RLS) on all tables
ALTER TABLE public.memory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_aids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for memory_items
CREATE POLICY "Users can view their own memory items" ON public.memory_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory items" ON public.memory_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory items" ON public.memory_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory items" ON public.memory_items
    FOR DELETE USING (auth.uid() = user_id);

-- Step 9: Create RLS policies for memory_aids
CREATE POLICY "Users can view their own memory aids" ON public.memory_aids
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory aids" ON public.memory_aids
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory aids" ON public.memory_aids
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory aids" ON public.memory_aids
    FOR DELETE USING (auth.uid() = user_id);

-- Step 10: Create RLS policies for review_schedules
CREATE POLICY "Users can view their own review schedules" ON public.review_schedules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own review schedules" ON public.review_schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review schedules" ON public.review_schedules
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review schedules" ON public.review_schedules
    FOR DELETE USING (auth.uid() = user_id);

-- Step 11: Create RLS policies for shares
CREATE POLICY "Users can view their own shares" ON public.shares
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shares" ON public.shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shares" ON public.shares
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shares" ON public.shares
    FOR DELETE USING (auth.uid() = user_id);

-- Step 12: Allow public read access to shares (for sharing functionality)
CREATE POLICY "Allow public read access to shares" ON public.shares
    FOR SELECT USING (true);

-- Verification queries (run these to check if everything is working)
-- SELECT * FROM public.users LIMIT 5;
-- SELECT table_name, column_name, constraint_name FROM information_schema.key_column_usage WHERE referenced_table_name = 'users';