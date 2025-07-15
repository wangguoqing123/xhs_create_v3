-- ============================================
-- 添加published_at字段迁移脚本
-- 为爆文表添加笔记发布时间字段
-- ============================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+08:00';

-- 检查字段是否已存在
SELECT COUNT(*) as field_exists FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'explosive_contents' 
AND column_name = 'published_at';

-- 如果字段不存在，则添加字段
-- 注意：这个脚本需要手动检查上面的查询结果，如果返回0则执行下面的ALTER语句

-- 添加published_at字段
ALTER TABLE explosive_contents 
ADD COLUMN published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '笔记发布时间' 
AFTER status;

-- 添加索引
ALTER TABLE explosive_contents 
ADD INDEX idx_explosive_contents_published_at (published_at DESC);

-- 可选：将现有记录的published_at设置为created_at的值
UPDATE explosive_contents 
SET published_at = created_at 
WHERE published_at IS NULL; 