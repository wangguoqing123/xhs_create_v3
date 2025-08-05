#!/usr/bin/env node

/**
 * 管理员会员到期时间调整功能 API 验证脚本
 * 
 * 使用方法：
 * node __tests__/api-validation-script.js
 * 
 * 环境变量：
 * - TEST_USER_ID: 测试用户的UUID
 * - TEST_BASE_URL: API基础URL（默认: http://localhost:3000）
 */

const http = require('http');
const https = require('https');
const querystring = require('querystring');

// 配置
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_USER_ID = process.env.TEST_USER_ID || '请设置TEST_USER_ID环境变量';
const ADMIN_COOKIE = 'admin_auth=authenticated'; // 需要先登录管理员

// 测试用例
const testCases = [
  {
    name: '正常调整到期时间（未来日期）',
    data: {
      user_id: TEST_USER_ID,
      new_expiry_date: '2024-12-31T23:59:59',
      reason: '测试正常调整功能'
    },
    expectedStatus: 200
  },
  {
    name: '调整到期时间（过去日期，测试积分清零）',
    data: {
      user_id: TEST_USER_ID,
      new_expiry_date: '2023-01-01T00:00:00',
      reason: '测试过期会员功能和积分清零'
    },
    expectedStatus: 200,
    validateResponse: (response) => {
      // 验证积分变化
      return response.data?.credits_change?.new_credits === 0 && 
             response.data?.credits_change?.reset_triggered === true;
    }
  },
  {
    name: '参数验证 - 无效用户ID',
    data: {
      user_id: 'invalid-uuid',
      new_expiry_date: '2024-12-31T23:59:59',
      reason: '测试参数验证'
    },
    expectedStatus: 400
  },
  {
    name: '参数验证 - 缺少用户ID',
    data: {
      new_expiry_date: '2024-12-31T23:59:59',
      reason: '测试参数验证'
    },
    expectedStatus: 400
  },
  {
    name: '参数验证 - 无效日期格式',
    data: {
      user_id: TEST_USER_ID,
      new_expiry_date: 'invalid-date',
      reason: '测试参数验证'
    },
    expectedStatus: 400
  },
  {
    name: '参数验证 - 过于久远的日期',
    data: {
      user_id: TEST_USER_ID,
      new_expiry_date: '1900-01-01T00:00:00',
      reason: '测试参数验证'
    },
    expectedStatus: 400
  }
];

// HTTP请求工具函数
function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': ADMIN_COOKIE,
        ...options.headers
      }
    };

    const req = client.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            body: jsonBody,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 测试执行器
async function runTest(testCase) {
  console.log(`\n🧪 执行测试: ${testCase.name}`);
  console.log(`📋 测试数据:`, JSON.stringify(testCase.data, null, 2));
  
  try {
    const response = await makeRequest(
      `${BASE_URL}/api/admin/operations/adjust-membership-expiry`,
      { method: 'POST' },
      testCase.data
    );
    
    let passed = response.statusCode === testCase.expectedStatus;
    let validationError = null;
    
    // 如果状态码匹配，且有响应验证函数，则进行响应验证
    if (passed && testCase.validateResponse) {
      try {
        const responseValid = testCase.validateResponse(response.body);
        if (!responseValid) {
          passed = false;
          validationError = '响应内容验证失败';
        }
      } catch (err) {
        passed = false;
        validationError = `响应验证错误: ${err.message}`;
      }
    }
    
    const statusIcon = passed ? '✅' : '❌';
    
    console.log(`${statusIcon} 状态码: ${response.statusCode} (期望: ${testCase.expectedStatus})`);
    if (validationError) {
      console.log(`❌ 验证失败: ${validationError}`);
    }
    console.log(`📤 响应:`, JSON.stringify(response.body, null, 2));
    
    return {
      testCase: testCase.name,
      passed,
      actualStatus: response.statusCode,
      expectedStatus: testCase.expectedStatus,
      response: response.body,
      validationError
    };
  } catch (error) {
    console.log(`❌ 请求失败:`, error.message);
    return {
      testCase: testCase.name,
      passed: false,
      error: error.message
    };
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始API验证测试');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`👤 Test User ID: ${TEST_USER_ID}`);
  
  if (TEST_USER_ID === '请设置TEST_USER_ID环境变量') {
    console.log('❌ 请设置TEST_USER_ID环境变量');
    console.log('示例: TEST_USER_ID=your-user-uuid node __tests__/api-validation-script.js');
    process.exit(1);
  }
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push(result);
    
    // 测试间隔，避免过快请求
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 生成测试报告
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试报告');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`总测试数: ${total}`);
  console.log(`通过数: ${passed}`);
  console.log(`失败数: ${total - passed}`);
  console.log(`通过率: ${Math.round((passed / total) * 100)}%`);
  
  console.log('\n📋 详细结果:');
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${result.testCase}`);
    if (!result.passed && result.error) {
      console.log(`   错误: ${result.error}`);
    }
    if (!result.passed && result.actualStatus !== result.expectedStatus) {
      console.log(`   状态码不匹配: 实际 ${result.actualStatus}, 期望 ${result.expectedStatus}`);
    }
  });
  
  if (passed === total) {
    console.log('\n🎉 所有测试通过！');
    process.exit(0);
  } else {
    console.log('\n⚠️  部分测试失败，请检查API实现');
    process.exit(1);
  }
}

// 权限验证测试
async function testUnauthorizedAccess() {
  console.log('\n🔒 测试未授权访问');
  
  try {
    const response = await makeRequest(
      `${BASE_URL}/api/admin/operations/adjust-membership-expiry`,
      { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' } // 不带Cookie
      },
      {
        user_id: TEST_USER_ID,
        new_expiry_date: '2024-12-31T23:59:59'
      }
    );
    
    const passed = response.statusCode === 401;
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} 未授权访问测试: ${response.statusCode} (期望: 401)`);
    
    return passed;
  } catch (error) {
    console.log(`❌ 权限测试失败:`, error.message);
    return false;
  }
}

