-- ============================================
-- 阿里云RDS MySQL数据库完整迁移脚本
-- 从Supabase PostgreSQL迁移到MySQL
-- ============================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+08:00';

-- ============================================
-- 1. 用户认证表 (替代Supabase auth.users)
-- ============================================

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255) DEFAULT NULL, -- 预留字段，目前使用邮箱验证码
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_users_email (email),
  INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户认证表';

-- ============================================
-- 2. 用户资料表
-- ============================================

CREATE TABLE profiles (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) DEFAULT NULL,
  avatar_url VARCHAR(500) DEFAULT NULL,
  user_cookie TEXT DEFAULT NULL COMMENT '用户Cookie字符串，用于爬虫接口调用',
  task_indices JSON DEFAULT ('[]') COMMENT '任务索引数组',
  credits INTEGER NOT NULL DEFAULT 5 COMMENT '用户积分',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_profiles_email (email),
  INDEX idx_profiles_created_at (created_at),
  INDEX idx_profiles_last_login_at (last_login_at),
  INDEX idx_profiles_credits (credits)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户资料表';

-- ============================================
-- 3. 邮箱验证码表 (替代Supabase OTP)
-- ============================================

CREATE TABLE email_verification_codes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_email_code (email, code),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邮箱验证码表';

-- ============================================
-- 4. 批量任务表
-- ============================================

