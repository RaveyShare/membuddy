-- Add WeChat fields to users table
-- This script adds WeChat-related fields to support WeChat login functionality

-- Add WeChat fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS wechat_openid VARCHAR(255),
ADD COLUMN IF NOT EXISTS wechat_unionid VARCHAR(255),
ADD COLUMN IF NOT EXISTS wechat_nickname VARCHAR(255),
ADD COLUMN IF NOT EXISTS wechat_avatar TEXT;

-- Create indexes for WeChat fields for better performance
CREATE INDEX IF NOT EXISTS idx_users_wechat_openid ON users(wechat_openid);
CREATE INDEX IF NOT EXISTS idx_users_wechat_unionid ON users(wechat_unionid);

-- Add unique constraints for WeChat identifiers
ALTER TABLE users 
ADD CONSTRAINT unique_wechat_openid UNIQUE (wechat_openid),
ADD CONSTRAINT unique_wechat_unionid UNIQUE (wechat_unionid);

-- Update the name column to full_name if it doesn't exist
ALTER TABLE users 
RENAME COLUMN name TO full_name;

-- Make email nullable for WeChat users (they might not have email)
ALTER TABLE users 
ALTER COLUMN email DROP NOT NULL;

COMMIT;