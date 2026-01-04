-- ============================================
-- 修改新注册用户积分从20改为5的SQL语句
-- 在现有数据库中执行
-- ============================================

-- 1. 修改profiles表的credits字段默认值
ALTER TABLE profiles ALTER COLUMN credits SET DEFAULT 5;

-- 2. 删除旧的CreateUser存储过程
DROP PROCEDURE IF EXISTS CreateUser;

-- 3. 重新创建CreateUser存储过程（积分改为5）
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
  
  -- 创建用户资料（积分改为5）
  INSERT INTO profiles (id, email, display_name, credits) 
  VALUES (user_id, p_email, display_name_final, 5);
  
  -- 记录注册赠送积分（积分改为5）
  INSERT INTO credit_transactions (user_id, transaction_type, amount, reason)
  VALUES (user_id, 'reward', 5, '新用户注册赠送');
  
  -- 返回用户ID
  SELECT user_id as id, p_email as email, display_name_final as display_name;
END //

DELIMITER ;

-- ============================================
-- 修改完成
-- ============================================
SELECT '新用户注册积分已修改为5积分' as message;