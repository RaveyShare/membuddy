CREATE TABLE public.review_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_item_id UUID NOT NULL REFERENCES public.memory_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    review_date TIMESTAMPTZ NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 为常用查询添加索引
CREATE INDEX idx_review_schedules_user_id ON public.review_schedules(user_id);
CREATE INDEX idx_review_schedules_memory_item_id ON public.review_schedules(memory_item_id);

-- 启用行级安全 (RLS)
ALTER TABLE public.review_schedules ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略，允许用户访问自己的数据
CREATE POLICY "Allow individual access"
ON public.review_schedules
FOR ALL
USING (auth.uid() = user_id);
