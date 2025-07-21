import { NextRequest, NextResponse } from 'next/server'
import { 
  getNewExplosiveContentList,
  createNewExplosiveContent,
  getNoteTrackList,
  getNoteTypeList,
  getNoteToneList
} from '@/lib/mysql-explosive-contents'
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
    const trackId = searchParams.get('track_id')
    const typeId = searchParams.get('type_id')
    const toneId = searchParams.get('tone_id')
    
    const params: ExplosiveContentListParams = {
      track_id: trackId ? [parseInt(trackId)] : undefined,
      type_id: typeId ? [parseInt(typeId)] : undefined,
      tone_id: toneId ? [parseInt(toneId)] : undefined,
      status: searchParams.get('status') as any || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      search: searchParams.get('search') || undefined
    }

    // 获取爆款内容列表
    const result = await getNewExplosiveContentList(params)
    
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
    if (!body.title || !body.content || body.track_id === undefined || body.type_id === undefined) {
      return NextResponse.json(
        { success: false, message: '标题、内容、赛道和类型为必填项' },
        { status: 400 }
      )
    }

    // 准备创建数据
    const insertData: ExplosiveContentInsert = {
      title: body.title,
      content: body.content,
      tags: body.tags || [],
      track_id: parseInt(body.track_id),
      type_id: parseInt(body.type_id),
      tone_id: parseInt(body.tone_id) || 0,
      cover_image: body.cover_image || null,
      original_cover_url: body.original_cover_url || null,
      author_name: body.author_name || null,
      author_id: body.author_id || null,
      author_avatar: body.author_avatar || null,
      likes_count: parseInt(body.likes_count) || 0,
      collects_count: parseInt(body.collects_count) || 0,
      comments_count: parseInt(body.comments_count) || 0,
      note_url: body.note_url || null,
      note_id: body.note_id || null,
      published_at: body.published_at || null,
      status: body.status || 'enabled'
    }

    // 创建爆款内容
    const result = await createNewExplosiveContent(insertData)
    
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