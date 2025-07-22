-- ============================================
-- 会员类型更新迁移脚本
-- 支持会员等级(lite/pro/premium) + 时长(monthly/yearly)
-- 积分按用户会员开通日期重置机制
-- ============================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+08:00';

-- ============================================
-- 1. 备份现有会员数据
-- ============================================
CREATE TABLE memberships_backup AS SELECT * FROM memberships;

-- ============================================
-- 2. 删除外键约束（临时）
-- ============================================
ALTER TABLE yearly_member_credits DROP FOREIGN KEY fk_yearly_credits_membership_id;

-- ============================================
-- 3. 删除相关存储过程
-- ============================================
DROP PROCEDURE IF EXISTS SetMonthlyMembership;
DROP PROCEDURE IF EXISTS SetYearlyMembership;
DROP PROCEDURE IF EXISTS GrantYearlyMemberMonthlyCredits;
DROP PROCEDURE IF EXISTS SetLiteMembership;
DROP PROCEDURE IF EXISTS SetProMembership;
DROP PROCEDURE IF EXISTS SetPremiumMembership;

-- ============================================
-- 4. 删除旧的会员表并重新创建
-- ============================================
DROP TABLE IF EXISTS memberships;

CREATE TABLE memberships (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  membership_level ENUM('lite', 'pro', 'premium') NOT NULL COMMENT '会员等级：lite=入门会员，pro=标准会员，premium=高级会员',
  membership_duration ENUM('monthly', 'yearly') NOT NULL COMMENT '会员时长：monthly=月会员，yearly=年会员',
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active' COMMENT '会员状态',
  start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '会员开始时间',
  end_date TIMESTAMP NULL COMMENT '会员到期时间',
  monthly_credits INTEGER NOT NULL DEFAULT 0 COMMENT '每月可获得的积分数量',
  last_credits_reset TIMESTAMP NULL COMMENT '上次积分重置时间',
  next_credits_reset TIMESTAMP NULL COMMENT '下次积分重置时间',
  auto_renew BOOLEAN DEFAULT FALSE COMMENT '是否自动续费（预留字段）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_memberships_user_id (user_id),
  INDEX idx_memberships_level (membership_level),
  INDEX idx_memberships_duration (membership_duration),
  INDEX idx_memberships_status (status),
  INDEX idx_memberships_end_date (end_date),
  INDEX idx_memberships_next_reset (next_credits_reset),
  UNIQUE KEY uk_user_active_membership (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会员信息表';

-- ============================================
-- 5. 重新添加外键约束
-- ============================================
ALTER TABLE memberships 
ADD CONSTRAINT fk_memberships_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE yearly_member_credits 
ADD CONSTRAINT fk_yearly_credits_membership_id 
FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE;

-- ============================================
-- 6. 创建会员设置存储过程 - 通用版本
-- ============================================
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
    SET next_reset_date = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH); -- 年会员也是每月重置
  END IF;
  
  -- 取消现有的活跃会员状态
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
  UPDATE profiles SET credits = monthly_credits_amount WHERE id = p_user_id;
  
  -- 记录积分交易
  INSERT INTO credit_transactions (user_id, transaction_type, amount, reason)
  VALUES (p_user_id, 'reward', monthly_credits_amount, CONCAT(
    '成为', p_membership_level, '会员(', p_membership_duration, ')初始积分，操作者：', p_admin_user
  ));
  
  -- 记录管理员操作日志
  INSERT INTO admin_operation_logs (admin_user, operation_type, target_user_id, target_user_email, operation_details)
  VALUES (p_admin_user, 'set_membership', p_user_id, user_email, JSON_OBJECT(
    'membership_level', p_membership_level,
    'membership_duration', p_membership_duration,
    'credits_granted', monthly_credits_amount,
    'reason', IFNULL(p_reason, CONCAT('管理员设置', p_membership_level, '会员'))
  ));
  
  COMMIT;
END //

DELIMITER ;

-- ============================================
-- 7. 创建用户积分重置检查存储过程
-- ============================================
DELIMITER //

CREATE PROCEDURE CheckAndResetUserCredits(
  IN p_user_id CHAR(36)
)
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_membership_id CHAR(36);
  DECLARE v_monthly_credits INTEGER;
  DECLARE v_membership_level VARCHAR(20);
  DECLARE v_next_reset TIMESTAMP;
  DECLARE v_end_date TIMESTAMP;
  DECLARE v_status VARCHAR(20);
  DECLARE new_next_reset TIMESTAMP;
  
  -- 查找用户的活跃会员信息
  SELECT id, monthly_credits, membership_level, next_credits_reset, end_date, status
  INTO v_membership_id, v_monthly_credits, v_membership_level, v_next_reset, v_end_date, v_status
  FROM memberships 
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;
  
  -- 如果找到活跃会员记录
  IF v_membership_id IS NOT NULL THEN
    -- 检查是否需要重置积分
    IF v_next_reset IS NOT NULL AND CURRENT_TIMESTAMP >= v_next_reset THEN
      -- 检查会员是否还有效
      IF v_end_date > CURRENT_TIMESTAMP THEN
        -- 会员还有效，重置积分到会员额度
        UPDATE profiles SET credits = v_monthly_credits WHERE id = p_user_id;
        
        -- 计算下次重置时间（从当前重置时间开始的下一个月）
        SET new_next_reset = DATE_ADD(v_next_reset, INTERVAL 1 MONTH);
        
        -- 更新会员表的重置时间
        UPDATE memberships 
        SET last_credits_reset = CURRENT_TIMESTAMP,
            next_credits_reset = new_next_reset
        WHERE id = v_membership_id;
        
        -- 记录积分交易
        INSERT INTO credit_transactions (user_id, transaction_type, amount, reason)
        VALUES (p_user_id, 'reset', v_monthly_credits, CONCAT(
          '会员积分重置 - ', v_membership_level, '会员 - ', DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m-%d')
        ));
        
        SELECT CONCAT('✅ 用户积分已重置到 ', v_monthly_credits, ' 积分') as result;
      ELSE
        -- 会员已过期，积分清零
        UPDATE profiles SET credits = 0 WHERE id = p_user_id;
        
        -- 将会员状态设置为过期
        UPDATE memberships 
        SET status = 'expired', 
            last_credits_reset = CURRENT_TIMESTAMP,
            next_credits_reset = NULL
        WHERE id = v_membership_id;
        
        -- 记录积分交易
        INSERT INTO credit_transactions (user_id, transaction_type, amount, reason)
        VALUES (p_user_id, 'reset', 0, '会员过期，积分清零');
        
        SELECT '⚠️ 会员已过期，积分已清零' as result;
      END IF;
    ELSE
      SELECT '💡 当前不需要重置积分' as result;
    END IF;
  ELSE
    SELECT '❌ 用户不是活跃会员' as result;
  END IF;
END //

DELIMITER ;

-- ============================================
-- 8. 创建批量检查积分重置存储过程（可选）
-- ============================================
DELIMITER //

CREATE PROCEDURE BatchCheckCreditsReset()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_user_id CHAR(36);
  DECLARE reset_count INT DEFAULT 0;
  
  -- 查找需要重置积分的用户
  DECLARE users_cursor CURSOR FOR
    SELECT user_id
    FROM memberships 
    WHERE status = 'active' 
    AND next_credits_reset IS NOT NULL 
    AND CURRENT_TIMESTAMP >= next_credits_reset;
    
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN users_cursor;
  
  reset_loop: LOOP
    FETCH users_cursor INTO v_user_id;
    IF done THEN
      LEAVE reset_loop;
    END IF;
    
    -- 调用单用户重置检查
    CALL CheckAndResetUserCredits(v_user_id);
    SET reset_count = reset_count + 1;
  END LOOP;
  
  CLOSE users_cursor;
  
  SELECT CONCAT('✅ 已检查 ', reset_count, ' 位用户的积分重置') as result;
END //

DELIMITER ;

-- ============================================
-- 9. 更新用户会员状态视图
-- ============================================
DROP VIEW IF EXISTS user_membership_status;

CREATE VIEW user_membership_status AS
SELECT 
  u.id as user_id,
  u.email,
  p.display_name,
  p.credits,
  CONCAT(m.membership_level, '_', m.membership_duration) as membership_type,
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
  END as is_premium_member
FROM users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN memberships m ON u.id = m.user_id AND m.status = 'active'
ORDER BY u.created_at DESC;

-- ============================================
-- 10. 创建定时任务事件（每小时检查一次）
-- ============================================
-- 启用事件调度器
SET GLOBAL event_scheduler = ON;

-- 删除旧的月度重置事件
DROP EVENT IF EXISTS monthly_credits_reset_event;

-- 创建每小时积分重置检查事件
CREATE EVENT hourly_credits_reset_check
ON SCHEDULE EVERY 1 HOUR
DO
  CALL BatchCheckCreditsReset();

-- ============================================
-- 11. 删除备份表（可选）
-- ============================================
-- DROP TABLE memberships_backup;

-- ============================================
-- 完成提示
-- ============================================
SELECT '✅ 会员体系更新完成！' as message,
       '新等级：lite(入门)/pro(标准)/premium(高级)' as levels,
       '新时长：monthly(月)/yearly(年，8折优惠)' as durations,
       '积分机制：按用户会员开通日期重置，会员过期则清零' as credits_system; 