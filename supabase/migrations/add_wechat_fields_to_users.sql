-- 为用户表添加微信相关字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS wechat_openid VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS wechat_unionid VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS wechat_nickname VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS wechat_avatar TEXT;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_wechat_openid ON users(wechat_openid);
CREATE INDEX IF NOT EXISTS idx_users_wechat_unionid ON users(wechat_unionid);

-- 添加唯一约束（如果需要）
-- 使用DO块来安全地添加约束
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_wechat_openid' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT unique_wechat_openid UNIQUE(wechat_openid);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_wechat_unionid' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT unique_wechat_unionid UNIQUE(wechat_unionid);
    END IF;
END $$;

-- 确保现有的RLS策略仍然适用于新字段
-- 用户表的RLS策略应该已经存在，新字段会自动继承这些策略

-- 如果需要特定的微信字段访问策略，可以在这里添加
-- 例如：允许用户更新自己的微信信息
-- 这里假设现有的用户表RLS策略已经足够