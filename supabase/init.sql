-- ================================================
-- LifeStore 数据库初始化脚本
-- 在 Supabase Dashboard -> SQL Editor 中执行
-- ================================================

-- 1. 创建 posts 表
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  platform TEXT NOT NULL CHECK (platform IN ('xhs', 'tiktok')),
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  media_type TEXT CHECK (media_type IN ('image', 'video', NULL)),
  media_url TEXT,
  likes INT DEFAULT 0
);

-- 2. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);

-- 3. 启用 Row Level Security (可选，如需认证)
-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 4. 创建 RLS 策略 - 公开读写（适用于单用户模式）
-- CREATE POLICY "Enable all access for all users" ON posts
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);

-- ================================================
-- Storage Bucket 配置（需手动操作）
-- ================================================
-- 1. 进入 Supabase Dashboard -> Storage
-- 2. 点击 "New bucket" 创建新 bucket
-- 3. Bucket name: media
-- 4. 勾选 "Public bucket" 选项
-- 5. 点击 "Create bucket"

-- ================================================
-- 可选：插入示例数据
-- ================================================
INSERT INTO posts (platform, title, content, tags, media_type, media_url, likes)
VALUES 
  ('xhs', '今日思考：关于未来的规划', 
   E'今天花了一些时间整理接下来的项目文档。把复杂的事情拆解成小块，感觉焦虑感少了很多。\n\n1. 确定核心目标\n2. 拆解为周计划\n3. 每天只专注最重要的三件事\n\n存放一下今天的灵感。',
   ARRAY['思考', '工作日志', '规划'],
   'image',
   'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=800',
   5),
  ('tiktok', '昨晚的夜跑记录 🏃', 
   '坚持就是胜利，虽然配速不快，但流汗的感觉真好。',
   ARRAY['运动', '夜跑'],
   'video',
   'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800',
   89);
