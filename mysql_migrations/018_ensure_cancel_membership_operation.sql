-- ============================================
-- 确保取消会员操作类型存在迁移脚本
-- 强制更新admin_operation_logs表的operation_type枚举
-- ============================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+08:00';

SELECT '🔧 开始确保取消会员操作类型存在...' as status;

-- ============================================
-- 检查当前operation_type枚举值
-- ============================================

SELECT '📋 检查当前operation_type枚举值:' as step;

SELECT 
  COLUMN_TYPE as current_enum_values
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'admin_operation_logs' 
  AND COLUMN_NAME = 'operation_type';

-- ============================================
-- 强制更新admin_operation_logs表的operation_type枚举
-- ============================================

SELECT '🔧 更新operation_type枚举值...' as step;

-- 直接更新枚举类型，包含所有需要的值
ALTER TABLE admin_operation_logs 
MODIFY COLUMN operation_type ENUM(
  'grant_credits', 
  'set_membership', 
  'gift_credit_package', 
  'cancel_membership'
) NOT NULL COMMENT '操作类型：grant_credits=赠送积分，set_membership=设置会员，gift_credit_package=赠送积分包，cancel_membership=取消会员';

-- ============================================
-- 验证更新结果
-- ============================================

SELECT '✅ 验证更新后的枚举值:' as step;

SELECT 
  COLUMN_TYPE as updated_enum_values
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'admin_operation_logs' 
  AND COLUMN_NAME = 'operation_type';

SELECT '✅ 取消会员操作类型确保完成！' as status; 