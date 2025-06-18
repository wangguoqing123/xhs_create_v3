-- 积分系统数据库迁移
-- 1. 为 profiles 表添加积分字段
ALTER TABLE profiles ADD COLUMN credits INTEGER DEFAULT 20 NOT NULL;

-- 2. 为现有用户设置初始积分（如果有的话）
UPDATE profiles SET credits = 20 WHERE credits IS NULL;

-- 3. 创建积分交易记录表
CREATE TABLE credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('reward', 'consume', 'refund')),
  amount INTEGER NOT NULL, -- 正数为获得，负数为消耗
  reason TEXT NOT NULL,
  related_task_id UUID REFERENCES batch_tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. 启用 RLS (Row Level Security)
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略 - 用户只能查看自己的积分记录
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert credit transactions" ON credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- 6. 创建索引以提高查询性能
CREATE INDEX credit_transactions_user_id_idx ON credit_transactions(user_id);
CREATE INDEX credit_transactions_created_at_idx ON credit_transactions(created_at);
CREATE INDEX credit_transactions_type_idx ON credit_transactions(transaction_type);
CREATE INDEX profiles_credits_idx ON profiles(credits);

-- 7. 修改用户注册触发器，为新用户赠送积分并记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 创建用户档案
  INSERT INTO public.profiles (id, email, display_name, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    20
  );
  
  -- 创建积分赠送记录
  INSERT INTO public.credit_transactions (user_id, transaction_type, amount, reason)
  VALUES (
    NEW.id,
    'reward',
    20,
    '新用户注册赠送'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 创建积分操作函数 - 扣除积分
CREATE OR REPLACE FUNCTION public.consume_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_task_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- 获取当前积分并锁定行
  SELECT credits INTO current_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  -- 检查积分是否足够
  IF current_credits < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- 扣除积分
  UPDATE profiles
  SET credits = credits - p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- 记录积分消耗
  INSERT INTO credit_transactions (user_id, transaction_type, amount, reason, related_task_id)
  VALUES (p_user_id, 'consume', -p_amount, p_reason, p_task_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 创建积分操作函数 - 返还积分
CREATE OR REPLACE FUNCTION public.refund_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_task_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- 返还积分
  UPDATE profiles
  SET credits = credits + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- 记录积分返还
  INSERT INTO credit_transactions (user_id, transaction_type, amount, reason, related_task_id)
  VALUES (p_user_id, 'refund', p_amount, p_reason, p_task_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 创建查询用户积分的函数
CREATE OR REPLACE FUNCTION public.get_user_credits(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_credits INTEGER;
BEGIN
  SELECT credits INTO user_credits
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(user_credits, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 