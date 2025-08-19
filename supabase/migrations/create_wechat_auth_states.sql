-- 创建微信授权状态表
CREATE TABLE IF NOT EXISTS wechat_auth_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_wechat_auth_states_state ON wechat_auth_states(state);
CREATE INDEX IF NOT EXISTS idx_wechat_auth_states_expires_at ON wechat_auth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_wechat_auth_states_user_id ON wechat_auth_states(user_id);

-- 启用RLS
ALTER TABLE wechat_auth_states ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can manage their own auth states" ON wechat_auth_states
    FOR ALL USING (auth.uid() = user_id);

-- 允许匿名用户创建授权状态（用于登录流程）
CREATE POLICY "Allow anonymous to create auth states" ON wechat_auth_states
    FOR INSERT WITH CHECK (true);

-- 允许匿名用户读取未使用的授权状态（用于验证）
CREATE POLICY "Allow anonymous to read unused auth states" ON wechat_auth_states
    FOR SELECT USING (used = false AND expires_at > NOW());

-- 授权给anon和authenticated角色
GRANT SELECT, INSERT, UPDATE ON wechat_auth_states TO anon;
GRANT ALL PRIVILEGES ON wechat_auth_states TO authenticated;