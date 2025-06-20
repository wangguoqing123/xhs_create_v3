import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getCreditHistory } from '@/lib/mysql'
import type { CreditHistoryParams } from '@/lib/types'

// GET 获取积分账单记录
export async function GET(request: NextRequest) {
  try {
    // 从Cookie中获取JWT令牌
    const token = request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: '未提供认证信息' 
      }, { status: 401 })
    }

    // 验证JWT令牌
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ 
        success: false, 
        error: '用户认证失败' 
      }, { status: 401 })
    }

    const userId = payload.userId

    // 从URL参数中获取筛选条件
    const { searchParams } = new URL(request.url)
    const transaction_type = searchParams.get('transaction_type') as 'reward' | 'consume' | 'refund' | 'all' | null
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 构建查询参数
    const params: CreditHistoryParams = {
      user_id: userId,
      transaction_type: transaction_type || undefined,
      start_date: start_date || undefined,
      end_date: end_date || undefined,
      limit,
      offset
    }

    // 获取积分账单数据
    const result = await getCreditHistory(params)
    
    if (result.error) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: result.data 
    })
  } catch (error) {
    console.error('获取积分账单失败:', error)
    return NextResponse.json({ 
      success: false, 
      error: '服务器错误' 
    }, { status: 500 })
  }
} 