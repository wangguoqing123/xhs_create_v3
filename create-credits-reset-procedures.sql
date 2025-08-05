-- ============================================
-- 创建积分重置相关存储过程
-- ============================================

-- 1. 删除可能存在的旧存储过程
DROP PROCEDURE IF EXISTS CheckAndResetUserCredits;
DROP PROCEDURE IF EXISTS BatchCheckCreditsReset;

-- 2. 创建单用户积分检查和重置存储过程
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
    -- 检查会员是否已过期
    IF v_end_date <= CURRENT_TIMESTAMP THEN
      -- 获取清零前的积分数量
      SET @old_credits = (SELECT credits FROM profiles WHERE id = p_user_id);
      
      -- 记录积分交易（在清零之前记录）
      IF @old_credits > 0 THEN
        INSERT INTO credit_transactions (user_id, transaction_type, amount, reason, created_at)
        VALUES (p_user_id, 'consume', -@old_credits, '会员过期，积分清零', CURRENT_TIMESTAMP);
      END IF;
      
      -- 会员已过期，积分清零
      UPDATE profiles SET credits = 0 WHERE id = p_user_id;
      
      -- 将会员状态设置为过期
      UPDATE memberships 
      SET status = 'expired', 
          last_credits_reset = CURRENT_TIMESTAMP,
          next_credits_reset = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = v_membership_id;
      
      SELECT '⚠️ 会员已过期，积分已清零' as result;
      
    -- 检查是否需要重置积分（会员有效但需要月度重置）
    ELSEIF v_next_reset IS NOT NULL AND CURRENT_TIMESTAMP >= v_next_reset THEN
      -- 会员还有效，重置积分到会员额度
      UPDATE profiles SET credits = v_monthly_credits WHERE id = p_user_id;
      
      -- 计算下次重置时间
      SET new_next_reset = DATE_ADD(v_next_reset, INTERVAL 1 MONTH);
      
      -- 更新会员表的重置时间
      UPDATE memberships 
      SET last_credits_reset = CURRENT_TIMESTAMP,
          next_credits_reset = new_next_reset,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = v_membership_id;
      
      -- 记录积分交易
      INSERT INTO credit_transactions (user_id, transaction_type, amount, reason, created_at)
      VALUES (p_user_id, 'reward', v_monthly_credits, CONCAT(
        '会员积分重置 - ', v_membership_level, '会员 - ', DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m-%d')
      ), CURRENT_TIMESTAMP);
      
      SELECT CONCAT('✅ 用户积分已重置到 ', v_monthly_credits, ' 积分') as result;
    ELSE
      SELECT '💡 当前不需要重置积分' as result;
    END IF;
  ELSE
    SELECT '❌ 用户不是活跃会员' as result;
  END IF;
END //

DELIMITER ;

-- 3. 创建批量检查积分重置存储过程
DELIMITER //

CREATE PROCEDURE BatchCheckCreditsReset()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_user_id CHAR(36);
  DECLARE expired_count INT DEFAULT 0;
  DECLARE reset_count INT DEFAULT 0;
  
  -- 查找需要处理的用户（过期的或需要重置的）
  DECLARE users_cursor CURSOR FOR
    SELECT user_id
    FROM memberships 
    WHERE status = 'active' 
    AND (
      end_date <= CURRENT_TIMESTAMP 
      OR (next_credits_reset IS NOT NULL AND CURRENT_TIMESTAMP >= next_credits_reset)
    );
    
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
  
  -- 统计处理结果
  SELECT 
    reset_count as checked_users,
    (SELECT COUNT(*) FROM memberships WHERE status = 'expired' AND last_credits_reset >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 MINUTE)) as expired_processed,
    CONCAT('✅ 已检查 ', reset_count, ' 位用户的积分重置') as summary;
END //

DELIMITER ;

-- 4. 验证存储过程创建成功
SELECT 
  ROUTINE_NAME,
  ROUTINE_TYPE,
  CREATED
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
AND ROUTINE_NAME IN ('CheckAndResetUserCredits', 'BatchCheckCreditsReset')
ORDER BY ROUTINE_NAME;

SELECT '✅ 积分重置存储过程创建完成！' as status;