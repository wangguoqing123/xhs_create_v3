import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getRewriteRecordList } from '@/lib/mysql'

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

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') as 'generating' | 'completed' | 'failed' | undefined
    const sourceType = searchParams.get('source_type') as 'link' | 'text' | undefined
    const startDate = searchParams.get('start_date') || undefined
    const endDate = searchParams.get('end_date') || undefined

    console.log('🔍 [改写历史API] 开始获取用户改写记录:', {
      userId,
      limit,
      offset,
      status,
      sourceType,
      startDate,
      endDate,
      paramTypes: {
        userId: typeof userId,
        limit: typeof limit,
        offset: typeof offset
      }
    })

    // 确保参数类型正确
    if (isNaN(limit) || isNaN(offset)) {
      return NextResponse.json(
        { error: '分页参数格式错误' },
        { status: 400 }
      )
    }

    // 调用数据库函数获取改写记录列表
    console.log('🔍 [改写历史API] 调用getRewriteRecordList参数:', {
      user_id: userId,
      limit,
      offset,
      status,
      source_type: sourceType,
      start_date: startDate,
      end_date: endDate
    })

    const { data: records, total, error } = await getRewriteRecordList({
      user_id: userId,
      limit,
      offset,
      status,
      source_type: sourceType,
      start_date: startDate,
      end_date: endDate
    })

    console.log('📊 [改写历史API] getRewriteRecordList返回结果:', {
      recordsCount: records?.length || 0,
      total,
      error,
      hasError: !!error
    })

    if (error) {
      console.error('❌ [改写历史API] 获取改写记录失败:', error)
      return NextResponse.json(
        { error: '获取改写记录失败', details: error },
        { status: 500 }
      )
    }

    console.log('✅ [改写历史API] 改写记录获取成功:', {
      recordsCount: records.length,
      total
    })

    return NextResponse.json({
      success: true,
      data: records,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + records.length < total
      }
    })

  } catch (error) {
    console.error('❌ [改写历史API] API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 支持CORS预检请求
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
} 