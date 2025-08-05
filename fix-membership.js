#!/usr/bin/env node

// 修复会员状态的脚本
const mysql = require('mysql2/promise');

async function fixMembership() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4'
  });

  try {
    const userEmail = '544520279@qq.com';
    
    // 1. 获取用户ID
    const [users] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [userEmail]
    );
    
    if (users.length === 0) {
      console.log('❌ 用户不存在');
      return;
    }
    
    const userId = users[0].id;
    console.log('✅ 找到用户:', userId);
    
    // 2. 开始事务
    await connection.beginTransaction();
    
    // 3. 取消现有会员
    await connection.execute(
      'UPDATE memberships SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND status = "active"',
      [userId]
    );
    
    // 4. 创建新会员记录
    const membershipId = crypto.randomUUID();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    await connection.execute(
      `INSERT INTO memberships (
        id, user_id, membership_level, membership_duration, status, 
        start_date, end_date, monthly_credits, last_credits_reset, next_credits_reset
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP, ?)`,
      [membershipId, userId, 'pro', 'monthly', 'active', endDate, 250, endDate]
    );
    
    // 5. 更新积分
    await connection.execute(
      'UPDATE profiles SET credits = 250 WHERE id = ?',
      [userId]
    );
    
    // 6. 记录交易
    await connection.execute(
      'INSERT INTO credit_transactions (user_id, transaction_type, amount, reason) VALUES (?, ?, ?, ?)',
      [userId, 'reward', 250, '脚本修复会员状态 - 设置为标准会员']
    );
    
    // 7. 提交事务
    await connection.commit();
    
    console.log('✅ 会员状态修复成功');
    
    // 8. 验证结果
    const [result] = await connection.execute(
      'SELECT * FROM user_membership_status WHERE user_id = ?',
      [userId]
    );
    
    console.log('修复后的状态:', result[0]);
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ 修复失败:', error);
  } finally {
    await connection.end();
  }
}

// 检查环境变量
if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  console.error('❌ 请设置数据库环境变量: DB_USER, DB_PASSWORD, DB_NAME');
  process.exit(1);
}

fixMembership().catch(console.error);