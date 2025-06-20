import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getCreditTransactions } from '@/lib/mysql'

export async function GET(request: NextRequest) {
  try {
    // 从Cookie中获取JWT令牌
    const token = request.cookies.get('auth_token')?.value
    
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

    // 从URL参数获取分页信息
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 获取积分交易记录
    const { data: transactions, error } = await getCreditTransactions(userId, limit, offset)
    
    if (error) {
      console.error('获取积分交易记录失败:', error)
      return NextResponse.json(
        { error: '获取积分交易记录失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      transactions: transactions || [],
      limit,
      offset
    })

  } catch (error) {
    console.error('获取积分交易记录API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 