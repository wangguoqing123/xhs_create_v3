-- ============================================
-- 清理重复会员记录并修复约束问题
-- 解决数据重复导致的唯一键约束失败
-- ============================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+08:00';

SELECT '🔧 开始清理重复会员记录...' as status;

-- ============================================
-- 1. 检查当前重复数据情况
-- ============================================

SELECT '📊 当前重复数据统计：' as status;

SELECT 
  user_id,
  COUNT(*) as record_count,
  GROUP_CONCAT(status) as statuses,
  GROUP_CONCAT(id) as membership_ids
FROM memberships 
GROUP BY user_id 
HAVING COUNT(*) > 1
ORDER BY record_count DESC;

-- ============================================
-- 2. 备份现有数据（可选）
-- ============================================

-- 创建备份表（如果不存在）
CREATE TABLE IF NOT EXISTS memberships_backup_20241201 AS 
SELECT * FROM memberships WHERE 1=0;

-- 备份所有数据
INSERT IGNORE INTO memberships_backup_20241201 
SELECT * FROM memberships;

SELECT '💾 数据已备份到 memberships_backup_20241201' as status;

-- ============================================
-- 3. 清理重复记录的策略
-- ============================================

-- 对于每个用户，我们保留：
-- 1. 最新的active记录（如果有）
-- 2. 如果没有active记录，保留最新的记录
-- 3. 删除其他所有记录

-- 创建临时表存储要保留的记录ID
CREATE TEMPORARY TABLE temp_keep_memberships AS
SELECT 
  user_id,
  id as keep_id
FROM (
  SELECT 
    user_id,
    id,
    status,
    created_at,
    -- 为每个用户的记录排序：active状态优先，然后按创建时间倒序
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY 
        CASE WHEN status = 'active' THEN 0 ELSE 1 END,
        created_at DESC
    ) as rn
  FROM memberships
) ranked
WHERE rn = 1;

SELECT '🎯 要保留的记录统计：' as status;
SELECT COUNT(*) as keep_count FROM temp_keep_memberships;

-- ============================================
-- 4. 删除重复记录
-- ============================================

-- 删除不在保留列表中的记录
DELETE m FROM memberships m
LEFT JOIN temp_keep_memberships t ON m.id = t.keep_id
WHERE t.keep_id IS NULL;

SELECT '🗑️ 重复记录已清理' as status;

-- 显示清理后的统计
SELECT '📊 清理后的数据统计：' as status;

SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_memberships
FROM memberships;

-- ============================================
-- 5. 检查是否还有重复
-- ============================================

SELECT '🔍 检查是否还有重复用户：' as status;

SELECT 
  user_id,
  COUNT(*) as record_count
FROM memberships 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- ============================================
-- 6. 删除现有的错误约束（如果存在）
-- ============================================

-- 检查约束是否存在
SET @constraint_exists = (
  SELECT COUNT(*) 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'memberships' 
  AND CONSTRAINT_NAME = 'uk_user_active_membership'
);

