import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { updateProfile } from '@/lib/mysql'

export async function POST(request: NextRequest) {
  try {
    // 从Cookie中获取JWT令牌
    const token = request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未提供认证信息' },
        { status: 401 }
      )
    }

    // 验证JWT令牌
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '用户认证失败' },
        { status: 401 }
      )
    }

    const userId = payload.userId

    // 解析请求体
    const body = await request.json()
    const { cookie } = body

    // 验证Cookie参数 - 允许字符串或null（用于清空Cookie）
    if (cookie !== null && typeof cookie !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Cookie参数无效' },
        { status: 400 }
      )
    }

    // 更新用户的Cookie
    const { data, error } = await updateProfile(userId, {
      user_cookie: cookie || null
    })

    if (error) {
      console.error('更新Cookie失败:', error)
      return NextResponse.json(
        { success: false, error: '更新Cookie失败' },
        { status: 500 }
      )
    }

    console.log(`✅ [更新Cookie] 用户 ${userId} Cookie更新成功`)
    
    return NextResponse.json({
      success: true,
      message: 'Cookie更新成功'
    })

  } catch (error) {
    console.error('更新Cookie异常:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 