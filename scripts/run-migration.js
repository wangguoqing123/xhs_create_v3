const https = require('https');
const http = require('http');

// 配置
const API_BASE_URL = 'http://localhost:3000'; // 根据实际情况修改
const ADMIN_COOKIE = 'admin_auth=authenticated';

// 发送HTTP请求的函数
function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始数据库迁移...\n');
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': ADMIN_COOKIE
      }
    };
    
    console.log('🔄 正在调用迁移API...');
    const apiUrl = `${API_BASE_URL}/api/admin/migrate`;
    
    try {
      const response = await makeRequest(apiUrl, options);
      
      console.log(`📡 API响应状态: ${response.status}`);
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ 数据库迁移成功！');
        console.log('\n📊 迁移步骤:');
        response.data.data.steps.forEach((step, index) => {
          console.log(`  ${index + 1}. ${step}`);
        });
        
        console.log('\n🎉 迁移完成！现在您可以：');
        console.log('  1. 访问 /admin 页面查看管理员界面');
        console.log('  2. 访问 /note-rewrite 页面查看新的筛选功能');
        console.log('  3. 使用CSV导入功能导入更多数据');
        
      } else {
        console.error('❌ 迁移失败:', response.data.message || '未知错误');
      }
      
    } catch (apiError) {
      console.error('❌ API调用失败:', apiError.message);
      console.log('\n💡 请检查以下事项:');
      console.log('  1. 确保应用程序正在运行 (npm run dev)');
      console.log('  2. 检查API_BASE_URL是否正确');
      console.log('  3. 确保数据库连接正常');
      console.log('  4. 检查管理员认证是否有效');
    }
    
  } catch (error) {
    console.error('❌ 程序执行失败:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main().catch(console.error); 