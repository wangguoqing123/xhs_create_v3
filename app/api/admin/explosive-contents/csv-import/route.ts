import { NextRequest, NextResponse } from 'next/server'
import { batchCreateExplosiveContents } from '@/lib/mysql-explosive-contents'
import { ExplosiveContentInsert } from '@/lib/types'
import { cookies } from 'next/headers'

// 检查管理员认证
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  return adminAuth?.value === 'authenticated'
}

// 行业分类映射
const industryMapping: { [key: string]: string } = {
  '旅游': 'travel',
  '游学': 'study_abroad',
  '装修': 'decoration',
  '其他': 'other'
}

// 内容类型映射
const contentTypeMapping: { [key: string]: string } = {
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
const toneMapping: { [key: string]: string } = {
  '素人口吻': 'personal',
  '商家口吻': 'business',
  '其他': 'other'
}

// 从内容中提取赛道ID
function extractTrackFromContent(content: string, tags: string[]): number {
  const allText = (content + ' ' + tags.join(' ')).toLowerCase()
  
  // 根据关键词判断赛道
  if (allText.includes('装修') || allText.includes('家装') || allText.includes('设计') || allText.includes('家居')) {
    return 1 // 装修
  }
  if (allText.includes('石材') || allText.includes('大理石') || allText.includes('花岗岩')) {
    return 2 // 石材
  }
  if (allText.includes('旅游') || allText.includes('旅行') || allText.includes('景点') || allText.includes('攻略')) {
    return 3 // 旅游
  }
  if (allText.includes('游学') || allText.includes('留学') || allText.includes('海外') || allText.includes('学习')) {
    return 4 // 留学
  }
  if (allText.includes('保险') || allText.includes('理财') || allText.includes('投保')) {
    return 5 // 保险
  }
  if (allText.includes('考研') || allText.includes('研究生') || allText.includes('考试')) {
    return 6 // 考研
  }
  
  return 7 // 其他
}

// 从内容中提取内容类型ID
function extractContentTypeFromContent(content: string, noteType: string): number {
  const allText = (content + ' ' + noteType).toLowerCase()
  
  if (allText.includes('测评') || allText.includes('评测') || allText.includes('对比')) {
    return 1 // 测评内容
  }
  if (allText.includes('推荐') || allText.includes('营销') || allText.includes('种草')) {
    return 2 // 推荐/营销
  }
  if (allText.includes('干货') || allText.includes('攻略') || allText.includes('指南') || allText.includes('教程')) {
    return 3 // 干货内容
  }
  
  return 4 // 其他
}

// 从内容中提取口吻类型ID
function extractToneFromContent(content: string, tone: string): number {
  const allText = (content + ' ' + tone).toLowerCase()
  
  if (allText.includes('素人') || allText.includes('个人') || allText.includes('分享')) {
    return 1 // 素人口吻
  }
  if (allText.includes('商家') || allText.includes('官方') || allText.includes('品牌')) {
    return 2 // 商家口吻
  }
  
  return 3 // 其他口吻
}

// 解析CSV行数据
function parseCSVRow(row: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0
  
  while (i < row.length) {
    const char = row[i]
    
    if (char === '"' && !inQuotes) {
      inQuotes = true
    } else if (char === '"' && inQuotes) {
      if (i + 1 < row.length && row[i + 1] === '"') {
        // 双引号转义
        current += '"'
        i++
      } else {
        inQuotes = false
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
    
    i++
  }
  
  result.push(current.trim())
  return result
}

// 解析标签字符串
function parseTags(tagsStr: string): string[] {
  if (!tagsStr || tagsStr.trim() === '') {
    return []
  }
  
  // 提取#标签
  const hashtagMatches = tagsStr.match(/#([^#\s]+)/g)
  if (hashtagMatches) {
    return hashtagMatches.map(tag => tag.replace('#', '').trim()).filter(tag => tag.length > 0)
  }
  
  // 如果没有#标签，尝试按行分割
  const lines = tagsStr.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  if (lines.length > 1) {
    return lines.map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(tag => tag.length > 0)
  }
  
  // 最后尝试按逗号分割
  return tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
}

// POST方法：导入CSV数据
export async function POST(request: NextRequest) {
  try {
    // 检查管理员认证
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // 验证请求体
    if (!body.csvData || typeof body.csvData !== 'string') {
      return NextResponse.json(
        { success: false, message: '请提供有效的CSV数据' },
        { status: 400 }
      )
    }

    // 解析CSV数据
    const lines = body.csvData.split('\n').filter((line: string) => line.trim().length > 0)
    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, message: 'CSV数据格式错误，至少需要标题行和一行数据' },
        { status: 400 }
      )
    }

    // 解析标题行
    const headers = parseCSVRow(lines[0])
    console.log('📋 [CSV导入] 解析到的标题行:', headers)
    
    // 查找关键字段的索引
    const titleIndex = headers.findIndex(h => h.includes('标题'))
    const contentIndex = headers.findIndex(h => h.includes('内容'))
    const tagsIndex = headers.findIndex(h => h.includes('话题') || h.includes('标签'))
    const typeIndex = headers.findIndex(h => h.includes('类型'))
    const toneIndex = headers.findIndex(h => h.includes('口吻'))
    const trackIndex = headers.findIndex(h => h.includes('赛道'))
    const authorIndex = headers.findIndex(h => h.includes('作者'))
    const linkIndex = headers.findIndex(h => h.includes('链接'))
    const imageListIndex = headers.findIndex(h => h.includes('图片地址'))
    const singleImageIndex = headers.findIndex(h => h === '图片')

    if (titleIndex === -1 || contentIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'CSV数据缺少必需的标题或内容列' },
        { status: 400 }
      )
    }

    // 解析数据行
    const validContents: ExplosiveContentInsert[] = []
    const invalidContents: any[] = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const row = parseCSVRow(lines[i])
        
        // 跳过空行或无效行
        if (row.length < Math.max(titleIndex, contentIndex) + 1) {
          continue
        }

        const title = row[titleIndex]?.trim()
        const content = row[contentIndex]?.trim()
        
        // 验证必需字段
                 if (!title || !content || title === 'title' || content === 'content') {
           invalidContents.push({
             line: i + 1,
             error: '标题或内容为空',
             title: title || '未知'
           } as any)
           continue
         }

        // 解析标签
        const tagsStr = tagsIndex !== -1 ? row[tagsIndex]?.trim() || '' : ''
        const tags = parseTags(tagsStr)

        // 获取其他字段
        const noteType = typeIndex !== -1 ? row[typeIndex]?.trim() || '' : ''
        const tone = toneIndex !== -1 ? row[toneIndex]?.trim() || '' : ''
        const track = trackIndex !== -1 ? row[trackIndex]?.trim() || '' : ''
        const author = authorIndex !== -1 ? row[authorIndex]?.trim() || null : null
        const sourceLink = linkIndex !== -1 ? row[linkIndex]?.trim() || '' : ''
        
        // 获取图片相关字段
        const imageList = imageListIndex !== -1 ? row[imageListIndex]?.trim() || '' : ''
        const singleImage = singleImageIndex !== -1 ? row[singleImageIndex]?.trim() || '' : ''
        
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

        // 自动推断赛道、内容类型和口吻
        const trackId = extractTrackFromContent(content + ' ' + track, tags)
        const contentTypeId = extractContentTypeFromContent(content + ' ' + tone, noteType)
        const toneId = extractToneFromContent(content + ' ' + tone, tone)

        // 构建导入数据
        const importData: ExplosiveContentInsert = {
          title,
          content,
          tags,
          track_id: trackId,
          type_id: contentTypeId,
          tone_id: toneId,
          note_url: sourceLink || null,
          cover_image: coverImage,
          author_name: finalAuthor,
          status: 'enabled'
        }

        validContents.push(importData)

             } catch (error) {
         invalidContents.push({
           line: i + 1,
           error: error instanceof Error ? error.message : '解析失败',
           title: '解析错误'
         } as any)
       }
    }

    console.log('📋 [CSV导入] 解析结果:', {
      total: lines.length - 1,
      valid: validContents.length,
      invalid: invalidContents.length
    })

    // 如果没有有效数据，返回错误
    if (validContents.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: '没有有效的数据可以导入',
          invalid_contents: invalidContents 
        },
        { status: 400 }
      )
    }

    // 批量导入数据
    const result = await batchCreateExplosiveContents(validContents)
    
    if (result.error) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'CSV数据导入成功',
      data: {
        ...result.data,
        invalid_contents: invalidContents
      }
    })

  } catch (error) {
    console.error('❌ [CSV导入] 导入失败:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 