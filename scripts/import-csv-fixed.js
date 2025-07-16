const fs = require('fs')
const path = require('path')

// CSV文件路径
const csvFilePath = path.join(__dirname, '..', '壹始团队-爆款内容库_笔记数据查看 (1).csv')

// 行业分类映射
const industryMapping = {
  '旅游': 'travel',
  '游学': 'study_abroad', 
  '装修': 'decoration',
  '其他': 'other'
}

// 内容类型映射
const contentTypeMapping = {
  '干货': 'guide',
  '攻略': 'guide',
  '指南': 'guide',
  '测评': 'review',
  '评测': 'review',
  '推荐': 'marketing',
  '营销': 'marketing',
  '其他': 'other'
}

// 口吻类型映射
const toneMapping = {
  '素人口吻': 'personal',
  '商家口吻': 'business',
  '其他': 'other'
}

// 从内容中智能推断行业
function inferIndustry(content, track) {
  const text = (content + ' ' + (track || '')).toLowerCase()
  
  if (text.includes('新西兰') || text.includes('旅游') || text.includes('旅行') || 
      text.includes('景点') || text.includes('攻略') || text.includes('避暑') ||
      text.includes('恩施')) {
    return 'travel'
  }
  
  if (text.includes('游学') || text.includes('留学') || text.includes('考研') ||
      text.includes('日本留学') || text.includes('高考')) {
    return 'study_abroad'
  }
  
  if (text.includes('装修') || text.includes('家装') || text.includes('设计师') ||
      text.includes('工长') || text.includes('半包') || text.includes('全屋') ||
      text.includes('岩板') || text.includes('旧房翻新') || text.includes('老房') ||
      text.includes('厨卫') || text.includes('拆除') || text.includes('建墙')) {
    return 'decoration'
  }
  
  return 'other'
}

// 从内容中智能推断内容类型
function inferContentType(content, noteType) {
  const text = (content + ' ' + (noteType || '')).toLowerCase()
  
  if (text.includes('干货') || text.includes('攻略') || text.includes('指南') ||
      text.includes('教程') || text.includes('建议') || text.includes('秘籍') ||
      text.includes('规划') || text.includes('避坑')) {
    return 'guide'
  }
  
  if (text.includes('测评') || text.includes('评测') || text.includes('对比') ||
      text.includes('体验') || text.includes('感受') || text.includes('跑了')) {
    return 'review'
  }
  
  if (text.includes('推荐') || text.includes('营销') || text.includes('种草') ||
      text.includes('自荐') || text.includes('接单') || text.includes('只做') ||
      text.includes('专业') || text.includes('联系') || text.includes('工作室')) {
    return 'marketing'
  }
  
  return 'other'
}

// 从内容中智能推断口吻
function inferTone(content, tone) {
  const text = (content + ' ' + (tone || '')).toLowerCase()
  
  if (text.includes('素人') || text.includes('个人') || text.includes('分享') ||
      text.includes('我家') || text.includes('我们') || text.includes('感谢') ||
      text.includes('终于') || text.includes('幸福') || text.includes('心累') ||
      text.includes('家人们') || text.includes('薯宝们')) {
    return 'personal'
  }
  
  if (text.includes('商家') || text.includes('官方') || text.includes('品牌') ||
      text.includes('专业') || text.includes('从业') || text.includes('设计师') ||
      text.includes('工长') || text.includes('装修公司') || text.includes('只接') ||
      text.includes('联系我') || text.includes('坐标') || text.includes('自我介绍')) {
    return 'business'
  }
  
  return 'other'
}

