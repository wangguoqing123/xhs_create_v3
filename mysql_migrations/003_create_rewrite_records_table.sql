-- ============================================
-- 爆文改写记录表迁移脚本
-- 用于记录单次爆文生成的完整信息
-- ============================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+08:00';

-- ============================================
-- 爆文改写记录表
-- ============================================

CREATE TABLE rewrite_records (
  id CHAR(36) PRIMARY KEY COMMENT '记录唯一标识',
  user_id CHAR(36) NOT NULL COMMENT '用户ID',
  original_text TEXT NOT NULL COMMENT '要改写的原文内容',
  source_url VARCHAR(1000) DEFAULT NULL COMMENT '如果是链接解析的，保存原始链接',
  source_type ENUM('link', 'text') NOT NULL DEFAULT 'text' COMMENT '来源类型：link=链接解析，text=直接输入',
  generation_config JSON DEFAULT ('{}') COMMENT '生成时的配置（主题、人设、目的、关键词、账号定位等）',
  generated_content JSON DEFAULT ('[]') COMMENT '改写后的结果（包含多个版本的标题和内容）',
  status ENUM('generating', 'completed', 'failed') DEFAULT 'generating' COMMENT '生成状态',
  credits_consumed INTEGER NOT NULL DEFAULT 0 COMMENT '消耗的积分数',
  error_message TEXT DEFAULT NULL COMMENT '错误信息（如果生成失败）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  completed_at TIMESTAMP NULL DEFAULT NULL COMMENT '完成时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 外键约束
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- 索引优化
  INDEX idx_rewrite_records_user_id (user_id),
  INDEX idx_rewrite_records_status (status),
  INDEX idx_rewrite_records_created_at (created_at DESC),
  INDEX idx_rewrite_records_user_status_created (user_id, status, created_at DESC),
  INDEX idx_rewrite_records_source_type (source_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爆文改写记录表';

-- ============================================
-- 脚本执行完成
-- ============================================

SELECT '爆文改写记录表创建完成！' as message; 