const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 配置
const API_BASE_URL = 'http://localhost:3000'; // 根据实际情况修改
const CSV_FILE_PATH = path.join(__dirname, '..', '壹始团队-爆款内容库_笔记数据查看 (1).csv');

// 模拟管理员认证Cookie
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
    console.log('🚀 开始CSV数据导入流程...\n');
    
    // 1. 检查CSV文件是否存在
    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error('❌ CSV文件不存在:', CSV_FILE_PATH);
      process.exit(1);
    }
    
    // 2. 读取CSV文件
    console.log('📋 正在读取CSV文件...');
    const csvData = fs.readFileSync(CSV_FILE_PATH, 'utf8');
    console.log('✅ CSV文件读取成功');
    console.log(`📊 文件大小: ${(csvData.length / 1024).toFixed(2)} KB`);
    console.log(`📄 总行数: ${csvData.split('\n').length}`);
    
    // 3. 准备API请求
    const requestData = JSON.stringify({ csvData });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData),
        'Cookie': ADMIN_COOKIE
      }
    };
    
    // 4. 调用导入API
    console.log('\n🔄 正在调用导入API...');
    const apiUrl = `${API_BASE_URL}/api/admin/explosive-contents/csv-import`;
    
    try {
      const response = await makeRequest(apiUrl, options, requestData);
      
      console.log(`📡 API响应状态: ${response.status}`);
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ CSV数据导入成功！');
        console.log('\n📊 导入统计:');
        console.log(`  总处理数: ${response.data.data.total_processed}`);
        console.log(`  成功导入: ${response.data.data.successful_count}`);
        console.log(`  导入失败: ${response.data.data.failed_count}`);
        
        // 显示失败项目
        if (response.data.data.failed_items && response.data.data.failed_items.length > 0) {
          console.log('\n❌ 失败项目:');
          response.data.data.failed_items.forEach((item, index) => {
            console.log(`  ${index + 1}. 第${item.line}行: ${item.title} - ${item.error}`);
          });
        }
        
        // 显示无效内容
        if (response.data.data.invalid_contents && response.data.data.invalid_contents.length > 0) {
          console.log('\n⚠️ 无效内容:');
          response.data.data.invalid_contents.forEach((item, index) => {
            console.log(`  ${index + 1}. 第${item.line}行: ${item.title} - ${item.error}`);
          });
        }
        
      } else {
        console.error('❌ 导入失败:', response.data.message || '未知错误');
        if (response.data.invalid_contents) {
          console.log('\n⚠️ 无效内容详情:');
          response.data.invalid_contents.forEach((item, index) => {
            console.log(`  ${index + 1}. 第${item.line}行: ${item.title} - ${item.error}`);
          });
        }
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