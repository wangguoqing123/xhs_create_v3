-- ============================================
-- 验证会员表结构是否支持调整到期时间功能
-- ============================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+08:00';

SELECT '🔍 开始验证会员表结构...' as status;

-- ============================================
-- 检查 memberships 表是否存在
-- ============================================

SELECT '📋 检查 memberships 表是否存在:' as step;

SELECT 
  TABLE_NAME,
  TABLE_COMMENT
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'memberships';

-- ============================================
-- 检查 memberships 表的关键字段
-- ============================================

SELECT '📋 检查 memberships 表的关键字段:' as step;

SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'memberships'
  AND COLUMN_NAME IN ('id', 'user_id', 'end_date', 'status', 'membership_level', 'membership_duration')
ORDER BY ORDINAL_POSITION;

-- ============================================
-- 检查 admin_operation_logs 表的 operation_type 枚举
-- ============================================

SELECT '📋 检查 admin_operation_logs 表的 operation_type 枚举:' as step;

SELECT 
  COLUMN_TYPE as current_operation_types
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'admin_operation_logs' 
  AND COLUMN_NAME = 'operation_type';

-- ============================================
-- 检查索引情况
-- ============================================

SELECT '📋 检查 memberships 表的索引:' as step;

SELECT 
  INDEX_NAME,
  COLUMN_NAME,
  NON_UNIQUE
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'memberships'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- ============================================
-- 验证结果总结
-- ============================================

SELECT '✅ 验证完成！' as status,
       '检查上述结果确认表结构是否支持调整会员到期时间功能' as note;