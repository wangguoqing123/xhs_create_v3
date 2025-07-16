const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'xhs_create_v3',
  charset: 'utf8mb4',
  timezone: '+08:00'
};

async function runMigration() {
  let connection;
  
  try {
    console.log('🔄 连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ 数据库连接成功');
    
    // 读取迁移脚本
    const migrationFile = path.join(__dirname, '..', 'mysql_migrations', '007_update_explosive_contents_structure.sql');
    const sqlScript = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('📋 开始执行数据库迁移...');
    
    // 分割SQL语句（按分号分割，但忽略存储过程中的分号）
    const statements = [];
    let currentStatement = '';
    let inDelimiter = false;
    
    const lines = sqlScript.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 跳过注释和空行
      if (trimmedLine.startsWith('--') || trimmedLine === '') {
        continue;
      }
      
      // 处理DELIMITER语句
      if (trimmedLine.startsWith('DELIMITER')) {
        if (trimmedLine.includes('$$')) {
          inDelimiter = true;
        } else {
          inDelimiter = false;
          if (currentStatement.trim()) {
            statements.push(currentStatement.trim());
            currentStatement = '';
          }
        }
        continue;
      }
      
      currentStatement += line + '\n';
      
      // 如果不在存储过程中，遇到分号就结束语句
      if (!inDelimiter && trimmedLine.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    // 添加最后一个语句
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    // 执行每个语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`📝 执行语句 ${i + 1}/${statements.length}...`);
          await connection.execute(statement);
          console.log(`✅ 语句 ${i + 1} 执行成功`);
        } catch (error) {
          console.error(`❌ 语句 ${i + 1} 执行失败:`, error.message);
          console.log('失败的语句:', statement.substring(0, 100) + '...');
          // 继续执行其他语句
        }
      }
    }
    
    console.log('✅ 数据库迁移完成！');
    
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 运行迁移
runMigration().catch(console.error); 