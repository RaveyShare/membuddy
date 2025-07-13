-- Insert sample users
INSERT INTO users (id, email, name, avatar_url) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'demo@membuddy.com', '张小明', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'),
    ('550e8400-e29b-41d4-a716-446655440002', 'test@example.com', '李小红', 'https://api.dicebear.com/7.x/avataaars/svg?seed=test');

-- Insert sample memory items
INSERT INTO memory_items (id, user_id, title, content, category, tags, type, difficulty, starred) VALUES
    (
        '660e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440001',
        '中国历史朝代顺序',
        '夏、商、周、秦、汉、三国、晋、南北朝、隋、唐、五代十国、宋、元、明、清',
        '历史',
        '["历史", "朝代", "顺序"]'::jsonb,
        'sequence',
        'medium',
        true
    ),
    (
        '660e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440001',
        '化学元素周期表前20个元素',
        '氢氦锂铍硼碳氮氧氟氖钠镁铝硅磷硫氯氩钾钙',
        '化学',
        '["化学", "元素", "周期表"]'::jsonb,
        'list',
        'hard',
        false
    ),
    (
        '660e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440001',
        '英语不规则动词变化',
        'go-went-gone, see-saw-seen, do-did-done, have-had-had',
        '语言',
        '["英语", "动词", "语法"]'::jsonb,
        'grammar',
        'easy',
        true
    );

-- Insert sample memory reviews
INSERT INTO memory_reviews (memory_item_id, user_id, next_review_date, mastery_level, review_count) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE + INTERVAL '2 days', 85, 12),
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE + INTERVAL '1 day', 72, 8),
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE, 90, 15);

-- Insert sample memory aids
INSERT INTO memory_aids (memory_item_id, user_id, mind_map_data, mnemonics_data, sensory_associations_data) VALUES
    (
        '660e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440001',
        '{
            "id": "root",
            "label": "中国历史朝代",
            "children": [
                {
                    "id": "ancient",
                    "label": "上古时期",
                    "children": [
                        {"id": "xia", "label": "夏朝"},
                        {"id": "shang", "label": "商朝"},
                        {"id": "zhou", "label": "周朝"}
                    ]
                },
                {
                    "id": "imperial",
                    "label": "帝国时期",
                    "children": [
                        {"id": "qin", "label": "秦朝"},
                        {"id": "han", "label": "汉朝"},
                        {"id": "three-kingdoms", "label": "三国"}
                    ]
                }
            ]
        }'::jsonb,
        '[
            {
                "id": "rhyme",
                "title": "朝代顺序歌诀",
                "content": "夏商与西周，东周分两段。\\n春秋和战国，一统秦两汉。",
                "type": "rhyme"
            }
        ]'::jsonb,
        '[
            {
                "id": "visual",
                "title": "视觉联想记忆",
                "type": "visual",
                "content": [
                    {"dynasty": "夏朝", "image": "🌞", "color": "#fbbf24", "association": "夏天的金色阳光"}
                ]
            }
        ]'::jsonb
    );
