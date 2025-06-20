import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getProfile } from '@/lib/mysql'
import { fetchXiaohongshuNoteDetail, convertXiaohongshuNoteDetailToNoteDetail } from '@/lib/coze-api'

/**
 * 获取笔记详情 API
 * POST /api/note-detail
 */
export async function POST(req: NextRequest) {
  try {
    // 从Cookie中获取JWT令牌进行用户认证
    const token = req.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: '未提供认证信息' },
        { status: 401 }
      )
    }

    // 验证JWT令牌
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: '用户认证失败' },
        { status: 401 }
      )
    }

    const userId = payload.userId

    // 解析请求体
    const body = await req.json()
    const { noteUrl, cookieStr } = body

    // 参数验证
    if (!noteUrl) {
      return NextResponse.json(
        { error: '笔记URL不能为空' },
        { status: 400 }
      )
    }

    // 如果没有提供cookieStr，尝试从用户profile获取
    let userCookie = cookieStr
    if (!userCookie) {
      const { data: profile, error: profileError } = await getProfile(userId)
      if (profileError || !profile?.user_cookie) {
        return NextResponse.json(
          { error: '用户Cookie未设置，请先在设置中配置Cookie' },
          { status: 400 }
        )
      }
      userCookie = profile.user_cookie
    }

    // 记录请求日志
    console.log('接收到笔记详情请求:', {
      userId,
      noteUrl,
      hasCookie: !!userCookie,
      cookieLength: userCookie.length
    })

    // 调用API获取笔记详情
    const xiaohongshuNoteDetail = await fetchXiaohongshuNoteDetail(noteUrl, userCookie)
    
    // 转换为统一格式
    const noteDetail = convertXiaohongshuNoteDetailToNoteDetail(xiaohongshuNoteDetail)

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: noteDetail
    })

  } catch (error) {
    // 错误处理
    console.error('获取笔记详情失败:', error)
    
    const errorMessage = error instanceof Error ? error.message : '获取笔记详情失败'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false 
      },
      { status: 500 }
    )
  }
}

/**
 * 处理OPTIONS请求（CORS预检请求）
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 