# 部署 Shares 表到生产环境

## 问题描述
分享功能无法正常工作，因为生产数据库中缺少 `shares` 表。

## 解决方案
需要在 Supabase 生产数据库中执行以下 SQL 脚本来创建 `shares` 表。

## 执行步骤

### 1. 登录 Supabase Dashboard
- 访问 [Supabase Dashboard](https://supabase.com/dashboard)
- 选择 memBuddy 项目

### 2. 打开 SQL Editor
- 在左侧菜单中点击 "SQL Editor"
- 创建新查询

### 3. 执行 SQL 脚本
复制并执行以下 SQL 脚本：

```sql
-- Create shares table for sharing functionality
CREATE TABLE IF NOT EXISTS shares (
    id VARCHAR(255) PRIMARY KEY,
    memory_item_id UUID NOT NULL REFERENCES memory_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_type VARCHAR(50) NOT NULL,
    content_id VARCHAR(255),
    share_content JSONB NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON shares(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_memory_item_id ON shares(memory_item_id);
CREATE INDEX IF NOT EXISTS idx_shares_created_at ON shares(created_at);

-- Add RLS (Row Level Security) policies for shares table
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own shares
CREATE POLICY "Users can view own shares" ON shares
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only create shares for their own memory items
CREATE POLICY "Users can create own shares" ON shares
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        EXISTS (
            SELECT 1 FROM memory_items 
            WHERE id = memory_item_id AND user_id = auth.uid()
        )
    );

-- Policy: Users can delete their own shares
CREATE POLICY "Users can delete own shares" ON shares
    FOR DELETE USING (auth.uid() = user_id);

-- Policy: Allow anonymous access to shares for public viewing
CREATE POLICY "Allow anonymous read access" ON shares
    FOR SELECT USING (true);
```

### 4. 验证表创建
执行以下查询验证表是否创建成功：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'shares';

-- 检查表结构
\d shares;
```

### 5. 测试分享功能
- 在前端应用中创建一个记忆项目
- 尝试分享思维导图、记忆口诀或感官联想
- 验证生成的分享链接包含正确的 ID
- 访问分享链接确认内容正确显示

## 注意事项
- 执行前请确保备份数据库
- 如果遇到权限问题，请联系 Supabase 支持
- RLS 策略确保数据安全，只有创建者可以管理自己的分享
- 匿名用户可以访问分享链接查看内容