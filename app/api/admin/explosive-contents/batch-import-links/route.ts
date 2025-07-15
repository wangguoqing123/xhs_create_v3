import { NextRequest, NextResponse } from 'next/server'
import { fetchXiaohongshuNoteDetail } from '@/lib/coze-api'
import { createExplosiveContent, getProfile } from '@/lib/mysql'
import { ExplosiveContentInsert } from '@/lib/types'
import { verifyToken } from '@/lib/auth'

// 检查管理员认证的简化版本
async function checkAdminAuth(): Promise<boolean> {
  // 这里可以添加更严格的管理员认证逻辑
  // 目前简化处理，实际项目中应该检查管理员token
  return true
}

// 获取用户Cookie的函数
async function getUserCookie(request: NextRequest): Promise<string> {
  // 从Cookie中获取JWT令牌进行用户认证
  const token = request.cookies.get('auth_token')?.value
  
  if (!token) {
    throw new Error('未提供认证信息，请先登录')
  }

  // 验证JWT令牌
  const payload = verifyToken(token)
  if (!payload) {
    throw new Error('用户认证失败，请重新登录')
  }

  const userId = payload.userId

  // 从用户profile获取保存的cookie
  const { data: profile, error: profileError } = await getProfile(userId)
  if (profileError || !profile?.user_cookie) {
    throw new Error('用户Cookie未设置，请先在设置中配置小红书Cookie')
  }

  return profile.user_cookie
}

// 从小红书笔记详情转换为爆文数据
function convertNoteDetailToExplosiveContent(noteDetail: any, sourceUrl: string): ExplosiveContentInsert {
  console.log('🔍 [转换数据] 原始笔记详情:', {
    title: noteDetail.note_display_title,
    author: noteDetail.auther_nick_name,
    content: noteDetail.note_desc?.substring(0, 100),
    tags: noteDetail.note_tags,
    images: noteDetail.note_image_list?.length,
    likes: noteDetail.note_liked_count,
    isVideo: noteDetail.note_card_type === 'video'
  })
  
  // 提取标签
  const tags = noteDetail.note_tags || []
  
  // 获取封面图片（取第一张图片）
  const coverImage = noteDetail.note_image_list && noteDetail.note_image_list.length > 0 
    ? noteDetail.note_image_list[0] 
    : null
  
  // 解析行业（默认为空，需要手动填写）
  const industry = '' // 留空，需要手动填写
  
  // 解析内容形式（根据笔记类型判断）
  let contentType: string = 'note' // 默认为笔记
  if (noteDetail.note_card_type === 'video') {
    contentType = 'video'
  } else if (noteDetail.note_desc && noteDetail.note_desc.includes('测评')) {
    contentType = 'review'
  } else if (noteDetail.note_desc && (noteDetail.note_desc.includes('攻略') || noteDetail.note_desc.includes('指南'))) {
    contentType = 'guide'
  } else if (noteDetail.note_desc && noteDetail.note_desc.includes('案例')) {
    contentType = 'case'
  }
  
  // 解析点赞数（去除逗号分隔符）
  const likeCount = parseInt(noteDetail.note_liked_count?.replace(/,/g, '') || '0') || 0
  const estimatedViews = likeCount > 0 ? Math.floor(likeCount * (3 + Math.random() * 2)) : 0
  
  // 处理内容，使用parseNoteDescription函数
  const processedContent = noteDetail.note_desc || '需要补充内容'
  
  const result = {
    title: noteDetail.note_display_title || '需要补充标题',
    content: processedContent,
    tags: tags,
    industry: industry || 'other', // 如果为空，设置为 'other'
    content_type: contentType as any,
    source_urls: [sourceUrl],
    cover_image: coverImage,
    likes: likeCount,
    views: estimatedViews,
    author: noteDetail.auther_nick_name || null,
    status: 'disabled' as const, // 默认禁用，需要管理员审核后启用
    published_at: noteDetail.note_create_time || null // 使用笔记的发布时间
  }
  
  console.log('✅ [转换数据] 转换后的爆文数据:', {
    title: result.title,
    author: result.author,
    content: result.content?.substring(0, 100),
    tags: result.tags,
    cover_image: result.cover_image,
    likes: result.likes,
    views: result.views
  })
  
  return result
}

// POST方法：批量导入小红书链接
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
    const { urls } = body
    
    // 验证必需字段
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { success: false, message: '请提供有效的小红书链接列表' },
        { status: 400 }
      )
    }

    // 自动获取用户保存的Cookie
    const cookieStr = await getUserCookie(request)

    // 处理结果统计
    const results = {
      total: urls.length,
      successful: 0,
      failed: 0,
      items: [] as any[]
    }

    // 逐个处理链接
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i].trim()
      
      try {
        // 验证链接格式
        if (!url.includes('xiaohongshu.com')) {
          throw new Error('不是有效的小红书链接')
        }

        // 调用coze接口获取笔记详情
        console.log('🔍 [批量导入] 调用coze接口获取笔记详情:', url)
        const noteDetail = await fetchXiaohongshuNoteDetail(url, cookieStr)
        console.log('✅ [批量导入] 获取笔记详情成功:', {
          id: noteDetail.note_id,
          title: noteDetail.note_display_title,
          author: noteDetail.auther_nick_name
        })
        
        // 转换为爆文数据格式
        const explosiveContentData = convertNoteDetailToExplosiveContent(noteDetail, url)
        console.log('🔍 [批量导入] 准备保存到数据库:', {
          title: explosiveContentData.title,
          author: explosiveContentData.author,
          tags: explosiveContentData.tags,
          tagsType: typeof explosiveContentData.tags,
          sourceUrls: explosiveContentData.source_urls,
          sourceUrlsType: typeof explosiveContentData.source_urls
        })
        
        // 保存到数据库
        const createResult = await createExplosiveContent(explosiveContentData)
        
        if (createResult.error) {
          throw new Error(createResult.error)
        }

        results.successful++
        results.items.push({
          url,
          status: 'success',
          id: createResult.data?.id,
          title: explosiveContentData.title,
          needsReview: true, // 标记需要审核
          missingFields: [] // 检查缺失字段
        })

        // 检查缺失字段
        const missingFields = []
        if (!explosiveContentData.industry || explosiveContentData.industry === 'other') missingFields.push('industry')
        if (!explosiveContentData.title || explosiveContentData.title === '需要补充标题') missingFields.push('title')
        if (!explosiveContentData.content || explosiveContentData.content === '需要补充内容') missingFields.push('content')
        
        results.items[results.items.length - 1].missingFields = missingFields
        results.items[results.items.length - 1].needsReview = missingFields.length > 0 || explosiveContentData.status === 'disabled'

      } catch (error) {
        results.failed++
        results.items.push({
          url,
          status: 'failed',
          error: error instanceof Error ? error.message : '导入失败'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `批量导入完成：成功 ${results.successful} 个，失败 ${results.failed} 个`,
      data: results
    })

  } catch (error) {
    console.error('批量导入链接错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 