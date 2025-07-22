-- ============================================
-- 数据库迁移状态检查脚本
-- 用于检查009迁移脚本的执行状态
-- ============================================

SELECT '🔍 开始检查数据库迁移状态...' as status;

-- ============================================
-- 1. 检查memberships表结构
-- ============================================
SELECT '📋 检查memberships表结构:' as check_item;

-- 检查表是否存在
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ memberships表存在'
    ELSE '❌ memberships表不存在'
  END as table_status
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships';

-- 检查表结构（如果表存在）
SELECT 
  COLUMN_NAME as column_name,
  COLUMN_TYPE as column_type,
  IS_NULLABLE as nullable,
  COLUMN_DEFAULT as default_value,
  COLUMN_COMMENT as comment
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships'
ORDER BY ORDINAL_POSITION;

-- ============================================
-- 2. 检查存储过程
-- ============================================
SELECT '🔧 检查存储过程:' as check_item;

SELECT 
  ROUTINE_NAME as procedure_name,
  CASE 
    WHEN ROUTINE_NAME = 'SetMembership' THEN '✅ 新的通用会员设置过程'
    WHEN ROUTINE_NAME = 'CheckAndResetUserCredits' THEN '✅ 个人积分重置检查过程'
    WHEN ROUTINE_NAME = 'BatchCheckCreditsReset' THEN '✅ 批量积分重置检查过程'
    WHEN ROUTINE_NAME IN ('SetMonthlyMembership', 'SetYearlyMembership', 'GrantYearlyMemberMonthlyCredits') THEN '⚠️ 旧过程（应该被删除）'
    ELSE CONCAT('📌 其他过程: ', CONVERT(ROUTINE_NAME USING utf8mb4))
  END as status
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'PROCEDURE'
AND ROUTINE_NAME IN (
  'SetMembership', 
  'CheckAndResetUserCredits', 
  'BatchCheckCreditsReset',
  'SetMonthlyMembership', 
  'SetYearlyMembership', 
  'GrantYearlyMemberMonthlyCredits'
)
ORDER BY ROUTINE_NAME;

-- ============================================
-- 3. 检查视图
-- ============================================
SELECT '👁️ 检查user_membership_status视图:' as check_item;

SELECT 
  TABLE_NAME as view_name,
  CASE 
    WHEN TABLE_NAME = 'user_membership_status' THEN '✅ 会员状态视图存在'
    ELSE CONCAT('📌 其他视图: ', CONVERT(TABLE_NAME USING utf8mb4))
  END as status
FROM information_schema.VIEWS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_membership_status';

-- 检查视图列结构
SELECT 
  COLUMN_NAME as column_name,
  DATA_TYPE as data_type
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_membership_status'
ORDER BY ORDINAL_POSITION;

-- ============================================
-- 4. 检查定时事件
-- ============================================
SELECT '⏰ 检查定时事件:' as check_item;

SELECT 
  EVENT_NAME as event_name,
  STATUS as status,
  EVENT_TYPE as type,
  INTERVAL_VALUE as interval_value,
  INTERVAL_FIELD as interval_field,
  CASE 
    WHEN EVENT_NAME = 'hourly_credits_reset_check' THEN '✅ 新的每小时积分检查事件'
    WHEN EVENT_NAME = 'monthly_credits_reset_event' THEN '⚠️ 旧的月度重置事件（应该被删除）'
    ELSE CONCAT('📌 其他事件: ', CONVERT(EVENT_NAME USING utf8mb4))
  END as description
FROM information_schema.EVENTS 
WHERE EVENT_SCHEMA = DATABASE()
ORDER BY EVENT_NAME;

-- ============================================
-- 5. 检查外键约束
-- ============================================
SELECT '🔗 检查外键约束:' as check_item;

SELECT 
  CONSTRAINT_NAME as constraint_name,
  TABLE_NAME as table_name,
  REFERENCED_TABLE_NAME as referenced_table,
  CASE 
    WHEN CONSTRAINT_NAME = 'fk_memberships_user_id' THEN '✅ 会员表用户外键'
    WHEN CONSTRAINT_NAME = 'fk_yearly_credits_membership_id' THEN '✅ 年度积分会员外键'
    ELSE CONCAT('📌 其他约束: ', CONVERT(CONSTRAINT_NAME USING utf8mb4))
  END as description
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
AND REFERENCED_TABLE_NAME IS NOT NULL
AND TABLE_NAME IN ('memberships', 'yearly_member_credits')
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- ============================================
-- 6. 检查备份表
-- ============================================
SELECT '💾 检查备份表:' as check_item;

SELECT 
  TABLE_NAME as table_name,
  TABLE_ROWS as row_count,
  CASE 
    WHEN TABLE_NAME = 'memberships_backup' THEN '✅ 会员数据备份表'
    ELSE CONCAT('📌 其他备份: ', CONVERT(TABLE_NAME USING utf8mb4))
  END as description
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE '%backup%'
ORDER BY TABLE_NAME;

-- ============================================
-- 7. 检查会员数据
-- ============================================
SELECT '📊 检查当前会员数据:' as check_item;

-- 如果memberships表存在，显示数据统计
SELECT 
  COUNT(*) as total_memberships,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_memberships,
  COUNT(CASE WHEN membership_level = 'lite' THEN 1 END) as lite_members,
  COUNT(CASE WHEN membership_level = 'pro' THEN 1 END) as pro_members,
  COUNT(CASE WHEN membership_level = 'premium' THEN 1 END) as premium_members
FROM memberships
WHERE EXISTS (
  SELECT 1 FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships'
);

-- ============================================
-- 完成检查
-- ============================================
SELECT '✅ 数据库迁移状态检查完成！' as final_status; 