-- 如果约束存在，删除它
SET @sql = IF(@constraint_exists > 0,
  "ALTER TABLE memberships DROP INDEX uk_user_active_membership",
  "SELECT '⚠️ 约束不存在，跳过删除' as message"
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 7. 重新创建正确的约束和触发器
-- ============================================

-- 删除可能存在的触发器
DROP TRIGGER IF EXISTS check_active_membership_before_insert;
DROP TRIGGER IF EXISTS check_active_membership_before_update;

-- 创建触发器确保每个用户只能有一个active记录
DELIMITER //

CREATE TRIGGER check_active_membership_before_insert
BEFORE INSERT ON memberships
FOR EACH ROW
BEGIN
  IF NEW.status = 'active' THEN
    -- 检查是否已有active记录
    IF EXISTS(SELECT 1 FROM memberships WHERE user_id = NEW.user_id AND status = 'active') THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '用户已有活跃的会员记录';
    END IF;
  END IF;
END //

CREATE TRIGGER check_active_membership_before_update
BEFORE UPDATE ON memberships
FOR EACH ROW
BEGIN
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    -- 检查是否已有其他active记录
    IF EXISTS(SELECT 1 FROM memberships WHERE user_id = NEW.user_id AND status = 'active' AND id != NEW.id) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '用户已有活跃的会员记录';
    END IF;
  END IF;
END //

DELIMITER ;

-- ============================================
-- 8. 重新创建存储过程
-- ============================================

DROP PROCEDURE IF EXISTS SetMembership;

DELIMITER //

CREATE PROCEDURE SetMembership(
  IN p_user_id CHAR(36),
  IN p_membership_level ENUM('lite', 'pro', 'premium'),
  IN p_membership_duration ENUM('monthly', 'yearly'),
  IN p_admin_user VARCHAR(50),
  IN p_reason TEXT
)
BEGIN
  DECLARE user_email VARCHAR(255);
  DECLARE membership_id CHAR(36) DEFAULT (UUID());
  DECLARE monthly_credits_amount INTEGER DEFAULT 0;
  DECLARE end_date_value TIMESTAMP;
  DECLARE next_reset_date TIMESTAMP;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  
  -- 获取用户邮箱
  SELECT email INTO user_email FROM users WHERE id = p_user_id;
  
  -- 检查用户是否存在
  IF user_email IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '用户不存在';
  END IF;
  
  -- 根据会员等级设置积分数量
  CASE p_membership_level
    WHEN 'lite' THEN SET monthly_credits_amount = 100;
    WHEN 'pro' THEN SET monthly_credits_amount = 250;
    WHEN 'premium' THEN SET monthly_credits_amount = 600;
  END CASE;
  
  -- 根据会员时长设置到期时间
  IF p_membership_duration = 'monthly' THEN
    SET end_date_value = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH);
    SET next_reset_date = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH);
  ELSE
    SET end_date_value = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 YEAR);
    SET next_reset_date = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH);
  END IF;
  
  -- 将现有的活跃会员状态改为cancelled
  UPDATE memberships 
  SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id AND status = 'active';
  
  -- 创建新的会员记录
  INSERT INTO memberships (
    id, user_id, membership_level, membership_duration, status, 
    start_date, end_date, monthly_credits, last_credits_reset, next_credits_reset
  ) VALUES (
    membership_id, p_user_id, p_membership_level, p_membership_duration, 'active',
    CURRENT_TIMESTAMP, end_date_value, monthly_credits_amount, CURRENT_TIMESTAMP, next_reset_date
  );
  
  -- 初始积分发放
  SET @profiles_exists = (
    SELECT COUNT(*) FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles'
  );
  
  IF @profiles_exists > 0 THEN
    UPDATE profiles SET credits = monthly_credits_amount WHERE id = p_user_id;
  END IF;
  
  -- 记录积分交易
  SET @transactions_exists = (
    SELECT COUNT(*) FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'credit_transactions'
  );
  
  IF @transactions_exists > 0 THEN
    INSERT INTO credit_transactions (user_id, transaction_type, amount, reason)
    VALUES (p_user_id, 'reward', monthly_credits_amount, CONCAT(
      '成为', p_membership_level, '会员(', p_membership_duration, ')初始积分，操作者：', p_admin_user
    ));
  END IF;
  
  -- 记录管理员操作日志
  SET @logs_exists = (
    SELECT COUNT(*) FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_operation_logs'
  );
  
  IF @logs_exists > 0 THEN
    INSERT INTO admin_operation_logs (admin_user, operation_type, target_user_id, target_user_email, operation_details)
    VALUES (p_admin_user, 'set_membership', p_user_id, user_email, JSON_OBJECT(
      'membership_level', p_membership_level,
      'membership_duration', p_membership_duration,
      'credits_granted', monthly_credits_amount,
      'reason', IFNULL(p_reason, CONCAT('管理员设置', p_membership_level, '会员'))
    ));
  END IF;
  
  COMMIT;
END //

DELIMITER ;

-- ============================================
-- 9. 最终验证
-- ============================================

SELECT '✅ 数据清理和约束修复完成！' as status;

-- 显示最终统计
SELECT 
  '最终数据统计' as info,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_memberships,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_memberships,
  SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_memberships
FROM memberships;

-- 检查是否还有重复
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ 没有重复用户记录'
    ELSE CONCAT('⚠️ 仍有 ', COUNT(*), ' 个重复用户')
  END as duplicate_check
FROM (
  SELECT user_id
  FROM memberships 
  GROUP BY user_id 
  HAVING COUNT(*) > 1
) duplicates; 