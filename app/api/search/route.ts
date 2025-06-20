import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getProfile } from '@/lib/mysql'
import { searchXiaohongshuNotes, convertXiaohongshuNotesToNotes } from '@/lib/coze-api'
import { SearchConfig } from '@/lib/types'

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

// POST方法处理搜索请求
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json()
    const { keywords, cookieStr, config } = body

    // 验证必要参数
    if (!keywords || typeof keywords !== 'string') {
      return NextResponse.json(
        { error: '搜索关键词不能为空' },
        { status: 400 }
      )
    }

    // 用户认证和Cookie获取
    const { userId, userCookie } = await authenticateAndGetCookie(request, cookieStr)

    // 设置默认搜索配置
    const searchConfig: SearchConfig = {
      noteType: config?.noteType ?? 0, // 默认全部类型
      sort: config?.sort ?? 0, // 默认综合排序  
      totalNumber: config?.totalNumber ?? 20 // 默认20条
    }

    // 记录搜索日志
    console.log('接收到搜索请求:', {
      userId,
      keywords,
      config: searchConfig,
      hasCookie: !!userCookie,
      cookieLength: userCookie.length
    })

    // 调用Coze API搜索小红书笔记
    const xiaohongshuNotes = await searchXiaohongshuNotes(
      keywords,
      userCookie,
      searchConfig
    )

    // 转换为统一格式
    const notes = convertXiaohongshuNotesToNotes(xiaohongshuNotes)

    // 返回搜索结果
    return NextResponse.json({
      success: true,
      data: notes,
      total: notes.length,
      config: searchConfig,
      keywords
    })

  } catch (error) {
    console.error('搜索API错误:', error)
    
    const errorMessage = error instanceof Error ? error.message : '搜索失败，请稍后重试'
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

// GET方法处理简单的搜索请求（通过URL参数）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keywords = searchParams.get('keywords')
    const cookieStr = searchParams.get('cookieStr')
    const noteType = parseInt(searchParams.get('noteType') || '0') as 0 | 1 | 2
    const sort = parseInt(searchParams.get('sort') || '0') as 0 | 1 | 2
    const totalNumber = parseInt(searchParams.get('totalNumber') || '20')

    // 验证必要参数
    if (!keywords) {
      return NextResponse.json(
        { error: '搜索关键词不能为空' },
        { status: 400 }
      )
    }

    // 用户认证和Cookie获取
    const { userId, userCookie } = await authenticateAndGetCookie(request, cookieStr || undefined)

    // 搜索配置
    const searchConfig: SearchConfig = {
      noteType,
      sort,
      totalNumber
    }

    // 记录搜索日志
    console.log('接收到GET搜索请求:', {
      userId,
      keywords,
      config: searchConfig,
      hasCookie: !!userCookie,
      cookieLength: userCookie.length
    })

    // 调用Coze API搜索小红书笔记
    const xiaohongshuNotes = await searchXiaohongshuNotes(
      keywords,
      userCookie,
      searchConfig
    )

    // 转换为统一格式
    const notes = convertXiaohongshuNotesToNotes(xiaohongshuNotes)

    // 返回搜索结果
    return NextResponse.json({
      success: true,
      data: notes,
      total: notes.length,
      config: searchConfig,
      keywords
    })

  } catch (error) {
    console.error('搜索API错误:', error)
    
    const errorMessage = error instanceof Error ? error.message : '搜索失败，请稍后重试'
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