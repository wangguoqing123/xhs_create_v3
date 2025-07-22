-- ============================================
-- 分步骤修复迁移脚本
-- 根据检查结果，逐步修复数据库结构
-- ============================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+08:00';

SELECT '🔧 开始分步骤修复迁移...' as status;

-- ============================================
-- 步骤1: 确保备份表存在（如果不存在则创建）
-- ============================================
SELECT '📋 步骤1: 创建备份表（如果需要）' as step;

-- 创建备份表（如果原memberships表存在且备份表不存在）
CREATE TABLE IF NOT EXISTS memberships_backup_safe AS 
SELECT * FROM memberships 
WHERE EXISTS (
  SELECT 1 FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships'
)
LIMIT 0;

-- 如果memberships表存在，插入备份数据
INSERT IGNORE INTO memberships_backup_safe 
SELECT * FROM memberships 
WHERE EXISTS (
  SELECT 1 FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'memberships'
) AND NOT EXISTS (
  SELECT 1 FROM memberships_backup_safe LIMIT 1
);

-- ============================================
-- 步骤2: 安全删除旧的存储过程（如果存在）
-- ============================================
SELECT '🗑️ 步骤2: 清理旧的存储过程' as step;

DROP PROCEDURE IF EXISTS SetMonthlyMembership;
DROP PROCEDURE IF EXISTS SetYearlyMembership;
DROP PROCEDURE IF EXISTS GrantYearlyMemberMonthlyCredits;

-- ============================================
-- 步骤3: 安全删除旧的定时事件
-- ============================================
SELECT '⏰ 步骤3: 清理旧的定时事件' as step;

DROP EVENT IF EXISTS monthly_credits_reset_event;

-- ============================================
-- 步骤4: 处理外键约束
-- ============================================
SELECT '🔗 步骤4: 处理外键约束' as step;

-- 安全删除可能存在的外键约束
SET FOREIGN_KEY_CHECKS = 0;

-- 检查并删除yearly_member_credits表的外键
SELECT CONCAT('ALTER TABLE yearly_member_credits DROP FOREIGN KEY ', CONVERT(CONSTRAINT_NAME USING utf8mb4), ';') as drop_fk_sql
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'yearly_member_credits'
AND CONSTRAINT_NAME LIKE 'fk_%'
AND REFERENCED_TABLE_NAME = 'memberships';

-- 由于无法动态执行SQL，用户需要手动执行上面查询返回的DROP语句

-- ============================================
-- 步骤5: 重建memberships表
-- ============================================
SELECT '🔄 步骤5: 重建memberships表' as step;

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS memberships;

-- 创建新的memberships表
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
-- 步骤6: 重新添加外键约束
-- ============================================
SELECT '🔗 步骤6: 添加外键约束' as step;

-- 检查users表是否存在再添加外键
ALTER TABLE memberships 
ADD CONSTRAINT fk_memberships_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 检查yearly_member_credits表是否存在
SET @table_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'yearly_member_credits'
);

-- 如果yearly_member_credits表存在，重新添加外键
SET @sql = IF(@table_exists > 0,
  'ALTER TABLE yearly_member_credits ADD CONSTRAINT fk_yearly_credits_membership_id FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE',
  'SELECT "yearly_member_credits表不存在，跳过外键添加" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 步骤7: 创建存储过程
-- ============================================
SELECT '🔧 步骤7: 创建新的存储过程' as step;

-- 创建会员设置存储过程
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

-- 创建用户积分重置检查存储过程
DELIMITER //

CREATE PROCEDURE CheckAndResetUserCredits(
  IN p_user_id CHAR(36)
)
BEGIN
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
        SET @profiles_exists = (
          SELECT COUNT(*) FROM information_schema.TABLES 
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles'
        );
        
        IF @profiles_exists > 0 THEN
          UPDATE profiles SET credits = v_monthly_credits WHERE id = p_user_id;
        END IF;
        
        -- 计算下次重置时间
        SET new_next_reset = DATE_ADD(v_next_reset, INTERVAL 1 MONTH);
        
        -- 更新会员表的重置时间
        UPDATE memberships 
        SET last_credits_reset = CURRENT_TIMESTAMP,
            next_credits_reset = new_next_reset
        WHERE id = v_membership_id;
        
        -- 记录积分交易
        SET @transactions_exists = (
          SELECT COUNT(*) FROM information_schema.TABLES 
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'credit_transactions'
        );
        
        IF @transactions_exists > 0 THEN
          INSERT INTO credit_transactions (user_id, transaction_type, amount, reason)
          VALUES (p_user_id, 'reset', v_monthly_credits, CONCAT(
            '会员积分重置 - ', v_membership_level, '会员 - ', DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m-%d')
          ));
        END IF;
        
        SELECT CONCAT('✅ 用户积分已重置到 ', v_monthly_credits, ' 积分') as result;
      ELSE
        -- 会员已过期，积分清零
        SET @profiles_exists = (
          SELECT COUNT(*) FROM information_schema.TABLES 
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles'
        );
        
        IF @profiles_exists > 0 THEN
          UPDATE profiles SET credits = 0 WHERE id = p_user_id;
        END IF;
        
        -- 将会员状态设置为过期
        UPDATE memberships 
        SET status = 'expired', 
            last_credits_reset = CURRENT_TIMESTAMP,
            next_credits_reset = NULL
        WHERE id = v_membership_id;
        
        -- 记录积分交易
        SET @transactions_exists = (
          SELECT COUNT(*) FROM information_schema.TABLES 
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'credit_transactions'
        );
        
        IF @transactions_exists > 0 THEN
          INSERT INTO credit_transactions (user_id, transaction_type, amount, reason)
          VALUES (p_user_id, 'reset', 0, '会员过期，积分清零');
        END IF;
        
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

-- 创建批量检查积分重置存储过程
DELIMITER //

CREATE PROCEDURE BatchCheckCreditsReset()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_user_id CHAR(36);
  DECLARE reset_count INT DEFAULT 0;
  
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
    
    CALL CheckAndResetUserCredits(v_user_id);
    SET reset_count = reset_count + 1;
  END LOOP;
  
  CLOSE users_cursor;
  
  SELECT CONCAT('✅ 已检查 ', reset_count, ' 位用户的积分重置') as result;
END //

DELIMITER ;

-- ============================================
-- 步骤8: 重建视图
-- ============================================
SELECT '👁️ 步骤8: 重建用户会员状态视图' as step;

DROP VIEW IF EXISTS user_membership_status;

CREATE VIEW user_membership_status AS
SELECT 
  u.id as user_id,
  u.email,
  COALESCE(p.display_name, '') as display_name,
  COALESCE(p.credits, 0) as credits,
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
  END as is_premium_member
FROM users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN memberships m ON u.id = m.user_id AND m.status = 'active'
WHERE EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users')
ORDER BY u.created_at DESC;

-- ============================================
-- 步骤9: 创建定时事件
-- ============================================
SELECT '⏰ 步骤9: 创建定时事件' as step;

-- 启用事件调度器
SET GLOBAL event_scheduler = ON;

-- 创建每小时积分重置检查事件
CREATE EVENT IF NOT EXISTS hourly_credits_reset_check
ON SCHEDULE EVERY 1 HOUR
DO
  CALL BatchCheckCreditsReset();

-- ============================================
-- 完成修复
-- ============================================
SELECT '✅ 分步骤修复完成！请运行检查脚本验证结果。' as final_status; 