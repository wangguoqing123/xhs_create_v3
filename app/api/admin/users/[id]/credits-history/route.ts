import { NextRequest, NextResponse } from 'next/server'
import { getCreditTransactions } from '@/lib/mysql'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 简单的管理员权限检查 - 可以通过检查admin登录状态来验证
    // 这里暂时跳过详细的权限验证，因为这是admin路由，应该在更高层级进行验证
    
    const { id: userId } = await params
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '用户ID不能为空' },
        { status: 400 }
      )
    }
    
    // 从URL参数获取分页信息
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // 获取用户积分交易记录
    const { data: transactions, error } = await getCreditTransactions(userId, limit, offset)
    
    if (error) {
      console.error('获取用户积分记录失败:', error)
      return NextResponse.json(
        { success: false, message: '获取积分记录失败', error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions || [],
        limit,
        offset,
        hasMore: (transactions || []).length === limit // 如果返回记录数等于limit，可能还有更多记录
      }
    })
    
  } catch (error) {
    console.error('获取用户积分记录API错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 