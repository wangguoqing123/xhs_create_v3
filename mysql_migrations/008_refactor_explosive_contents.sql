-- ============================================
-- 爆款内容表重构迁移脚本
-- 用于支持小红书链接导入和coze接口数据存储
-- ============================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+08:00';

-- ============================================
-- 清空现有数据
-- ============================================
DELETE FROM explosive_contents;

-- ============================================  
-- 删除旧表并重新创建
-- ============================================
DROP TABLE IF EXISTS explosive_contents;

CREATE TABLE explosive_contents (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()) COMMENT '爆款内容ID',
  
  -- 基础信息
  title VARCHAR(500) NOT NULL COMMENT '笔记标题',
  content TEXT NOT NULL COMMENT '笔记正文内容', 
  cover_image VARCHAR(1000) DEFAULT NULL COMMENT '笔记封面图片URL（存储到OSS后的URL）',
  original_cover_url VARCHAR(1000) DEFAULT NULL COMMENT '原始封面图片URL',
  
  -- 作者信息  
  author_name VARCHAR(100) DEFAULT NULL COMMENT '笔记作者昵称',
  author_id VARCHAR(100) DEFAULT NULL COMMENT '作者用户ID',
  author_avatar VARCHAR(1000) DEFAULT NULL COMMENT '作者头像URL',
  
  -- 互动数据
  likes_count INTEGER DEFAULT 0 COMMENT '点赞数',
  collects_count INTEGER DEFAULT 0 COMMENT '收藏数', 
  comments_count INTEGER DEFAULT 0 COMMENT '评论数',
  
  -- 分类信息（使用ID关联类型表）
  track_id INTEGER DEFAULT 7 COMMENT '笔记赛道ID',
  tone_id INTEGER DEFAULT 0 COMMENT '笔记口吻ID', 
  type_id INTEGER DEFAULT 0 COMMENT '笔记类型ID',
  
  -- 元数据
  note_url VARCHAR(1000) DEFAULT NULL COMMENT '原始笔记链接',
  note_id VARCHAR(100) DEFAULT NULL COMMENT '小红书笔记ID',
  tags JSON DEFAULT ('[]') COMMENT '笔记标签列表',
  
  -- 时间信息
  published_at TIMESTAMP DEFAULT NULL COMMENT '笔记发布时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 状态
  status ENUM('enabled', 'disabled') DEFAULT 'enabled' COMMENT '状态：enabled=启用，disabled=禁用',
  
  -- 索引优化
  INDEX idx_explosive_contents_track (track_id),
  INDEX idx_explosive_contents_tone (tone_id), 
  INDEX idx_explosive_contents_type (type_id),
  INDEX idx_explosive_contents_status (status),
  INDEX idx_explosive_contents_published (published_at DESC),
  INDEX idx_explosive_contents_created (created_at DESC),
  INDEX idx_explosive_contents_track_type (track_id, type_id),
  INDEX idx_explosive_contents_note_id (note_id),
  UNIQUE KEY uk_explosive_contents_note_id (note_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爆款内容表';

-- ============================================
-- 创建笔记赛道维护表
-- ============================================
CREATE TABLE note_tracks (
  id INTEGER PRIMARY KEY COMMENT '赛道ID',
  name VARCHAR(50) NOT NULL COMMENT '赛道名称',
  description VARCHAR(200) DEFAULT NULL COMMENT '赛道描述',
  status ENUM('enabled', 'disabled') DEFAULT 'enabled' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  UNIQUE KEY uk_note_tracks_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='笔记赛道维护表';

-- 插入赛道数据
INSERT INTO note_tracks (id, name, description) VALUES
(1, '装修', '装修相关内容'),
(2, '石材', '石材相关内容'),
(3, '旅游', '旅游相关内容'),
(4, '留学', '留学相关内容'),
(5, '保险', '保险相关内容'),
(6, '考研', '考研相关内容'),
(7, '其他', '其他类型内容');

-- ============================================
-- 创建笔记类型维护表  
-- ============================================
CREATE TABLE note_types (
  id INTEGER PRIMARY KEY COMMENT '类型ID',
  name VARCHAR(50) NOT NULL COMMENT '类型名称',
  description VARCHAR(200) DEFAULT NULL COMMENT '类型描述',
  status ENUM('enabled', 'disabled') DEFAULT 'enabled' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  UNIQUE KEY uk_note_types_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='笔记类型维护表';

-- 插入类型数据
INSERT INTO note_types (id, name, description) VALUES
(0, '其他', '其他类型内容'),
(1, '测评内容', '产品测评相关内容'),
(2, '推荐/营销', '推荐营销类内容'),
(3, '干货内容', '知识干货类内容');

-- ============================================
-- 创建笔记口吻维护表
-- ============================================
CREATE TABLE note_tones (
  id INTEGER PRIMARY KEY COMMENT '口吻ID',
  name VARCHAR(50) NOT NULL COMMENT '口吻名称',
  description VARCHAR(200) DEFAULT NULL COMMENT '口吻描述',
  status ENUM('enabled', 'disabled') DEFAULT 'enabled' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  UNIQUE KEY uk_note_tones_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='笔记口吻维护表';

-- 插入口吻数据  
INSERT INTO note_tones (id, name, description) VALUES
(0, '其他', '其他口吻'),
(1, '商家口吻', '商家角度的表达方式'),
(2, '素人口吻', '普通用户角度的表达方式');

-- ============================================
-- 创建统计视图
-- ============================================
CREATE VIEW explosive_contents_stats_v2 AS
SELECT 
  t.name as track_name,
  nt.name as type_name, 
  COUNT(*) as total_count,
  SUM(CASE WHEN ec.status = 'enabled' THEN 1 ELSE 0 END) as enabled_count,
  SUM(CASE WHEN ec.status = 'disabled' THEN 1 ELSE 0 END) as disabled_count,
  AVG(ec.likes_count) as avg_likes,
  AVG(ec.collects_count) as avg_collects
FROM explosive_contents ec
LEFT JOIN note_tracks t ON ec.track_id = t.id
LEFT JOIN note_types nt ON ec.type_id = nt.id
GROUP BY ec.track_id, ec.type_id, t.name, nt.name; 