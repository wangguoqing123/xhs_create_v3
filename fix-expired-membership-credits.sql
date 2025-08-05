-- ============================================
-- 修复会员到期积分清零问题
-- ============================================

-- 1. 检查当前系统状态
SELECT '=== 1. 检查定时事件状态 ===' as step;
SELECT 
  EVENT_NAME,
  STATUS,
  INTERVAL_VALUE,
  INTERVAL_FIELD,
  LAST_EXECUTED,
  CASE 
    WHEN STATUS = 'ENABLED' THEN '✅ 已启用'
    ELSE '❌ 未启用'
  END as event_status
FROM information_schema.EVENTS 
WHERE EVENT_SCHEMA = DATABASE() 
AND EVENT_NAME = 'hourly_credits_reset_check';

-- 2. 检查存储过程
SELECT '=== 2. 检查存储过程 ===' as step;
SELECT 
  ROUTINE_NAME,
  ROUTINE_TYPE,
  CREATED
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
AND ROUTINE_NAME IN ('CheckAndResetUserCredits', 'BatchCheckCreditsReset');

-- 3. 查找所有过期但积分未清零的会员
SELECT '=== 3. 查找过期但积分未清零的会员 ===' as step;
SELECT 
  u.email,
  p.credits,
  m.membership_level,
  m.membership_duration,
  m.status,
  m.end_date,
  CASE 
    WHEN m.end_date < CURRENT_TIMESTAMP THEN '过期'
    ELSE '有效'
  END as membership_real_status
FROM users u
JOIN profiles p ON u.id = p.id
JOIN memberships m ON u.id = m.user_id
WHERE m.status = 'active' 
AND m.end_date < CURRENT_TIMESTAMP 
AND p.credits > 0
ORDER BY m.end_date DESC;

-- 4. 手动处理过期会员
SELECT '=== 4. 开始手动处理过期会员 ===' as step;

-- 获取需要处理的过期会员数量
SET @expired_count = (
  SELECT COUNT(*)
  FROM memberships m
  JOIN profiles p ON m.user_id = p.id
  WHERE m.status = 'active' 
  AND m.end_date < CURRENT_TIMESTAMP 
  AND p.credits > 0
);

SELECT CONCAT('找到 ', @expired_count, ' 位需要处理的过期会员') as info;

-- 5. 记录积分清零的交易记录（在清零之前记录）
INSERT INTO credit_transactions (user_id, transaction_type, amount, reason, created_at)
SELECT 
  m.user_id,
  'consume',
  -p.credits,
  '会员过期，积分清零（批量处理）',
  CURRENT_TIMESTAMP
FROM memberships m
JOIN profiles p ON m.user_id = p.id
WHERE m.status = 'active' 
AND m.end_date < CURRENT_TIMESTAMP 
AND p.credits > 0;

-- 6. 批量处理过期会员 - 清零积分
UPDATE profiles p
JOIN memberships m ON p.id = m.user_id
SET p.credits = 0
WHERE m.status = 'active' 
AND m.end_date < CURRENT_TIMESTAMP 
AND p.credits > 0;

-- 7. 更新会员状态为过期
UPDATE memberships 
SET status = 'expired',
    last_credits_reset = CURRENT_TIMESTAMP,
    next_credits_reset = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'active' 
AND end_date < CURRENT_TIMESTAMP;

-- 8. 验证处理结果
SELECT '=== 5. 处理结果验证 ===' as step;
SELECT 
  COUNT(*) as processed_users,
  '位用户的积分已清零' as description
FROM credit_transactions 
WHERE reason = '会员过期，积分清零（批量处理）'
AND created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 MINUTE);

-- 9. 检查是否还有遗漏的过期会员
SELECT '=== 6. 检查是否还有遗漏 ===' as step;
SELECT 
  COUNT(*) as remaining_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ 所有过期会员已处理完毕'
    ELSE '⚠️ 仍有过期会员需要处理'
  END as status
FROM users u
JOIN profiles p ON u.id = p.id
JOIN memberships m ON u.id = m.user_id
WHERE m.status = 'active' 
AND m.end_date < CURRENT_TIMESTAMP 
AND p.credits > 0;

-- 10. 启用事件调度器和定时任务
SELECT '=== 7. 确保定时任务正常运行 ===' as step;

-- 启用事件调度器
SET GLOBAL event_scheduler = ON;

-- 删除可能存在的旧事件
DROP EVENT IF EXISTS hourly_credits_reset_check;

-- 重新创建定时事件
CREATE EVENT hourly_credits_reset_check
ON SCHEDULE EVERY 1 HOUR
DO 
  CALL BatchCheckCreditsReset();

SELECT '✅ 定时任务已重新创建并启用' as result;

SELECT '=== 8. 完成 ===' as step;
SELECT 
  '✅ 会员到期积分清零修复完成！' as status,
  '定时任务每小时自动检查一次' as note;