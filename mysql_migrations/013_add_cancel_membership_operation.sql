-- ============================================
-- 添加取消会员操作类型迁移脚本
-- 更新admin_operation_logs表的operation_type枚举
-- ============================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+08:00';

SELECT '🔧 开始添加取消会员操作类型...' as status;

-- ============================================
-- 更新admin_operation_logs表的operation_type枚举
-- ============================================

-- 检查admin_operation_logs表是否存在
SET @table_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_operation_logs'
);

-- 如果表存在，更新枚举类型
SET @sql = IF(@table_exists > 0,
  "ALTER TABLE admin_operation_logs MODIFY COLUMN operation_type ENUM('grant_credits', 'set_membership', 'gift_credit_package', 'cancel_membership') NOT NULL COMMENT '操作类型：grant_credits=赠送积分，set_membership=设置会员，gift_credit_package=赠送积分包，cancel_membership=取消会员'",
  "SELECT '⚠️ admin_operation_logs表不存在，跳过操作' as message"
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✅ 取消会员操作类型添加完成' as status; 