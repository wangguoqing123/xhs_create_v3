-- ============================================
-- 会员系统数据库表创建脚本
-- ============================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+08:00';

-- ============================================
-- 1. 会员信息表
-- ============================================

CREATE TABLE memberships (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  membership_type ENUM('monthly', 'yearly') NOT NULL COMMENT '会员类型：monthly=月会员，yearly=年会员',
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active' COMMENT '会员状态',
  start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '会员开始时间',
  end_date TIMESTAMP NULL COMMENT '会员到期时间',
  auto_renew BOOLEAN DEFAULT FALSE COMMENT '是否自动续费（预留字段）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_memberships_user_id (user_id),
  INDEX idx_memberships_type (membership_type),
  INDEX idx_memberships_status (status),
  INDEX idx_memberships_end_date (end_date),
  UNIQUE KEY uk_user_membership (user_id, membership_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会员信息表';

-- ============================================
-- 2. 积分包记录表
-- ============================================

CREATE TABLE credit_packages (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  package_type ENUM('purchase', 'gift') DEFAULT 'gift' COMMENT '积分包类型：purchase=购买，gift=管理员赠送',
  credits_amount INTEGER NOT NULL DEFAULT 1000 COMMENT '积分包数量',
  granted_by VARCHAR(50) DEFAULT NULL COMMENT '赠送者（管理员用户名）',
  reason TEXT DEFAULT NULL COMMENT '赠送原因',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_credit_packages_user_id (user_id),
  INDEX idx_credit_packages_type (package_type),
  INDEX idx_credit_packages_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分包记录表';

-- ============================================
-- 3. 年会员积分发放记录表
-- ============================================

CREATE TABLE yearly_member_credits (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  membership_id CHAR(36) NOT NULL,
  credits_amount INTEGER NOT NULL DEFAULT 800 COMMENT '发放的积分数量',
  grant_month VARCHAR(7) NOT NULL COMMENT '发放月份，格式：YYYY-MM',
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_yearly_credits_user_id (user_id),
  INDEX idx_yearly_credits_membership_id (membership_id),
  INDEX idx_yearly_credits_month (grant_month),
  UNIQUE KEY uk_user_membership_month (user_id, membership_id, grant_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='年会员每月积分发放记录表';

-- ============================================
-- 4. 管理员操作日志表
-- ============================================

CREATE TABLE admin_operation_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  admin_user VARCHAR(50) NOT NULL COMMENT '管理员用户名',
  operation_type ENUM('grant_credits', 'set_membership', 'gift_credit_package') NOT NULL COMMENT '操作类型',
  target_user_id CHAR(36) NOT NULL COMMENT '目标用户ID',
  target_user_email VARCHAR(255) NOT NULL COMMENT '目标用户邮箱',
  operation_details JSON DEFAULT ('{}') COMMENT '操作详情',
  ip_address VARCHAR(45) DEFAULT NULL COMMENT '操作IP地址',
  user_agent TEXT DEFAULT NULL COMMENT '用户代理信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_admin_logs_admin (admin_user),
  INDEX idx_admin_logs_type (operation_type),
  INDEX idx_admin_logs_target (target_user_id),
  INDEX idx_admin_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志表';

-- ============================================
-- 5. 添加外键约束（在所有表创建完成后）
-- ============================================

-- 会员信息表外键
ALTER TABLE memberships 
ADD CONSTRAINT fk_memberships_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 积分包记录表外键
ALTER TABLE credit_packages 
ADD CONSTRAINT fk_credit_packages_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 年会员积分发放记录表外键
ALTER TABLE yearly_member_credits 
ADD CONSTRAINT fk_yearly_credits_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE yearly_member_credits 
ADD CONSTRAINT fk_yearly_credits_membership_id 
FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE;

-- 管理员操作日志表外键
ALTER TABLE admin_operation_logs 
ADD CONSTRAINT fk_admin_logs_target_user_id 
FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ============================================
-- 6. 创建存储过程 - 设置用户为月会员
-- ============================================

DELIMITER //

CREATE PROCEDURE SetMonthlyMembership(
  IN p_user_id CHAR(36),
  IN p_admin_user VARCHAR(50),
  IN p_reason TEXT
)
BEGIN
  DECLARE user_email VARCHAR(255);
  DECLARE membership_id CHAR(36) DEFAULT (UUID());
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
  
  -- 取消现有的活跃会员状态
  UPDATE memberships 
  SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id AND status = 'active';
  
  -- 创建新的月会员记录
  INSERT INTO memberships (id, user_id, membership_type, status, start_date, end_date)
  VALUES (membership_id, p_user_id, 'monthly', 'active', CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH));
  
  -- 增加500积分
  UPDATE profiles SET credits = credits + 500 WHERE id = p_user_id;
  
  -- 记录积分交易
  INSERT INTO credit_transactions (user_id, transaction_type, amount, reason)
  VALUES (p_user_id, 'reward', 500, CONCAT('成为月会员奖励，操作者：', p_admin_user));
  
  -- 记录管理员操作日志
  INSERT INTO admin_operation_logs (admin_user, operation_type, target_user_id, target_user_email, operation_details)
  VALUES (p_admin_user, 'set_membership', p_user_id, user_email, JSON_OBJECT(
    'membership_type', 'monthly',
    'credits_granted', 500,
    'reason', IFNULL(p_reason, '管理员设置月会员')
  ));
  
  COMMIT;
END //

DELIMITER ;

-- ============================================
-- 7. 创建存储过程 - 设置用户为年会员
-- ============================================

DELIMITER //

CREATE PROCEDURE SetYearlyMembership(
  IN p_user_id CHAR(36),
  IN p_admin_user VARCHAR(50),
  IN p_reason TEXT
)
BEGIN
  DECLARE user_email VARCHAR(255);
  DECLARE membership_id CHAR(36) DEFAULT (UUID());
  DECLARE current_month VARCHAR(7);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  
  -- 获取用户邮箱和当前月份
  SELECT email INTO user_email FROM users WHERE id = p_user_id;
  SET current_month = DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m');
  
  -- 检查用户是否存在
  IF user_email IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '用户不存在';
  END IF;
  
  -- 取消现有的活跃会员状态
  UPDATE memberships 
  SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id AND status = 'active';
  
  -- 创建新的年会员记录
  INSERT INTO memberships (id, user_id, membership_type, status, start_date, end_date)
  VALUES (membership_id, p_user_id, 'yearly', 'active', CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 YEAR));
  
  -- 增加800积分（首月）
  UPDATE profiles SET credits = credits + 800 WHERE id = p_user_id;
  
  -- 记录积分交易
  INSERT INTO credit_transactions (user_id, transaction_type, amount, reason)
  VALUES (p_user_id, 'reward', 800, CONCAT('成为年会员首月奖励，操作者：', p_admin_user));
  
  -- 记录年会员积分发放记录
  INSERT INTO yearly_member_credits (user_id, membership_id, credits_amount, grant_month)
  VALUES (p_user_id, membership_id, 800, current_month);
  
  -- 记录管理员操作日志
  INSERT INTO admin_operation_logs (admin_user, operation_type, target_user_id, target_user_email, operation_details)
  VALUES (p_admin_user, 'set_membership', p_user_id, user_email, JSON_OBJECT(
    'membership_type', 'yearly',
    'credits_granted', 800,
    'reason', IFNULL(p_reason, '管理员设置年会员')
  ));
  
  COMMIT;
END //

DELIMITER ;

-- ============================================
-- 8. 创建存储过程 - 赠送积分包
-- ============================================

DELIMITER //

CREATE PROCEDURE GrantCreditPackage(
  IN p_user_id CHAR(36),
  IN p_credits_amount INTEGER,
  IN p_admin_user VARCHAR(50),
  IN p_reason TEXT
)
BEGIN
  DECLARE user_email VARCHAR(255);
  DECLARE is_member BOOLEAN DEFAULT FALSE;
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
  
  -- 检查用户是否是会员
  SELECT COUNT(*) > 0 INTO is_member
  FROM memberships 
  WHERE user_id = p_user_id AND status = 'active' AND end_date > CURRENT_TIMESTAMP;
  
  -- 只有会员才能获得积分包
  IF NOT is_member THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '只有会员才能获得积分包';
  END IF;
  
  -- 记录积分包
  INSERT INTO credit_packages (user_id, package_type, credits_amount, granted_by, reason)
  VALUES (p_user_id, 'gift', p_credits_amount, p_admin_user, p_reason);
  
  -- 增加积分
  UPDATE profiles SET credits = credits + p_credits_amount WHERE id = p_user_id;
  
  -- 记录积分交易
  INSERT INTO credit_transactions (user_id, transaction_type, amount, reason)
  VALUES (p_user_id, 'reward', p_credits_amount, CONCAT('管理员赠送积分包，操作者：', p_admin_user));
  
  -- 记录管理员操作日志
  INSERT INTO admin_operation_logs (admin_user, operation_type, target_user_id, target_user_email, operation_details)
  VALUES (p_admin_user, 'gift_credit_package', p_user_id, user_email, JSON_OBJECT(
    'credits_amount', p_credits_amount,
    'reason', IFNULL(p_reason, '管理员赠送积分包')
  ));
  
  COMMIT;
END //

DELIMITER ;

-- ============================================
-- 9. 创建存储过程 - 直接赠送积分
-- ============================================

DELIMITER //

CREATE PROCEDURE GrantCredits(
  IN p_user_id CHAR(36),
  IN p_credits_amount INTEGER,
  IN p_admin_user VARCHAR(50),
  IN p_reason TEXT
)
BEGIN
  DECLARE user_email VARCHAR(255);
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
  
  -- 增加积分
  UPDATE profiles SET credits = credits + p_credits_amount WHERE id = p_user_id;
  
  -- 记录积分交易
  INSERT INTO credit_transactions (user_id, transaction_type, amount, reason)
  VALUES (p_user_id, 'reward', p_credits_amount, CONCAT('管理员直接赠送积分，操作者：', p_admin_user));
  
  -- 记录管理员操作日志
  INSERT INTO admin_operation_logs (admin_user, operation_type, target_user_id, target_user_email, operation_details)
  VALUES (p_admin_user, 'grant_credits', p_user_id, user_email, JSON_OBJECT(
    'credits_amount', p_credits_amount,
    'reason', IFNULL(p_reason, '管理员直接赠送积分')
  ));
  
  COMMIT;
END //

DELIMITER ;

-- ============================================
-- 10. 创建存储过程 - 年会员每月积分发放
-- ============================================

DELIMITER //

CREATE PROCEDURE GrantYearlyMemberMonthlyCredits()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_user_id CHAR(36);
  DECLARE v_membership_id CHAR(36);
  DECLARE current_month VARCHAR(7);
  DECLARE credits_granted INT DEFAULT 0;
  
  DECLARE yearly_members_cursor CURSOR FOR
    SELECT m.user_id, m.id
    FROM memberships m
    WHERE m.membership_type = 'yearly' 
    AND m.status = 'active' 
    AND m.end_date > CURRENT_TIMESTAMP
    AND NOT EXISTS (
      SELECT 1 FROM yearly_member_credits ymc 
      WHERE ymc.user_id = m.user_id 
      AND ymc.membership_id = m.id 
      AND ymc.grant_month = DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m')
    );
    
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  SET current_month = DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m');
  
  OPEN yearly_members_cursor;
  
  read_loop: LOOP
    FETCH yearly_members_cursor INTO v_user_id, v_membership_id;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- 增加800积分
    UPDATE profiles SET credits = credits + 800 WHERE id = v_user_id;
    
    -- 记录积分交易
    INSERT INTO credit_transactions (user_id, transaction_type, amount, reason)
    VALUES (v_user_id, 'reward', 800, CONCAT('年会员每月积分奖励 - ', current_month));
    
    -- 记录年会员积分发放记录
    INSERT INTO yearly_member_credits (user_id, membership_id, credits_amount, grant_month)
    VALUES (v_user_id, v_membership_id, 800, current_month);
    
    SET credits_granted = credits_granted + 1;
  END LOOP;
  
  CLOSE yearly_members_cursor;
  
  SELECT CONCAT('已为 ', credits_granted, ' 位年会员发放每月积分') as result;
END //

DELIMITER ;

-- ============================================
-- 11. 创建视图 - 用户会员状态
-- ============================================

CREATE VIEW user_membership_status AS
SELECT 
  u.id as user_id,
  u.email,
  p.display_name,
  p.credits,
  m.membership_type,
  m.status as membership_status,
  m.start_date as membership_start,
  m.end_date as membership_end,
  CASE 
    WHEN m.status = 'active' AND m.end_date > CURRENT_TIMESTAMP THEN TRUE
    ELSE FALSE
  END as is_active_member,
  CASE 
    WHEN m.membership_type = 'yearly' AND m.status = 'active' AND m.end_date > CURRENT_TIMESTAMP THEN TRUE
    ELSE FALSE
  END as is_yearly_member,
  CASE 
    WHEN m.membership_type = 'monthly' AND m.status = 'active' AND m.end_date > CURRENT_TIMESTAMP THEN TRUE
    ELSE FALSE
  END as is_monthly_member
FROM users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN memberships m ON u.id = m.user_id AND m.status = 'active'
ORDER BY u.created_at DESC; 