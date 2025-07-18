-- Enable Row Level Security (RLS) for all relevant tables
ALTER TABLE public.memory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_aids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_schedules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean slate (optional but recommended)
DROP POLICY IF EXISTS "Users can view their own memory items" ON public.memory_items;
DROP POLICY IF EXISTS "Users can manage their own memory items" ON public.memory_items;
DROP POLICY IF EXISTS "Users can view their own memory aids" ON public.memory_aids;
DROP POLICY IF EXISTS "Users can manage their own memory aids" ON public.memory_aids;
DROP POLICY IF EXISTS "Users can view their own review schedules" ON public.review_schedules;
DROP POLICY IF EXISTS "Users can manage their own review schedules" ON public.review_schedules;

-- Create SELECT policies: Allow users to read their own data.
CREATE POLICY "Users can view their own memory items"
ON public.memory_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own memory aids"
ON public.memory_aids FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own review schedules"
ON public.review_schedules FOR SELECT
USING (auth.uid() = user_id);

-- Create INSERT policies: Allow users to insert data for themselves.
CREATE POLICY "Users can insert their own memory items"
ON public.memory_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory aids"
ON public.memory_aids FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own review schedules"
ON public.review_schedules FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create UPDATE policies: Allow users to update their own data.
CREATE POLICY "Users can update their own memory items"
ON public.memory_items FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory aids"
ON public.memory_aids FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review schedules"
ON public.review_schedules FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create DELETE policies: Allow users to delete their own data.
CREATE POLICY "Users can delete their own memory items"
ON public.memory_items FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory aids"
ON public.memory_aids FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review schedules"
ON public.review_schedules FOR DELETE
USING (auth.uid() = user_id);
