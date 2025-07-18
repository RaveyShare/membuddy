-- Step 1: Add mastery and review_count columns to the memory_items table
-- This ensures the item's overall status is directly accessible and centralized.
-- The IF NOT EXISTS clause makes this script safe to re-run.
ALTER TABLE public.memory_items
ADD COLUMN IF NOT EXISTS mastery INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INT NOT NULL DEFAULT 0;

-- Step 2: Create the definitive function to handle a review session.
-- This is the single source of truth for all review-related database logic.
CREATE OR REPLACE FUNCTION handle_review_session(
    p_item_id UUID,
    p_user_id UUID,
    p_mastery INT,
    p_difficulty VARCHAR,
    p_next_review_date TIMESTAMPTZ
)
RETURNS void AS $$
DECLARE
    schedule_to_complete UUID;
BEGIN
    -- Part A: Update the main memory_item's stats (mastery, difficulty, and increment review count)
    UPDATE public.memory_items
    SET
        mastery = p_mastery,
        difficulty = p_difficulty,
        review_count = review_count + 1
    WHERE id = p_item_id AND user_id = p_user_id;

    -- Part B: Mark the latest due schedule as completed
    SELECT id INTO schedule_to_complete
    FROM public.review_schedules
    WHERE memory_item_id = p_item_id
      AND user_id = p_user_id
      AND completed = FALSE
      AND review_date <= NOW()
    ORDER BY review_date DESC
    LIMIT 1;

    IF schedule_to_complete IS NOT NULL THEN
        UPDATE public.review_schedules
        SET completed = TRUE
        WHERE id = schedule_to_complete;
    END IF;

    -- Part C: Create the new schedule for the next review
    INSERT INTO public.review_schedules (memory_item_id, user_id, review_date, completed)
    VALUES (p_item_id, p_user_id, p_next_review_date, FALSE);
END;
$$ LANGUAGE plpgsql;