CREATE TABLE batch_tasks (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  task_name VARCHAR(255) NOT NULL COMMENT '任务名称（关键词+时间）',
  search_keywords VARCHAR(255) DEFAULT NULL COMMENT '搜索关键词',
  config JSON DEFAULT ('{}') COMMENT '批量配置（生成数量、类型等）',
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  error_message TEXT DEFAULT NULL COMMENT '错误信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_batch_tasks_user_id (user_id),
  INDEX idx_batch_tasks_status (status),
  INDEX idx_batch_tasks_created_at (created_at DESC),
  INDEX idx_batch_tasks_user_status_created (user_id, status, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='批量改写任务表';

-- ============================================
-- 5. 任务笔记关联表
-- ============================================

CREATE TABLE task_notes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  task_id CHAR(36) NOT NULL,
  note_id VARCHAR(255) NOT NULL COMMENT '笔记ID',
  note_data JSON DEFAULT ('{}') COMMENT '笔记原始数据',
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  error_message TEXT DEFAULT NULL COMMENT '错误信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (task_id) REFERENCES batch_tasks(id) ON DELETE CASCADE,
  INDEX idx_task_notes_task_id (task_id),
  INDEX idx_task_notes_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务关联的笔记表';

-- ============================================
-- 6. 生成内容表
-- ============================================

CREATE TABLE generated_contents (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  task_note_id CHAR(36) NOT NULL,
  title VARCHAR(500) DEFAULT NULL COMMENT '生成的标题',
  content TEXT DEFAULT NULL COMMENT '生成的内容',
  content_type VARCHAR(50) DEFAULT 'article' COMMENT 'article, video_script',
  generation_config JSON DEFAULT ('{}') COMMENT '生成时的配置',
  status ENUM('generating', 'completed', 'failed') DEFAULT 'generating',
  error_message TEXT DEFAULT NULL COMMENT '错误信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  
  FOREIGN KEY (task_note_id) REFERENCES task_notes(id) ON DELETE CASCADE,
  INDEX idx_generated_contents_task_note_id (task_note_id),
  INDEX idx_generated_contents_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生成的改写内容表';

-- ============================================
-- 7. 积分交易记录表
-- ============================================

CREATE TABLE credit_transactions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  transaction_type ENUM('reward', 'consume', 'refund') NOT NULL,
  amount INTEGER NOT NULL COMMENT '正数为获得，负数为消耗',
  reason TEXT NOT NULL,
  related_task_id CHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (related_task_id) REFERENCES batch_tasks(id) ON DELETE SET NULL,
  INDEX idx_credit_transactions_user_id (user_id),
  INDEX idx_credit_transactions_created_at (created_at),
  INDEX idx_credit_transactions_type (transaction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分交易记录表';

-- ============================================
-- 8. 创建存储过程 - 用户注册
-- ============================================

DELIMITER //

CREATE PROCEDURE CreateUser(
  IN p_email VARCHAR(255),
  IN p_display_name VARCHAR(255)
)
BEGIN
  DECLARE user_id CHAR(36) DEFAULT (UUID());
  DECLARE display_name_final VARCHAR(255);
  
  -- 设置显示名称
  IF p_display_name IS NULL OR p_display_name = '' THEN
    SET display_name_final = SUBSTRING_INDEX(p_email, '@', 1);
  ELSE
    SET display_name_final = p_display_name;
  END IF;
  
  -- 创建用户
  INSERT INTO users (id, email, email_verified) 
  VALUES (user_id, p_email, TRUE);
  
  -- 创建用户资料
  INSERT INTO profiles (id, email, display_name, credits) 
  VALUES (user_id, p_email, display_name_final, 5);
  
  -- 记录注册赠送积分
  INSERT INTO credit_transactions (user_id, transaction_type, amount, reason)
  VALUES (user_id, 'reward', 5, '新用户注册赠送');
  
  -- 返回用户ID
  SELECT user_id as id, p_email as email, display_name_final as display_name;
END //

DELIMITER ;

-- ============================================
-- 9. 创建存储过程 - 生成验证码
-- ============================================

DELIMITER //

CREATE PROCEDURE GenerateVerificationCode(
  IN p_email VARCHAR(255)
)
BEGIN
  DECLARE verification_code VARCHAR(6);
  
  -- 生成6位随机数字验证码
  SET verification_code = LPAD(FLOOR(RAND() * 1000000), 6, '0');
  
  -- 删除该邮箱的旧验证码
  DELETE FROM email_verification_codes WHERE email = p_email;
  
  -- 插入新验证码（5分钟有效期）
  INSERT INTO email_verification_codes (email, code, expires_at)
  VALUES (p_email, verification_code, DATE_ADD(NOW(), INTERVAL 5 MINUTE));
  
  -- 返回验证码（实际应用中应该发送邮件）
  SELECT verification_code as code, p_email as email;
END //

DELIMITER ;

-- ============================================
-- 10. 创建存储过程 - 验证邮箱验证码
-- ============================================

DELIMITER //

CREATE PROCEDURE VerifyEmailCode(
  IN p_email VARCHAR(255),
  IN p_code VARCHAR(6)
)
BEGIN
  DECLARE code_valid BOOLEAN DEFAULT FALSE;
  DECLARE user_exists BOOLEAN DEFAULT FALSE;
  DECLARE user_id CHAR(36);
  
  -- 检查验证码是否有效
  SELECT COUNT(*) > 0 INTO code_valid
  FROM email_verification_codes 
  WHERE email = p_email 
    AND code = p_code 
    AND expires_at > NOW() 
    AND used = FALSE;
  
  IF code_valid THEN
    -- 标记验证码为已使用
    UPDATE email_verification_codes 
    SET used = TRUE 
    WHERE email = p_email AND code = p_code;
    
    -- 检查用户是否存在
    SELECT COUNT(*) > 0, IFNULL(MAX(id), '') INTO user_exists, user_id
    FROM users WHERE email = p_email;
    
    IF user_exists THEN
      -- 更新最后登录时间
      UPDATE users SET last_login_at = NOW() WHERE id = user_id;
      UPDATE profiles SET last_login_at = NOW() WHERE id = user_id;
      
      -- 返回用户信息
      SELECT u.id, u.email, p.display_name, 'login' as action
      FROM users u
      JOIN profiles p ON u.id = p.id
      WHERE u.id = user_id;
    ELSE
      -- 创建新用户
      CALL CreateUser(p_email, NULL);
    END IF;
  ELSE
    -- 验证码无效
    SELECT NULL as id, NULL as email, NULL as display_name, 'invalid_code' as action;
  END IF;
END //

DELIMITER ;

-- ============================================
-- 11. 创建存储过程 - 积分操作
-- ============================================

DELIMITER //

-- 扣除积分
CREATE PROCEDURE ConsumeCredits(
  IN p_user_id CHAR(36),
  IN p_amount INTEGER,
  IN p_reason TEXT,
  IN p_task_id CHAR(36)
)
BEGIN
  DECLARE current_credits INTEGER DEFAULT 0;
  DECLARE sufficient_credits BOOLEAN DEFAULT FALSE;
  
  -- 获取当前积分
  SELECT credits INTO current_credits 
  FROM profiles 
  WHERE id = p_user_id;
  
  -- 检查积分是否足够
  SET sufficient_credits = (current_credits >= p_amount);
  
  IF sufficient_credits THEN
    -- 扣除积分
    UPDATE profiles 
    SET credits = credits - p_amount 
    WHERE id = p_user_id;
    
    -- 记录积分消耗
    INSERT INTO credit_transactions (user_id, transaction_type, amount, reason, related_task_id)
    VALUES (p_user_id, 'consume', -p_amount, p_reason, p_task_id);
    
    SELECT TRUE as success, (current_credits - p_amount) as remaining_credits;
  ELSE
    SELECT FALSE as success, current_credits as remaining_credits;
  END IF;
END //

-- 返还积分
CREATE PROCEDURE RefundCredits(
  IN p_user_id CHAR(36),
  IN p_amount INTEGER,
  IN p_reason TEXT,
  IN p_task_id CHAR(36)
)
BEGIN
  -- 返还积分
  UPDATE profiles 
  SET credits = credits + p_amount 
  WHERE id = p_user_id;
  
  -- 记录积分返还
  INSERT INTO credit_transactions (user_id, transaction_type, amount, reason, related_task_id)
  VALUES (p_user_id, 'refund', p_amount, p_reason, p_task_id);
  
  -- 返回更新后的积分
  SELECT credits as current_credits 
  FROM profiles 
  WHERE id = p_user_id;
END //

DELIMITER ;

-- ============================================
-- 12. 清理过期验证码的事件调度器
-- ============================================

-- 创建清理过期验证码的存储过程
DELIMITER //

CREATE PROCEDURE CleanExpiredCodes()
BEGIN
  DELETE FROM email_verification_codes 
  WHERE expires_at < NOW() OR used = TRUE;
END //

DELIMITER ;

-- 创建定时任务（每小时清理一次过期验证码）
-- 注意：需要在MySQL中启用事件调度器: SET GLOBAL event_scheduler = ON;
CREATE EVENT IF NOT EXISTS clean_expired_codes
ON SCHEDULE EVERY 1 HOUR
DO CALL CleanExpiredCodes();

-- ============================================
-- 13. 插入初始数据（可选）
-- ============================================

-- 如果需要测试数据，可以取消注释以下代码
/*
-- 创建测试用户
CALL CreateUser('test@example.com', '测试用户');

-- 生成测试验证码
CALL GenerateVerificationCode('test@example.com');
*/

-- ============================================
-- 脚本执行完成
-- ============================================

SELECT 'MySQL数据库迁移脚本执行完成！' as message;
SELECT '请记得启用事件调度器: SET GLOBAL event_scheduler = ON;' as reminder; 