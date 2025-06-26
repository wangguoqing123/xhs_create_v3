import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getProfile } from '@/lib/mysql'
import { fetchAuthorNotes, convertXiaohongshuNotesToNotes } from '@/lib/coze-api'

// 用户认证和Cookie获取的通用函数
async function authenticateAndGetCookie(request: NextRequest, providedCookie?: string): Promise<{ userId: string, userCookie: string }> {
  // 从Cookie中获取JWT令牌进行用户认证
  const token = request.cookies.get('auth_token')?.value
  
  if (!token) {
    throw new Error('未提供认证信息')
  }

  // 验证JWT令牌
  const payload = verifyToken(token)
  if (!payload) {
    throw new Error('用户认证失败')
  }

  const userId = payload.userId

  // 如果没有提供cookieStr，尝试从用户profile获取
  let userCookie: string = providedCookie || ''
  if (!userCookie) {
    const { data: profile, error: profileError } = await getProfile(userId)
    if (profileError || !profile?.user_cookie) {
      throw new Error('用户Cookie未设置，请先在设置中配置Cookie')
    }
    userCookie = profile.user_cookie
  }

  return { userId, userCookie }
}

// POST方法处理作者笔记获取请求
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json()
    const { userProfileUrl, cookieStr } = body

    // 验证必要参数
    if (!userProfileUrl || typeof userProfileUrl !== 'string') {
      return NextResponse.json(
        { error: '作者链接不能为空' },
        { status: 400 }
      )
    }

    // 验证URL格式
    if (!userProfileUrl.includes('xiaohongshu.com/user/profile/')) {
      return NextResponse.json(
        { error: '请输入有效的小红书作者链接' },
        { status: 400 }
      )
    }

    // 用户认证和Cookie获取
    const { userId, userCookie } = await authenticateAndGetCookie(request, cookieStr)

    // 记录请求日志
    console.log('接收到作者笔记获取请求:', {
      userId,
      userProfileUrl,
      hasCookie: !!userCookie,
      cookieLength: userCookie.length
    })

    // 调用Coze API获取作者笔记
    const authorData = await fetchAuthorNotes(userProfileUrl, userCookie)

    // 转换为统一格式
    const notes = convertXiaohongshuNotesToNotes(authorData.notes)

    // 返回结果
    return NextResponse.json({
      success: true,
      data: {
        author_info: authorData.auther_info, // 保持原有的字段名
        notes: notes,
        total: notes.length
      },
      userProfileUrl
    })

  } catch (error) {
    console.error('作者笔记获取API错误:', error)
    
    const errorMessage = error instanceof Error ? error.message : '获取作者笔记失败，请稍后重试'
    const statusCode = errorMessage.includes('认证') || errorMessage.includes('Cookie') ? 401 : 500
    
    // 返回错误信息
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false
      },
      { status: statusCode }
    )
  }
}

// GET方法处理简单的作者笔记获取请求（通过URL参数）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userProfileUrl = searchParams.get('userProfileUrl')
    const cookieStr = searchParams.get('cookieStr')

    // 验证必要参数
    if (!userProfileUrl) {
      return NextResponse.json(
        { error: '作者链接不能为空' },
        { status: 400 }
      )
    }

    // 验证URL格式
    if (!userProfileUrl.includes('xiaohongshu.com/user/profile/')) {
      return NextResponse.json(
        { error: '请输入有效的小红书作者链接' },
        { status: 400 }
      )
    }

    // 用户认证和Cookie获取
    const { userId, userCookie } = await authenticateAndGetCookie(request, cookieStr || undefined)

    // 记录请求日志
    console.log('接收到GET作者笔记获取请求:', {
      userId,
      userProfileUrl,
      hasCookie: !!userCookie,
      cookieLength: userCookie.length
    })

    // 调用Coze API获取作者笔记
    const authorData = await fetchAuthorNotes(userProfileUrl, userCookie)

    // 转换为统一格式
    const notes = convertXiaohongshuNotesToNotes(authorData.notes)

    // 返回结果
    return NextResponse.json({
      success: true,
      data: {
        author_info: authorData.auther_info,
        notes: notes,
        total: notes.length
      },
      userProfileUrl
    })

  } catch (error) {
    console.error('作者笔记获取API错误:', error)
    
    const errorMessage = error instanceof Error ? error.message : '获取作者笔记失败，请稍后重试'
    const statusCode = errorMessage.includes('认证') || errorMessage.includes('Cookie') ? 401 : 500
    
    // 返回错误信息
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false
      },
      { status: statusCode }
    )
  }
}

// 处理OPTIONS请求（CORS预检请求）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 