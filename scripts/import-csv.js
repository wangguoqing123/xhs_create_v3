const fs = require('fs');
const path = require('path');

// 读取CSV文件
const csvFilePath = path.join(__dirname, '..', '壹始团队-爆款内容库_笔记数据查看 (1).csv');

try {
  // 检查文件是否存在
  if (!fs.existsSync(csvFilePath)) {
    console.error('❌ CSV文件不存在:', csvFilePath);
    process.exit(1);
  }

  // 读取CSV文件内容
  const csvData = fs.readFileSync(csvFilePath, 'utf8');
  
  console.log('📋 CSV文件读取成功');
  console.log('📊 文件大小:', (csvData.length / 1024).toFixed(2), 'KB');
  console.log('📄 总行数:', csvData.split('\n').length);
  
  // 显示前几行内容
  const lines = csvData.split('\n');
  console.log('\n📝 前5行内容:');
  lines.slice(0, 5).forEach((line, index) => {
    console.log(`${index + 1}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
  });

  // 准备API请求数据
  const requestData = {
    csvData: csvData
  };

  console.log('\n🚀 准备调用导入API...');
  console.log('💡 请在管理员后台登录后，手动调用以下API:');
  console.log('📍 API端点: POST /api/admin/explosive-contents/csv-import');
  console.log('📦 请求体: { "csvData": "..." }');
  console.log('🔒 需要管理员认证 (admin_auth cookie)');
  
  // 将数据写入临时文件供调试使用
  const tempFile = path.join(__dirname, 'csv-import-data.json');
  fs.writeFileSync(tempFile, JSON.stringify(requestData, null, 2));
  console.log('💾 导入数据已保存到:', tempFile);

} catch (error) {
  console.error('❌ 处理CSV文件时出错:', error.message);
  process.exit(1);
} 