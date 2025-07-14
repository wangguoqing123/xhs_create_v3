import { NextRequest, NextResponse } from 'next/server'
import { getExplosiveContentList, createExplosiveContent, getExplosiveContentStats } from '@/lib/mysql'
import { cookies } from 'next/headers'
import type { ExplosiveContentInsert, ExplosiveContentListParams } from '@/lib/types'

// 检查管理员认证
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  return adminAuth?.value === 'authenticated'
}

// GET方法：获取爆款内容列表
export async function GET(request: NextRequest) {
  try {
    // 检查管理员认证
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // 解析查询参数
    const params: ExplosiveContentListParams = {
      industry: searchParams.get('industry') as any || undefined,
      content_type: searchParams.get('content_type') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      search: searchParams.get('search') || undefined
    }

    // 获取爆款内容列表
    const result = await getExplosiveContentList(params)
    
    if (result.error) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      params
    })

  } catch (error) {
    console.error('获取爆款内容列表错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}

// POST方法：创建爆款内容
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
    
    // 验证必需字段
    if (!body.title || !body.content || !body.industry || !body.content_type) {
      return NextResponse.json(
        { success: false, message: '标题、内容、行业和内容形式为必填项' },
        { status: 400 }
      )
    }

    // 准备创建数据
    const insertData: ExplosiveContentInsert = {
      title: body.title,
      content: body.content,
      tags: body.tags || [],
      industry: body.industry,
      content_type: body.content_type,
      source_urls: body.source_urls || [],
      cover_image: body.cover_image || null,
      likes: parseInt(body.likes) || 0,
      views: parseInt(body.views) || 0,
      author: body.author || null,
      status: body.status || 'enabled'
    }

    // 创建爆款内容
    const result = await createExplosiveContent(insertData)
    
    if (result.error) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '爆款内容创建成功',
      data: result.data
    })

  } catch (error) {
    console.error('创建爆款内容错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 