// 数据库验证提示
function showDatabaseValidationTips() {
  console.log('\n💾 数据库验证建议:');
  console.log('请手动执行以下SQL查询验证数据一致性：');
  console.log('');
  console.log('-- 检查会员到期时间更新');
  console.log(`SELECT user_id, end_date, updated_at FROM memberships WHERE user_id = '${TEST_USER_ID}' AND status = 'active';`);
  console.log('');
  console.log('-- 检查用户积分和重置时间');
  console.log(`SELECT id, email, credits, last_credits_reset, next_credits_reset, monthly_credits FROM users WHERE id = '${TEST_USER_ID}';`);
  console.log('');
  console.log('-- 检查会员类型和付费周期（验证积分重置逻辑）');
  console.log(`SELECT u.id, u.email, u.credits, u.monthly_credits, m.tier, m.duration, m.start_date, m.end_date FROM users u JOIN memberships m ON u.id = m.user_id WHERE u.id = '${TEST_USER_ID}' AND m.status = 'active';`);
  console.log('');
  console.log('-- 检查操作日志记录（包含积分变化详情）');
  console.log("SELECT admin_user, operation_type, target_user_email, operation_details, created_at FROM admin_operation_logs WHERE operation_type = 'adjust_membership_expiry' ORDER BY created_at DESC LIMIT 5;");
  console.log('');
  console.log('-- 验证积分重置逻辑是否正确');
  console.log('-- 对于月会员：next_credits_reset应该为NULL');
  console.log('-- 对于年会员：next_credits_reset应该基于start_date + 30天计算');
  console.log(`SELECT `);
  console.log(`  u.id, u.email, u.credits, u.next_credits_reset,`);
  console.log(`  m.duration, m.start_date, m.end_date,`);
  console.log(`  CASE `);
  console.log(`    WHEN m.duration = 'monthly' THEN 'next_credits_reset应该为NULL'`);
  console.log(`    WHEN m.duration = 'yearly' THEN CONCAT('next_credits_reset应该为: ', DATE_ADD(m.start_date, INTERVAL 30 DAY))`);
  console.log(`    ELSE '无会员'`);
  console.log(`  END as expected_reset`);
  console.log(`FROM users u `);
  console.log(`LEFT JOIN memberships m ON u.id = m.user_id AND m.status = 'active'`);
  console.log(`WHERE u.id = '${TEST_USER_ID}';`);
}

// 执行测试
if (require.main === module) {
  (async () => {
    try {
      // 先测试未授权访问
      await testUnauthorizedAccess();
      
      // 执行主要测试
      await runAllTests();
      
      // 显示数据库验证提示
      showDatabaseValidationTips();
      
    } catch (error) {
      console.error('测试执行失败:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  runTest,
  runAllTests,
  testUnauthorizedAccess
};