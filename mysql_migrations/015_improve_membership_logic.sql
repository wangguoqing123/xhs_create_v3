-- ============================================
-- 改进会员设置逻辑
-- 区分会员等级变更和会员时长变更
-- ============================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+08:00';

SELECT '🔧 开始改进会员设置逻辑...' as status;

-- ============================================
-- 重新创建更智能的会员设置存储过程
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
  
  -- 现有会员信息
  DECLARE existing_level VARCHAR(10) DEFAULT NULL;
  DECLARE existing_duration VARCHAR(10) DEFAULT NULL;
  DECLARE existing_end_date TIMESTAMP DEFAULT NULL;
  DECLARE existing_next_reset TIMESTAMP DEFAULT NULL;
  
  DECLARE level_changed BOOLEAN DEFAULT FALSE;
  DECLARE duration_changed BOOLEAN DEFAULT FALSE;
  
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
  
  -- 获取现有的活跃会员信息
  SELECT membership_level, membership_duration, end_date, next_credits_reset
  INTO existing_level, existing_duration, existing_end_date, existing_next_reset
  FROM memberships 
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;
  
  -- 根据会员等级设置积分数量
  CASE p_membership_level
    WHEN 'lite' THEN SET monthly_credits_amount = 100;
    WHEN 'pro' THEN SET monthly_credits_amount = 250;
    WHEN 'premium' THEN SET monthly_credits_amount = 600;
  END CASE;
  
  -- 判断是否有变更
  SET level_changed = (existing_level IS NULL OR existing_level != p_membership_level);
  SET duration_changed = (existing_duration IS NULL OR existing_duration != p_membership_duration);
  
  -- 设置到期时间和重置时间的逻辑
  IF existing_end_date IS NULL OR duration_changed THEN
    -- 新用户或者时长发生变化，重新计算到期时间
    IF p_membership_duration = 'monthly' THEN
      SET end_date_value = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH);
      SET next_reset_date = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH);
    ELSE
      SET end_date_value = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 YEAR);
      SET next_reset_date = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH);
    END IF;
  ELSE
    -- 只是等级变更，保持原有的到期时间
    SET end_date_value = existing_end_date;
    SET next_reset_date = existing_next_reset;
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
  
  -- 积分处理逻辑
  SET @profiles_exists = (
    SELECT COUNT(*) FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles'
  );
  
  IF @profiles_exists > 0 THEN
    IF existing_level IS NULL THEN
      -- 新会员，直接设置积分
      UPDATE profiles SET credits = monthly_credits_amount WHERE id = p_user_id;
    ELSEIF level_changed AND NOT duration_changed THEN
      -- 只是等级变更，不重置积分，但要确保积分不低于新等级的月度额度
      UPDATE profiles 
      SET credits = GREATEST(credits, monthly_credits_amount) 
      WHERE id = p_user_id;
    ELSE
      -- 时长变更或新用户，重置积分
      UPDATE profiles SET credits = monthly_credits_amount WHERE id = p_user_id;
    END IF;
  END IF;
  
  -- 记录积分交易
  SET @transactions_exists = (
    SELECT COUNT(*) FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'credit_transactions'
  );
  
  IF @transactions_exists > 0 THEN
    IF existing_level IS NULL THEN
      -- 新会员
      INSERT INTO credit_transactions (user_id, transaction_type, amount, reason)
      VALUES (p_user_id, 'reward', monthly_credits_amount, CONCAT(
        '成为', p_membership_level, '会员(', p_membership_duration, ')初始积分，操作者：', p_admin_user
      ));
    ELSEIF level_changed AND NOT duration_changed THEN
      -- 等级变更
      INSERT INTO credit_transactions (user_id, transaction_type, amount, reason)
      VALUES (p_user_id, 'reward', 0, CONCAT(
        '会员等级调整：', IFNULL(existing_level, 'none'), ' → ', p_membership_level, '，操作者：', p_admin_user
      ));
    ELSE
      -- 时长变更
      INSERT INTO credit_transactions (user_id, transaction_type, amount, reason)
      VALUES (p_user_id, 'reward', monthly_credits_amount, CONCAT(
        '会员时长调整，积分重置，操作者：', p_admin_user
      ));
    END IF;
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
      'previous_level', IFNULL(existing_level, 'none'),
      'previous_duration', IFNULL(existing_duration, 'none'),
      'level_changed', level_changed,
      'duration_changed', duration_changed,
      'end_date_reset', duration_changed,
      'credits_granted', CASE WHEN existing_level IS NULL OR duration_changed THEN monthly_credits_amount ELSE 0 END,
      'reason', IFNULL(p_reason, CONCAT('管理员设置', p_membership_level, '会员'))
    ));
  END IF;
  
  COMMIT;
  
  -- 返回操作结果信息
  SELECT 
    CASE 
      WHEN existing_level IS NULL THEN CONCAT('✅ 新用户设置为', p_membership_level, '会员')
      WHEN level_changed AND duration_changed THEN CONCAT('✅ 会员等级和时长都已变更，到期时间重置')
      WHEN level_changed THEN CONCAT('✅ 会员等级已变更，到期时间保持不变')
      WHEN duration_changed THEN CONCAT('✅ 会员时长已变更，到期时间重置')
      ELSE '✅ 会员信息已更新'
    END as operation_result,
    end_date_value as new_end_date,
    monthly_credits_amount as monthly_credits;
    
END //

DELIMITER ;

SELECT '✅ 改进的会员设置逻辑创建完成！' as status;

-- ============================================
-- 说明文档
-- ============================================

/*
改进后的会员设置逻辑说明：

1. **新用户设置会员**：
   - 设置新的到期时间
   - 给予对应等级的初始积分

2. **仅变更会员等级**（时长不变）：
   - 保持原有的到期时间
   - 积分不重置，但确保不低于新等级的月度额度
   - 例如：标准会员→高级会员，到期时间不变

3. **仅变更会员时长**（等级不变）：
   - 重新计算到期时间
   - 重置积分到对应等级的月度额度

4. **同时变更等级和时长**：
   - 重新计算到期时间
   - 重置积分到新等级的月度额度

这样的逻辑更加合理，避免了用户因为等级调整而意外获得或失去会员时长。
*/ 