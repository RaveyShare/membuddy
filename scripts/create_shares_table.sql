-- Create shares table for sharing functionality
-- This script should be run on the production database

-- Shares table
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