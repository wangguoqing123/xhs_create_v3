// 测试分页功能
const testPagination = async () => {
  console.log('🧪 开始测试分页功能...')
  
  try {
    // 测试第一页
    console.log('\n📄 测试第一页 (limit=10, offset=0)')
    const response1 = await fetch('/api/explosive-contents?limit=10&offset=0')
    const data1 = await response1.json()
    
    if (data1.success) {
      console.log('✅ 第一页获取成功')
      console.log(`   数据条数: ${data1.data.length}`)
      console.log(`   总数: ${data1.total}`)
      console.log(`   参数: ${JSON.stringify(data1.params)}`)
    } else {
      console.log('❌ 第一页获取失败:', data1.error)
    }
    
    // 测试第二页
    console.log('\n📄 测试第二页 (limit=10, offset=10)')
    const response2 = await fetch('/api/explosive-contents?limit=10&offset=10')
    const data2 = await response2.json()
    
    if (data2.success) {
      console.log('✅ 第二页获取成功')
      console.log(`   数据条数: ${data2.data.length}`)
      console.log(`   总数: ${data2.total}`)
      console.log(`   参数: ${JSON.stringify(data2.params)}`)
    } else {
      console.log('❌ 第二页获取失败:', data2.error)
    }
    
    // 测试筛选 + 分页
    console.log('\n📄 测试筛选 + 分页 (industry=beauty, limit=5, offset=0)')
    const response3 = await fetch('/api/explosive-contents?industry=beauty&limit=5&offset=0')
    const data3 = await response3.json()
    
    if (data3.success) {
      console.log('✅ 筛选分页获取成功')
      console.log(`   数据条数: ${data3.data.length}`)
      console.log(`   总数: ${data3.total}`)
      console.log(`   参数: ${JSON.stringify(data3.params)}`)
    } else {
      console.log('❌ 筛选分页获取失败:', data3.error)
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error)
  }
}

// 如果直接运行此脚本
if (typeof window !== 'undefined') {
  testPagination()
} else {
  console.log('请在浏览器控制台中运行此测试')
} 