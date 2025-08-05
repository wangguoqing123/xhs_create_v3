-- 创建创作灵感相关表结构
-- 创建时间: 2025-01-04

-- 创作灵感会话表
CREATE TABLE IF NOT EXISTS creative_inspiration_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  industry VARCHAR(255) NOT NULL COMMENT '行业关键词',
  search_results_count INT DEFAULT 0 COMMENT '搜索结果数量',
  credits_consumed INT DEFAULT 0 COMMENT '消耗的积分数',
  status ENUM('analyzing', 'completed', 'failed') DEFAULT 'analyzing' COMMENT '会话状态',
  error_message TEXT NULL COMMENT '错误信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_status (status),
  INDEX idx_industry (industry)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='创作灵感会话表';

-- 生成的选题主题表
CREATE TABLE IF NOT EXISTS creative_inspiration_topics (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL COMMENT '主题标题',
  description TEXT COMMENT '主题描述',
  keywords JSON COMMENT '相关关键词数组',
  popularity_score INT DEFAULT 0 COMMENT '热度评分',
  sort_order INT DEFAULT 0 COMMENT '排序顺序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (session_id) REFERENCES creative_inspiration_sessions(id) ON DELETE CASCADE,
  INDEX idx_session_id (session_id),
  INDEX idx_sort_order (session_id, sort_order),
  INDEX idx_popularity (popularity_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='创作灵感选题主题表';

-- 验证表是否创建成功
SELECT 
  TABLE_NAME,
  TABLE_COMMENT,
  CREATE_TIME
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN ('creative_inspiration_sessions', 'creative_inspiration_topics')
ORDER BY TABLE_NAME;

-- 验证索引是否创建成功
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  COLUMN_NAME,
  SEQ_IN_INDEX
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN ('creative_inspiration_sessions', 'creative_inspiration_topics')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;