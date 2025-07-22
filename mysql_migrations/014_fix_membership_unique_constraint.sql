-- ============================================
-- 修复会员唯一键约束问题
-- 解决重复键冲突的问题
-- ============================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+08:00';

SELECT '🔧 开始修复会员唯一键约束问题...' as status;

-- ============================================
-- 1. 删除有问题的唯一键约束
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
-- 2. 添加新的更合理的唯一键约束
-- ============================================

-- 只允许每个用户有一个活跃的会员记录
ALTER TABLE memberships 
ADD CONSTRAINT uk_user_active_membership 
UNIQUE KEY (user_id) USING BTREE;

-- 为了支持这个约束，我们需要在插入新记录前先删除旧的活跃记录
-- 而不是将其状态改为cancelled

-- ============================================
-- 3. 重新创建存储过程
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
  
  -- 删除用户现有的所有会员记录（包括active、cancelled、expired）
  -- 这样可以避免唯一键冲突，同时保持数据的一致性
  DELETE FROM memberships WHERE user_id = p_user_id;
  
  -- 创建新的会员记录
  INSERT INTO memberships (
    id, user_id, membership_level, membership_duration, status, 
    start_date, end_date, monthly_credits, last_credits_reset, next_credits_reset
  ) VALUES (
    membership_id, p_user_id, p_membership_level, p_membership_duration, 'active',
    CURRENT_TIMESTAMP, end_date_value, monthly_credits_amount, CURRENT_TIMESTAMP, next_reset_date
  );
  
  -- 初始积分发放（检查profiles表是否存在）
  SET @profiles_exists = (
    SELECT COUNT(*) FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles'
  );
  
  IF @profiles_exists > 0 THEN
    UPDATE profiles SET credits = monthly_credits_amount WHERE id = p_user_id;
  END IF;
  
  -- 记录积分交易（检查credit_transactions表是否存在）
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
  
  -- 记录管理员操作日志（检查admin_operation_logs表是否存在）
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
-- 4. 更新取消会员的逻辑
-- ============================================

-- 由于我们改变了唯一键约束，取消会员时直接删除记录即可
-- 这样更简洁，也避免了约束问题

-- 但为了保持审计日志，我们可以选择保留cancelled状态的记录
-- 在这种情况下，我们需要修改约束

-- 让我们采用一个更好的解决方案：只对active状态的记录应用唯一约束

-- ============================================
-- 5. 重新调整约束策略
-- ============================================

-- 删除之前添加的约束
ALTER TABLE memberships DROP INDEX uk_user_active_membership;

-- 添加更精确的约束：只允许每个用户有一个active状态的会员记录
-- 使用条件索引（MySQL 8.0+支持），如果不支持则使用触发器

-- 检查MySQL版本
SET @mysql_version = (SELECT VERSION());

-- 由于条件索引在MySQL中支持有限，我们使用触发器来确保约束

-- ============================================
-- 6. 创建触发器确保唯一性
-- ============================================

DROP TRIGGER IF EXISTS check_active_membership_before_insert;
DROP TRIGGER IF EXISTS check_active_membership_before_update;

DELIMITER //

-- 插入前检查
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

-- 更新前检查
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
-- 7. 修改存储过程使用更新而非删除
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
  
  -- 初始积分发放（检查profiles表是否存在）
  SET @profiles_exists = (
    SELECT COUNT(*) FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles'
  );
  
  IF @profiles_exists > 0 THEN
    UPDATE profiles SET credits = monthly_credits_amount WHERE id = p_user_id;
  END IF;
  
  -- 记录积分交易（检查credit_transactions表是否存在）
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
  
  -- 记录管理员操作日志（检查admin_operation_logs表是否存在）
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

SELECT '✅ 会员唯一键约束问题修复完成！' as status; 