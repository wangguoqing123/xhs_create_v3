-- ============================================
-- 简化数据库状态检查
-- ============================================

-- 1. 检查memberships表是否存在新字段
SELECT 
  '1. memberships表检查:' as item,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' 
          AND COLUMN_NAME = 'membership_level') > 0 
    THEN '✅ 新表结构存在'
    ELSE '❌ 需要更新表结构'
  END as status;

-- 2. 检查存储过程
SELECT 
  '2. 存储过程检查:' as item,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.ROUTINES 
          WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_NAME = 'SetMembership') > 0 
    THEN '✅ 新存储过程存在'
    ELSE '❌ 需要创建存储过程'
  END as status;

-- 3. 检查视图
SELECT 
  '3. 视图检查:' as item,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.VIEWS 
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_membership_status') > 0 
    THEN '✅ 视图存在'
    ELSE '❌ 需要创建视图'
  END as status;

-- 4. 检查定时事件
SELECT 
  '4. 定时事件检查:' as item,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.EVENTS 
          WHERE EVENT_SCHEMA = DATABASE() AND EVENT_NAME = 'hourly_credits_reset_check') > 0 
    THEN '✅ 定时事件存在'
    ELSE '❌ 需要创建定时事件'
  END as status;

-- 5. 总结
SELECT 
  '5. 总结建议:' as item,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships' 
      AND COLUMN_NAME IN ('membership_level', 'membership_duration', 'monthly_credits')
    ) = 3
    AND (
      SELECT COUNT(*) FROM information_schema.ROUTINES 
      WHERE ROUTINE_SCHEMA = DATABASE() 
      AND ROUTINE_NAME IN ('SetMembership', 'CheckAndResetUserCredits')
    ) = 2
    THEN '🎉 数据库结构完整，无需修复'
    ELSE '⚠️ 需要执行修复脚本 011_fix_migration_step_by_step.sql'
  END as recommendation; 