import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getProfile, getCreditTransactions } from '@/lib/mysql'
import type { CreditTransaction } from '@/lib/types'

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

    // 获取用户当前积分
    const { data: profile, error: profileError } = await getProfile(userId)
    if (profileError || !profile) {
      console.error('获取用户积分失败:', profileError)
      return NextResponse.json(
        { error: '获取积分信息失败' },
        { status: 500 }
      )
    }

    // 获取积分交易记录
    const { data: transactions, error: transactionError } = await getCreditTransactions(userId)
    if (transactionError) {
      console.error('获取积分记录失败:', transactionError)
      return NextResponse.json(
        { error: '获取积分记录失败' },
        { status: 500 }
      )
    }

    // 计算统计数据
    let totalEarned = 0
    let totalConsumed = 0

    transactions?.forEach((transaction: CreditTransaction) => {
      if (transaction.amount > 0) {
        totalEarned += transaction.amount
      } else {
        totalConsumed += Math.abs(transaction.amount)
      }
    })

    return NextResponse.json({
      current: profile.credits,
      total_earned: totalEarned,
      total_consumed: totalConsumed
    })

  } catch (error) {
    console.error('获取积分余额失败:', error)
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