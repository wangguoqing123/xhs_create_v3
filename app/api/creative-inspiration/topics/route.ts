import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getCreativeInspirationTopicsBySession } from '@/lib/mysql'

/**
 * 获取创作灵感主题 API
 * POST /api/creative-inspiration/topics
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

    // 解析请求体
    const body = await req.json()
    const { session_id } = body

    // 参数验证
    if (!session_id) {
      return NextResponse.json(
        { error: '会话ID不能为空' },
        { status: 400 }
      )
    }

    console.log('🔍 [获取会话主题] 请求参数:', {
      session_id
    })

    // 调用数据库函数获取主题
    const result = await getCreativeInspirationTopicsBySession(session_id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    console.log('✅ [获取会话主题] 成功:', result.data?.length || 0, '个主题')

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('❌ [获取会话主题] 失败:', error)
    
    const errorMessage = error instanceof Error ? error.message : '获取主题失败'
    
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