import { NextRequest, NextResponse } from 'next/server'
import { 
  getExplosiveContentsNeedCoverUpdate, 
  updateExplosiveContentCover, 
  createCoverUpdateLog 
} from '@/lib/mysql'
import { fetchXiaohongshuNoteDetail } from '@/lib/coze-api'

// 管理员认证检查函数
async function checkAdminAuth(): Promise<boolean> {
  // 简单的管理员认证检查
  // 在实际生产环境中，这里应该有更严格的认证逻辑
  return true // 暂时返回true，允许访问
}

/**
 * 批量更新爆款内容封面 API
 * POST /api/admin/explosive-contents/batch-update-covers
 */
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
    const { 
      batchSize = 50, // 每批处理数量
      cookieStr // 小红书Cookie
    } = body

    // 验证必需参数
    if (!cookieStr) {
      return NextResponse.json(
        { success: false, message: '请提供小红书Cookie' },
        { status: 400 }
      )
    }

    console.log('🚀 [批量更新封面] 开始处理:', { batchSize })

    // 获取需要更新封面的内容
    const { data: contents, error: fetchError } = await getExplosiveContentsNeedCoverUpdate(batchSize)
    
    if (fetchError || !contents) {
      return NextResponse.json(
        { success: false, message: fetchError || '获取待更新内容失败' },
        { status: 500 }
      )
    }

    if (contents.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有需要更新封面的内容',
        data: {
          total: 0,
          success: 0,
          failed: 0,
          details: []
        }
      })
    }

    console.log('📋 [批量更新封面] 找到待更新内容:', contents.length)

    // 批量处理结果
    const results = {
      total: contents.length,
      success: 0,
      failed: 0,
      details: [] as any[]
    }

    // 逐个处理每个内容
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i]
      const sourceUrls = content.source_urls || []
      
      console.log(`🔄 [批量更新封面] 处理第 ${i + 1}/${contents.length} 个: ${content.title}`)

      try {
        // 如果没有源链接，跳过
        if (sourceUrls.length === 0) {
          results.failed++
          results.details.push({
            id: content.id,
            title: content.title,
            status: 'failed',
            error: '没有源链接'
          })
          continue
        }

        // 取第一个链接尝试获取封面
        const sourceUrl = sourceUrls[0]
        
        // 验证是否为小红书链接（支持短链接和完整链接）
        if (!sourceUrl.includes('xiaohongshu.com') && !sourceUrl.includes('xhslink.com')) {
          results.failed++
          results.details.push({
            id: content.id,
            title: content.title,
            status: 'failed',
            error: '不是有效的小红书链接'
          })
          continue
        }

        // 调用API获取笔记详情
        console.log('🔍 [批量更新封面] 获取笔记详情:', sourceUrl)
        const noteDetail = await fetchXiaohongshuNoteDetail(sourceUrl, cookieStr)
        
        // 提取封面图片
        const coverImage = noteDetail.note_image_list && noteDetail.note_image_list.length > 0 
          ? noteDetail.note_image_list[0] 
          : null

        if (!coverImage) {
          results.failed++
          results.details.push({
            id: content.id,
            title: content.title,
            status: 'failed',
            error: '未找到封面图片'
          })
          continue
        }

        // 更新数据库
        const { error: updateError } = await updateExplosiveContentCover(content.id, coverImage)
        
        if (updateError) {
          results.failed++
          results.details.push({
            id: content.id,
            title: content.title,
            status: 'failed',
            error: `数据库更新失败: ${updateError}`
          })
          continue
        }

        // 成功处理
        results.success++
        results.details.push({
          id: content.id,
          title: content.title,
          status: 'success',
          oldCover: content.cover_image,
          newCover: coverImage,
          sourceUrl: sourceUrl
        })

        console.log('✅ [批量更新封面] 处理成功:', {
          title: content.title,
          coverImage: coverImage.substring(0, 50) + '...'
        })

        // 添加延迟避免请求过于频繁
        if (i < contents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

      } catch (error) {
        console.error('❌ [批量更新封面] 处理失败:', error)
        results.failed++
        results.details.push({
          id: content.id,
          title: content.title,
          status: 'failed',
          error: error instanceof Error ? error.message : '处理失败'
        })
      }
    }

            // 记录处理日志
        await createCoverUpdateLog(results.total, results.success, results.failed, results.details)

    console.log('🎉 [批量更新封面] 处理完成:', results)

    return NextResponse.json({
      success: true,
      message: '批量更新完成',
      data: results
    })

  } catch (error) {
    console.error('❌ [批量更新封面] API错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}

/**
 * 获取需要更新封面的内容列表
 * GET /api/admin/explosive-contents/batch-update-covers
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 [获取待更新封面内容] API开始处理')
    
    // 检查管理员认证
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      console.log('❌ [获取待更新封面内容] 认证失败')
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    
    console.log('🔍 [获取待更新封面内容] 参数:', { limit })

    // 获取需要更新封面的内容
    const { data: contents, error } = await getExplosiveContentsNeedCoverUpdate(limit)
    
    if (error) {
      console.error('❌ [获取待更新封面内容] 数据库查询失败:', error)
      return NextResponse.json(
        { success: false, message: error },
        { status: 500 }
      )
    }

    console.log('✅ [获取待更新封面内容] 查询成功:', contents?.length || 0)
    
    return NextResponse.json({
      success: true,
      data: {
        total: contents?.length || 0,
        contents: contents || []
      }
    })

  } catch (error) {
    console.error('❌ [获取待更新封面内容] API错误:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
} 