// 解析标签
function parseTags(tagsStr) {
  if (!tagsStr || tagsStr === '请你提供包含#号内容的具体文本，以便我按照序列号进行写入。') {
    return []
  }
  
  const tags = []
  
  // 提取#标签
  const hashTags = tagsStr.match(/#[^\s#]+/g)
  if (hashTags) {
    tags.push(...hashTags)
  }
  
  // 提取其他格式的标签
  const cleanTags = tagsStr
    .replace(/#/g, '')
    .split(/[,，、\s]+/)
    .filter(tag => tag.trim().length > 0)
    .map(tag => tag.trim())
  
  tags.push(...cleanTags)
  
  return [...new Set(tags)] // 去重
}

// 移除BOM头
function removeBOM(str) {
  if (str.charCodeAt(0) === 0xFEFF) {
    return str.slice(1)
  }
  return str
}

// 更健壮的CSV解析器
function parseCSV(csvContent) {
  // 移除BOM头
  csvContent = removeBOM(csvContent)
  
  // 按行分割，但要考虑引号内的换行符
  const lines = []
  let currentLine = ''
  let inQuotes = false
  let quoteChar = null
  
  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i]
    const nextChar = csvContent[i + 1]
    
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true
      quoteChar = char
      currentLine += char
    } else if (char === quoteChar && inQuotes) {
      if (nextChar === quoteChar) {
        // 转义的引号
        currentLine += char + char
        i++ // 跳过下一个字符
      } else {
        // 引号结束
        inQuotes = false
        quoteChar = null
        currentLine += char
      }
    } else if (char === '\n' && !inQuotes) {
      // 行结束
      if (currentLine.trim()) {
        lines.push(currentLine.trim())
      }
      currentLine = ''
    } else {
      currentLine += char
    }
  }
  
  // 添加最后一行
  if (currentLine.trim()) {
    lines.push(currentLine.trim())
  }
  
  return lines
}

