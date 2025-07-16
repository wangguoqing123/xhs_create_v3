const { processCSV } = require('./import-csv-fixed')

async function importToDatabase() {
  try {
    console.log('🚀 开始CSV数据导入流程...\n')
    
    // 第一步：处理CSV数据
    console.log('📋 第一步：处理CSV数据')
    const processedData = await processCSV()
    
    if (!processedData || processedData.valid.length === 0) {
      console.log('❌ 没有有效数据可导入')
      return
    }
    
    console.log(`\n✅ 数据处理完成，准备导入 ${processedData.valid.length} 条记录`)
    
    // 第二步：分批导入数据
    console.log('\n📤 第二步：分批导入数据到数据库')
    
    const batchSize = 50 // 每批导入50条
    const validData = processedData.valid
    const totalBatches = Math.ceil(validData.length / batchSize)
    
    let successCount = 0
    let failCount = 0
    const failedItems = []
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize
      const end = Math.min(start + batchSize, validData.length)
      const batch = validData.slice(start, end)
      
      console.log(`\n🔄 正在导入第 ${i + 1}/${totalBatches} 批 (${start + 1}-${end} 条)`)
      
      try {
        const response = await fetch('http://localhost:3000/api/admin/explosive-contents/csv-import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'admin_auth=authenticated'
          },
          body: JSON.stringify({
            csvData: convertToCSV(batch)
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          successCount += result.successCount || batch.length
          console.log(`✅ 批次 ${i + 1} 导入成功: ${result.successCount || batch.length} 条`)
        } else {
          failCount += batch.length
          failedItems.push(...batch)
          console.log(`❌ 批次 ${i + 1} 导入失败: ${result.message}`)
        }
        
      } catch (error) {
        failCount += batch.length
        failedItems.push(...batch)
        console.log(`❌ 批次 ${i + 1} 导入出错: ${error.message}`)
      }
      
      // 添加延迟避免过快请求
      if (i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // 第三步：显示最终结果
    console.log('\n📊 导入完成统计:')
    console.log(`✅ 成功导入: ${successCount} 条`)
    console.log(`❌ 导入失败: ${failCount} 条`)
    console.log(`📈 成功率: ${((successCount / validData.length) * 100).toFixed(1)}%`)
    
    // 显示分类统计
    if (processedData.stats) {
      console.log('\n📈 数据分类统计:')
      console.log('行业分布:', processedData.stats.industryStats)
      console.log('内容类型分布:', processedData.stats.contentTypeStats)
      console.log('口吻分布:', processedData.stats.toneStats)
    }
    
    if (failedItems.length > 0) {
      console.log('\n⚠️  失败项目示例:')
      failedItems.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title.substring(0, 30)}...`)
      })
    }
    
    console.log('\n🎉 导入流程完成！')
    
  } catch (error) {
    console.error('❌ 导入过程中出错:', error)
  }
}

// 将数据转换为CSV格式（用于API调用）
function convertToCSV(data) {
  const headers = ['笔记链接', '标题', '内容', '视频内容', '笔记话题', '笔记类型', '笔记口吻', '笔记赛道', '图片内容', '图片地址', '视频地址', '图片', '作者']
  
  const csvLines = [headers.join(',')]
  
  data.forEach(item => {
    const row = [
      item.source_urls?.[0] || '',
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.content.replace(/"/g, '""')}"`,
      '',
      item.tags?.join(' ') || '',
      item.content_type || '',
      item.tone || '',
      item.industry || '',
      '',
      item.cover_image || '',  // 图片地址
      '',
      item.cover_image || '',  // 图片
      item.author || ''
    ]
    csvLines.push(row.join(','))
  })
  
  return csvLines.join('\n')
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/config-check')
    if (response.ok) {
      console.log('✅ 服务器运行正常')
      return true
    }
  } catch (error) {
    console.log('❌ 服务器未运行，请先启动开发服务器:')
    console.log('   npm run dev')
    return false
  }
}

// 主函数
async function main() {
  console.log('🎯 CSV数据导入工具')
  console.log('================\n')
  
  // 检查服务器状态
  const serverRunning = await checkServer()
  if (!serverRunning) {
    return
  }
  
  // 开始导入
  await importToDatabase()
}

// 执行主函数
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { importToDatabase } 