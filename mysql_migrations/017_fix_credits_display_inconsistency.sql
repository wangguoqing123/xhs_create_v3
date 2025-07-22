-- ============================================
-- 修复积分显示不一致问题
-- 确保admin后台和导航栏积分显示一致
-- ============================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+08:00';

SELECT '🔧 开始修复积分显示不一致问题...' as status;

-- ============================================
-- 1. 诊断问题：检查数据不一致的情况
-- ============================================

SELECT '🔍 检查积分显示不一致的用户：' as status;

-- 查找admin后台显示的积分和实际profiles表积分不一致的用户
SELECT 
  u.id as user_id,
  u.email,
  p.credits as profiles_credits,
  ums.credits as view_credits,
  (p.credits - ums.credits) as difference,
  CASE 
    WHEN p.credits != ums.credits THEN '❌ 不一致'
    ELSE '✅ 一致'
  END as status
FROM users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_membership_status ums ON u.id = ums.user_id
WHERE p.credits IS NOT NULL 
AND ums.credits IS NOT NULL
AND p.credits != ums.credits
ORDER BY ABS(p.credits - ums.credits) DESC
LIMIT 10;

-- ============================================
-- 2. 检查user_membership_status视图的定义
-- ============================================

SELECT '📋 当前user_membership_status视图定义：' as status;

SHOW CREATE VIEW user_membership_status;

-- ============================================
-- 3. 重建user_membership_status视图，确保积分数据正确
-- ============================================

SELECT '🔄 重建user_membership_status视图...' as status;

DROP VIEW IF EXISTS user_membership_status;

CREATE VIEW user_membership_status AS
SELECT 
  u.id as user_id,
  u.email,
  COALESCE(p.display_name, '') as display_name,
  COALESCE(p.credits, 0) as credits,  -- 确保从profiles表获取最新积分
  CONCAT(COALESCE(m.membership_level, ''), '_', COALESCE(m.membership_duration, '')) as membership_type,
  m.membership_level,
  m.membership_duration,
  m.status as membership_status,
  m.start_date as membership_start,
  m.end_date as membership_end,
  m.monthly_credits,
  m.last_credits_reset,
  m.next_credits_reset,
  CASE 
    WHEN m.status = 'active' AND m.end_date > CURRENT_TIMESTAMP THEN TRUE
    ELSE FALSE
  END as is_active_member,
  CASE 
    WHEN m.membership_level = 'lite' AND m.status = 'active' AND m.end_date > CURRENT_TIMESTAMP THEN TRUE
    ELSE FALSE
  END as is_lite_member,
  CASE 
    WHEN m.membership_level = 'pro' AND m.status = 'active' AND m.end_date > CURRENT_TIMESTAMP THEN TRUE
    ELSE FALSE
  END as is_pro_member,
  CASE 
    WHEN m.membership_level = 'premium' AND m.status = 'active' AND m.end_date > CURRENT_TIMESTAMP THEN TRUE
    ELSE FALSE
  END as is_premium_member,
  u.created_at  -- 添加用户创建时间以便排序
FROM users u
LEFT JOIN profiles p ON u.id = p.id  -- 确保正确关联profiles表
LEFT JOIN memberships m ON u.id = m.user_id AND m.status = 'active'
ORDER BY u.created_at DESC;

-- ============================================
-- 4. 验证修复结果
-- ============================================

SELECT '✅ 验证修复结果：' as status;

-- 再次检查是否还有不一致的数据
SELECT 
  COUNT(*) as inconsistent_users,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ 所有用户积分显示已一致'
    ELSE CONCAT('⚠️ 仍有 ', COUNT(*), ' 个用户积分显示不一致')
  END as result
FROM (
  SELECT 
    u.id
  FROM users u
  LEFT JOIN profiles p ON u.id = p.id
  LEFT JOIN user_membership_status ums ON u.id = ums.user_id
  WHERE p.credits IS NOT NULL 
  AND ums.credits IS NOT NULL
  AND p.credits != ums.credits
) as inconsistent;

-- ============================================
-- 5. 显示修复后的数据样本
-- ============================================

SELECT '📊 修复后的数据样本（前5个用户）：' as status;

SELECT 
  user_id,
  email,
  credits,
  membership_level,
  membership_duration,
  is_active_member
FROM user_membership_status
WHERE credits > 0  -- 只显示有积分的用户
ORDER BY credits DESC
LIMIT 5;

-- ============================================
-- 6. 创建积分同步检查函数（可选）
-- ============================================

SELECT '🔧 创建积分同步检查函数...' as status;

-- 删除可能存在的旧存储过程
DROP PROCEDURE IF EXISTS CheckCreditsSync;

DELIMITER //

-- 创建检查积分同步的存储过程
CREATE PROCEDURE CheckCreditsSync()
BEGIN
  DECLARE inconsistent_count INT DEFAULT 0;
  
  -- 统计不一致的用户数量
  SELECT COUNT(*) INTO inconsistent_count
  FROM users u
  LEFT JOIN profiles p ON u.id = p.id
  LEFT JOIN user_membership_status ums ON u.id = ums.user_id
  WHERE p.credits IS NOT NULL 
  AND ums.credits IS NOT NULL
  AND p.credits != ums.credits;
  
  IF inconsistent_count > 0 THEN
    SELECT CONCAT('⚠️ 发现 ', inconsistent_count, ' 个用户积分显示不一致，需要检查') as result;
    
    -- 显示不一致的用户详情
    SELECT 
      u.id as user_id,
      u.email,
      p.credits as actual_credits,
      ums.credits as view_credits,
      (p.credits - ums.credits) as difference
    FROM users u
    LEFT JOIN profiles p ON u.id = p.id
    LEFT JOIN user_membership_status ums ON u.id = ums.user_id
    WHERE p.credits IS NOT NULL 
    AND ums.credits IS NOT NULL
    AND p.credits != ums.credits
    ORDER BY ABS(p.credits - ums.credits) DESC;
  ELSE
    SELECT '✅ 所有用户积分显示一致' as result;
  END IF;
END //

DELIMITER ;

-- ============================================
-- 7. 最终状态检查
-- ============================================

SELECT '🎯 最终状态检查：' as status;

-- 调用检查函数（检查存储过程是否存在）
SET @procedure_exists = (
  SELECT COUNT(*) 
  FROM information_schema.ROUTINES 
  WHERE ROUTINE_SCHEMA = DATABASE() 
  AND ROUTINE_NAME = 'CheckCreditsSync'
);

-- 如果存储过程存在，则调用它
SET @sql = IF(@procedure_exists > 0,
  "CALL CheckCreditsSync()",
  "SELECT '⚠️ CheckCreditsSync存储过程不存在，跳过检查' as message"
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 完成修复
-- ============================================

SELECT '✅ 积分显示不一致问题修复完成！' as status;

SELECT 
  '修复说明' as info,
  '重建了user_membership_status视图，确保admin后台和导航栏都从profiles表获取积分数据' as description;

SELECT 
  '使用建议' as info,
  '可以定期运行 CALL CheckCreditsSync(); 来检查积分显示是否同步' as description; 