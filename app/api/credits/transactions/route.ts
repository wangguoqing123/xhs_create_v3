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

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // 可选的交易类型过滤

    // 计算偏移量
    const offset = (page - 1) * limit

    // 构建查询
    let query = supabase
      .from('credit_transactions')
      .select(`
        id,
        transaction_type,
        amount,
        reason,
        created_at,
        related_task_id,
        batch_tasks!credit_transactions_related_task_id_fkey (
          task_name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 如果指定了交易类型，添加过滤条件
    if (type && ['reward', 'consume', 'refund'].includes(type)) {
      query = query.eq('transaction_type', type)
    }

    const { data: transactions, error: transactionError } = await query

    if (transactionError) {
      console.error('获取积分交易记录失败:', transactionError)
      return NextResponse.json(
        { error: '获取交易记录失败' },
        { status: 500 }
      )
    }

    // 获取总数（用于分页）
    let countQuery = supabase
      .from('credit_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (type && ['reward', 'consume', 'refund'].includes(type)) {
      countQuery = countQuery.eq('transaction_type', type)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('获取交易记录总数失败:', countError)
      return NextResponse.json(
        { error: '获取记录总数失败' },
        { status: 500 }
      )
    }

    // 格式化交易记录
    const formattedTransactions = transactions?.map(transaction => ({
      id: transaction.id,
      type: transaction.transaction_type,
      amount: transaction.amount,
      reason: transaction.reason,
      created_at: transaction.created_at,
      task_name: (transaction as any).batch_tasks?.task_name || null
    }))

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('获取积分交易记录失败:', error)
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