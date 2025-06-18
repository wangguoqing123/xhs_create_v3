-- 创建批量改写功能相关的数据库表

-- 1. 批量任务表
CREATE TABLE batch_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_name VARCHAR(255) NOT NULL, -- 任务名称（关键词+时间）
  search_keywords VARCHAR(255), -- 搜索关键词
  config JSONB DEFAULT '{}'::jsonb, -- 批量配置（生成数量、类型等）
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')), 
  error_message TEXT, -- 错误信息
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE NULL
);

-- 2. 任务笔记关联表
CREATE TABLE task_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES batch_tasks(id) ON DELETE CASCADE NOT NULL,
  note_id VARCHAR(255) NOT NULL, -- 笔记ID
  note_data JSONB DEFAULT '{}'::jsonb, -- 笔记原始数据
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT, -- 错误信息
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 生成内容表
CREATE TABLE generated_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_note_id UUID REFERENCES task_notes(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(500), -- 生成的标题
  content TEXT, -- 生成的内容
  content_type VARCHAR(50) DEFAULT 'article', -- article, video_script
  generation_config JSONB DEFAULT '{}'::jsonb, -- 生成时的配置
  status VARCHAR(20) DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  error_message TEXT, -- 错误信息
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE NULL
);

-- 启用 RLS (Row Level Security) 所有表
ALTER TABLE batch_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_contents ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略 - batch_tasks表
CREATE POLICY "Users can view own batch_tasks" ON batch_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own batch_tasks" ON batch_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batch_tasks" ON batch_tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- 创建 RLS 策略 - task_notes表
CREATE POLICY "Users can view own task_notes" ON task_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM batch_tasks 
      WHERE batch_tasks.id = task_notes.task_id 
      AND batch_tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own task_notes" ON task_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM batch_tasks 
      WHERE batch_tasks.id = task_notes.task_id 
      AND batch_tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own task_notes" ON task_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM batch_tasks 
      WHERE batch_tasks.id = task_notes.task_id 
      AND batch_tasks.user_id = auth.uid()
    )
  );

-- 创建 RLS 策略 - generated_contents表
CREATE POLICY "Users can view own generated_contents" ON generated_contents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM task_notes 
      JOIN batch_tasks ON batch_tasks.id = task_notes.task_id
      WHERE task_notes.id = generated_contents.task_note_id 
      AND batch_tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own generated_contents" ON generated_contents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_notes 
      JOIN batch_tasks ON batch_tasks.id = task_notes.task_id
      WHERE task_notes.id = generated_contents.task_note_id 
      AND batch_tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own generated_contents" ON generated_contents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM task_notes 
      JOIN batch_tasks ON batch_tasks.id = task_notes.task_id
      WHERE task_notes.id = generated_contents.task_note_id 
      AND batch_tasks.user_id = auth.uid()
    )
  );

-- 创建触发器函数，用于自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表创建 updated_at 触发器
CREATE TRIGGER update_batch_tasks_updated_at
  BEFORE UPDATE ON batch_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_notes_updated_at
  BEFORE UPDATE ON task_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_contents_updated_at
  BEFORE UPDATE ON generated_contents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建索引以提高查询性能
CREATE INDEX batch_tasks_user_id_idx ON batch_tasks(user_id);
CREATE INDEX batch_tasks_status_idx ON batch_tasks(status);
CREATE INDEX batch_tasks_created_at_idx ON batch_tasks(created_at DESC);

CREATE INDEX task_notes_task_id_idx ON task_notes(task_id);
CREATE INDEX task_notes_status_idx ON task_notes(status);

CREATE INDEX generated_contents_task_note_id_idx ON generated_contents(task_note_id);
CREATE INDEX generated_contents_status_idx ON generated_contents(status);

-- 创建复合索引
CREATE INDEX batch_tasks_user_status_created_idx ON batch_tasks(user_id, status, created_at DESC);

-- 添加表注释
COMMENT ON TABLE batch_tasks IS '批量改写任务表';
COMMENT ON TABLE task_notes IS '任务关联的笔记表';
COMMENT ON TABLE generated_contents IS '生成的改写内容表';

COMMENT ON COLUMN batch_tasks.task_name IS '任务名称，通常是关键词+时间';
COMMENT ON COLUMN batch_tasks.config IS '批量配置，包含生成数量、类型、人设等信息';
COMMENT ON COLUMN task_notes.note_data IS '笔记的原始数据，JSON格式';
COMMENT ON COLUMN generated_contents.content IS '生成的改写内容';
COMMENT ON COLUMN generated_contents.generation_config IS '生成时使用的配置参数'; 