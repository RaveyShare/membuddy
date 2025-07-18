-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (assuming it exists and is managed elsewhere or defined as follows)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory items table
CREATE TABLE memory_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT '其他',
    tags JSONB DEFAULT '[]'::jsonb,
    type VARCHAR(50) DEFAULT 'general',
    difficulty VARCHAR(20) DEFAULT 'medium',
    mastery INTEGER NOT NULL DEFAULT 0,
    review_count INTEGER NOT NULL DEFAULT 0,
    review_date TIMESTAMPTZ DEFAULT NOW(),
    next_review_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day',
    starred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review schedules table
CREATE TABLE review_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    memory_item_id UUID NOT NULL REFERENCES memory_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_date TIMESTAMPTZ NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Memory aids table
CREATE TABLE memory_aids (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    memory_item_id UUID REFERENCES memory_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mind_map_data JSONB,
    mnemonics_data JSONB,
    sensory_associations_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memory_items_user_id ON memory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_review_schedules_user_id ON review_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_review_schedules_memory_item_id ON review_schedules(memory_item_id);
CREATE INDEX IF NOT EXISTS idx_memory_aids_user_id ON memory_aids(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_aids_memory_item_id ON memory_aids(memory_item_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memory_items_updated_at BEFORE UPDATE ON memory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memory_aids_updated_at BEFORE UPDATE ON memory_aids FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
