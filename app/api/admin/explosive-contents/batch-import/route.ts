import { NextRequest, NextResponse } from 'next/server'
import { batchCreateExplosiveContents } from '@/lib/mysql-explosive-contents'
import { cookies } from 'next/headers'
import type { ExplosiveContentInsert } from '@/lib/types'

// 检查管理员认证
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  return adminAuth?.value === 'authenticated'
}

// POST方法：批量导入爆款内容
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
    if (!body.contents || !Array.isArray(body.contents) || body.contents.length === 0) {
      return NextResponse.json(
        { success: false, message: '请提供有效的内容数组' },
        { status: 400 }
      )
    }

    // 验证每个内容的必需字段
    const validContents: ExplosiveContentInsert[] = []
    const invalidContents: any[] = []

    body.contents.forEach((content: any, index: number) => {
      if (!content.title || !content.content || !content.industry || !content.content_type) {
        invalidContents.push({
          index,
          error: '缺少必需字段：标题、内容、行业或内容形式',
          title: content.title || '未知'
        })
        return
      }

      validContents.push({
        title: content.title,
        content: content.content,
        tags: content.tags || [],
        track_id: content.track_id || 0,
        type_id: content.type_id || 1,
        tone_id: content.tone_id || 1,
        cover_image: content.cover_image || null,
        likes_count: parseInt(content.likes) || 0,
        author_name: content.author || null,
        status: content.status || 'enabled',
        note_url: content.source_url || null
      })
    })

    // 如果有无效内容，返回错误
    if (invalidContents.length > 0 && validContents.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: '所有内容都无效', 
          invalid_contents: invalidContents 
        },
        { status: 400 }
      )
    }

    // 批量导入爆款内容
    const result = await batchCreateExplosiveContents(validContents)
    
    if (result.error) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      )
    }

    // 合并预验证失败的项目
    const finalResult = {
      ...result.data,
      failed_count: result.data!.failed_count + invalidContents.length,
      failed_items: [...result.data!.failed_items, ...invalidContents]
    }

    return NextResponse.json({
      success: true,
      message: '批量导入完成',
      data: finalResult
    })

  } catch (error) {
    console.error('批量导入爆款内容错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 