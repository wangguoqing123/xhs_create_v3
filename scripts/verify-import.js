const mysql = require('mysql2/promise')

async function verifyImport() {
  let connection
  
  try {
    console.log('🔍 验证CSV数据导入结果...\n')
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'xhs_create_v3'
    })
    
    // 查询总记录数
    const [totalRows] = await connection.execute('SELECT COUNT(*) as total FROM explosive_contents')
    console.log(`📊 数据库中总记录数: ${totalRows[0].total}`)
    
    // 查询按行业分类的统计
    const [industryStats] = await connection.execute(`
      SELECT industry, COUNT(*) as count 
      FROM explosive_contents 
      GROUP BY industry 
      ORDER BY count DESC
    `)
    
    console.log('\n🏭 行业分布统计:')
    industryStats.forEach(row => {
      const industryName = {
        'decoration': '装修',
        'travel': '旅游',
        'study_abroad': '游学',
        'other': '其他'
      }[row.industry] || row.industry
      console.log(`  ${industryName}: ${row.count} 条`)
    })
    
    // 查询按内容类型分类的统计
    const [contentTypeStats] = await connection.execute(`
      SELECT content_type, COUNT(*) as count 
      FROM explosive_contents 
      GROUP BY content_type 
      ORDER BY count DESC
    `)
    
    console.log('\n📝 内容类型分布统计:')
    contentTypeStats.forEach(row => {
      const typeName = {
        'guide': '干货',
        'review': '测评',
        'marketing': '推荐/营销',
        'other': '其他'
      }[row.content_type] || row.content_type
      console.log(`  ${typeName}: ${row.count} 条`)
    })
    
    // 查询按口吻分类的统计
    const [toneStats] = await connection.execute(`
      SELECT tone, COUNT(*) as count 
      FROM explosive_contents 
      GROUP BY tone 
      ORDER BY count DESC
    `)
    
    console.log('\n🗣️ 口吻分布统计:')
    toneStats.forEach(row => {
      const toneName = {
        'personal': '素人口吻',
        'business': '商家口吻',
        'other': '其他'
      }[row.tone] || row.tone
      console.log(`  ${toneName}: ${row.count} 条`)
    })
    
    // 查询最新的5条记录
    const [latestRecords] = await connection.execute(`
      SELECT id, title, industry, content_type, tone, created_at
      FROM explosive_contents 
      ORDER BY created_at DESC 
      LIMIT 5
    `)
    
    console.log('\n📋 最新导入的5条记录:')
    latestRecords.forEach((record, index) => {
      console.log(`  ${index + 1}. [${record.id}] ${record.title.substring(0, 30)}...`)
      console.log(`     行业: ${record.industry} | 类型: ${record.content_type} | 口吻: ${record.tone}`)
      console.log(`     时间: ${record.created_at}`)
      console.log('')
    })
    
    // 检查是否有重复数据
    const [duplicates] = await connection.execute(`
      SELECT title, COUNT(*) as count 
      FROM explosive_contents 
      GROUP BY title 
      HAVING COUNT(*) > 1
    `)
    
    if (duplicates.length > 0) {
      console.log(`⚠️  发现 ${duplicates.length} 个重复标题:`)
      duplicates.slice(0, 3).forEach(dup => {
        console.log(`  - "${dup.title}" (${dup.count} 次)`)
      })
    } else {
      console.log('✅ 未发现重复数据')
    }
    
    console.log('\n🎉 数据验证完成！')
    
  } catch (error) {
    console.error('❌ 验证过程中出错:', error.message)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// 执行验证
if (require.main === module) {
  verifyImport().catch(console.error)
}

module.exports = { verifyImport } 