// 解析CSV行
function parseCSVRow(row) {
  const result = []
  let current = ''
  let inQuotes = false
  let quoteChar = null
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i]
    const nextChar = row[i + 1]
    
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true
      quoteChar = char
    } else if (char === quoteChar && inQuotes) {
      if (nextChar === quoteChar) {
        // 转义的引号
        current += char
        i++ // 跳过下一个字符
      } else {
        // 引号结束
        inQuotes = false
        quoteChar = null
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

async function processCSV() {
  try {
    console.log('📖 正在读取CSV文件...')
    
    if (!fs.existsSync(csvFilePath)) {
      console.error('❌ CSV文件不存在:', csvFilePath)
      return
    }
    
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8')
    const lines = parseCSV(csvContent)
    
    console.log(`📊 总行数: ${lines.length}`)
    
    // 解析标题行
    const headers = parseCSVRow(lines[0])
    console.log('📋 标题行:', headers)
    
    // 确定字段索引 - 根据实际CSV文件结构
    const fieldIndexes = {
      link: 0,      // 笔记链接
      title: 1,     // 标题
      content: 2,   // 内容
      videoContent: 3, // 视频内容
      tags: 4,      // 笔记话题
      noteType: 5,  // 笔记类型
      tone: 6,      // 笔记口吻
      track: 7,     // 笔记赛道
      pictureContent: 8, // 图片内容
      imageList: 9, // 图片地址
      videoUrl: 10, // 视频地址
      image: 11,    // 图片
      author: 12    // 作者
    }
    
    const validContents = []
    const invalidContents = []
    
    console.log('🔄 开始处理数据...')
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const row = parseCSVRow(lines[i])
        
        // 跳过无效行
        if (row.length < 3) {
          continue
        }
        
        const title = row[fieldIndexes.title]?.trim()
        const content = row[fieldIndexes.content]?.trim()
        
        // 验证必需字段
        if (!title || !content || title === 'title' || content === 'content') {
          invalidContents.push({
            line: i + 1,
            error: '标题或内容为空',
            title: title || '未知'
          })
          continue
        }
        
        // 获取其他字段
        const tagsStr = row[fieldIndexes.tags]?.trim() || ''
        const noteType = row[fieldIndexes.noteType]?.trim() || ''
        const toneStr = row[fieldIndexes.tone]?.trim() || ''
        const track = row[fieldIndexes.track]?.trim() || ''
        const author = row[fieldIndexes.author]?.trim() || null
        const sourceLink = row[fieldIndexes.link]?.trim() || ''
        
        // 获取图片相关字段
        const imageList = row[fieldIndexes.imageList]?.trim() || ''
        const singleImage = row[fieldIndexes.image]?.trim() || ''
        
        // 处理封面图片 - 优先使用图片地址字段，然后是图片字段
        let coverImage = null
        if (imageList && imageList !== 'image_list') {
          // 如果图片地址字段有内容，尝试提取第一张图片
          const imageUrls = imageList.split(/[,，\s]+/).filter(url => url.trim().length > 0)
          if (imageUrls.length > 0) {
            coverImage = imageUrls[0]
          }
        } else if (singleImage && singleImage !== '') {
          coverImage = singleImage
        }
        
        // 处理作者信息 - 如果作者字段为空或为默认值，尝试从内容中提取
        let finalAuthor = author
        if (!finalAuthor || finalAuthor === 'author') {
          // 从内容中提取可能的作者信息
          const authorMatch = content.match(/作者[：:]\s*([^\s，,。！？\n]+)|@([^\s，,。！？\n]+)|我是([^\s，,。！？\n]+)/g)
          if (authorMatch) {
            finalAuthor = authorMatch[0].replace(/作者[：:]|@|我是/g, '').trim()
          }
        }
        
        // 解析标签
        const tags = parseTags(tagsStr)
        
        // 智能推断分类
        const industry = inferIndustry(content, track)
        const contentType = inferContentType(content, noteType)
        const tone = inferTone(content, toneStr)
        
        // 构建导入数据
        const importData = {
          title,
          content,
          tags,
          industry,
          content_type: contentType,
          tone,
          source_urls: sourceLink ? [sourceLink] : [],
          cover_image: coverImage,
          author: finalAuthor,
          status: 'enabled'
        }
        
        validContents.push(importData)
        
        // 显示进度
        if (i % 100 === 0) {
          console.log(`📈 已处理 ${i}/${lines.length} 行`)
        }
        
      } catch (error) {
        invalidContents.push({
          line: i + 1,
          error: error.message,
          title: '解析错误'
        })
      }
    }
    
    console.log(`\n📊 处理完成统计:`)
    console.log(`✅ 有效数据: ${validContents.length} 条`)
    console.log(`❌ 无效数据: ${invalidContents.length} 条`)
    
    // 显示分类统计
    const industryStats = {}
    const contentTypeStats = {}
    const toneStats = {}
    
    validContents.forEach(item => {
      industryStats[item.industry] = (industryStats[item.industry] || 0) + 1
      contentTypeStats[item.content_type] = (contentTypeStats[item.content_type] || 0) + 1
      toneStats[item.tone] = (toneStats[item.tone] || 0) + 1
    })
    
    console.log('\n📈 分类统计:')
    console.log('行业分布:', industryStats)
    console.log('内容类型分布:', contentTypeStats)
    console.log('口吻分布:', toneStats)
    
    // 保存处理后的数据
    const outputData = {
      valid: validContents,
      invalid: invalidContents,
      stats: {
        total: lines.length - 1,
        valid: validContents.length,
        invalid: invalidContents.length,
        industryStats,
        contentTypeStats,
        toneStats
      }
    }
    
    const outputPath = path.join(__dirname, 'processed-csv-data.json')
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2))
    
    console.log(`\n💾 处理结果已保存到: ${outputPath}`)
    
    // 显示前几个无效项目
    if (invalidContents.length > 0) {
      console.log('\n⚠️  部分无效项目:')
      invalidContents.slice(0, 5).forEach(item => {
        console.log(`  - 第${item.line}行: ${item.title} - ${item.error}`)
      })
      if (invalidContents.length > 5) {
        console.log(`  ... 还有 ${invalidContents.length - 5} 个无效项目`)
      }
    }
    
    return outputData
    
  } catch (error) {
    console.error('❌ 处理CSV文件时出错:', error)
    throw error
  }
}

// 执行处理
if (require.main === module) {
  processCSV().catch(console.error)
}

module.exports = { processCSV } 