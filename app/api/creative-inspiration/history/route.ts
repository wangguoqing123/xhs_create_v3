import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getCreativeInspirationHistory } from '@/lib/mysql'

/**
 * 获取创作灵感历史记录 API
 * POST /api/creative-inspiration/history
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
    const { user_id, limit, offset, status } = body

    // 验证用户权限
    if (user_id !== userId) {
      return NextResponse.json(
        { error: '无权限访问他人的历史记录' },
        { status: 403 }
      )
    }

    // 参数验证
    if (!user_id) {
      return NextResponse.json(
        { error: '用户ID不能为空' },
        { status: 400 }
      )
    }

    console.log('🔍 [获取历史记录] 请求参数:', {
      user_id,
      limit,
      offset,
      status
    })

    // 调用数据库函数获取历史记录
    const result = await getCreativeInspirationHistory({
      user_id,
      limit: limit || 10,
      offset: offset || 0,
      status: status || undefined
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    console.log('✅ [获取历史记录] 成功:', result.data.sessions.length, '条记录')

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('❌ [获取历史记录] 失败:', error)
    
    const errorMessage = error instanceof Error ? error.message : '获取历史记录失败'
    
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