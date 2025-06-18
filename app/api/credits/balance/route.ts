import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// 使用单例 Supabase 客户端
const supabase = supabaseServer

export async function GET(request: NextRequest) {
  try {
    // 获取用户认证信息
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '未提供认证信息' },
        { status: 401 }
      )
    }

    // 解析Bearer token
    const token = authHeader.replace('Bearer ', '')
    
    // 获取用户信息
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData?.user) {
      return NextResponse.json(
        { error: '用户认证失败' },
        { status: 401 }
      )
    }

    const userId = userData.user.id

    // 获取用户当前积分
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('获取用户积分失败:', profileError)
      return NextResponse.json(
        { error: '获取积分信息失败' },
        { status: 500 }
      )
    }

    // 获取积分统计信息
    const { data: transactions, error: transactionError } = await supabase
      .from('credit_transactions')
      .select('transaction_type, amount')
      .eq('user_id', userId)

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

    transactions?.forEach(transaction => {
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