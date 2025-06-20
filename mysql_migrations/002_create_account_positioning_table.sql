-- 账号定位表迁移脚本
-- 创建时间: 2024-12-20
-- 描述: 为用户账号定位功能创建数据库表

-- 创建账号定位表
CREATE TABLE IF NOT EXISTS account_positioning (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), -- 账号定位ID，使用UUID
    user_id VARCHAR(36) NOT NULL, -- 用户ID，关联到users表
    name VARCHAR(100) NOT NULL, -- 账号定位命名
    one_line_description TEXT, -- 一句话定位
    core_value TEXT, -- 核心价值
    target_audience TEXT, -- 目标用户
    key_persona TEXT, -- 关键人设
    core_style TEXT, -- 核心风格
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 更新时间
    
    -- 创建外键约束，关联到users表
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 创建索引优化查询性能
    INDEX idx_user_id (user_id), -- 用户ID索引
    INDEX idx_created_at (created_at), -- 创建时间索引
    INDEX idx_name (name) -- 名称索引，支持按名称搜索
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账号定位表';

-- 为账号定位表添加触发器，自动更新updated_at字段
DROP TRIGGER IF EXISTS update_account_positioning_updated_at;

DELIMITER $$
CREATE TRIGGER update_account_positioning_updated_at
    BEFORE UPDATE ON account_positioning
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP; -- 更新时自动设置更新时间
END$$
DELIMITER ;

-- 插入示例数据（可选，用于测试）
-- INSERT INTO account_positioning (user_id, name, one_line_description, core_value, target_audience, key_persona, core_style) 
-- VALUES 
-- ('sample-user-id', '美食博主定位', '分享家常美食，让生活更有味道', '传递温暖的家庭味道', '喜欢烹饪的年轻人', '邻家厨娘', '温暖治愈风格'); 