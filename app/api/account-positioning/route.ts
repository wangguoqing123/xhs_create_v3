import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { createAccountPositioning, getAccountPositioningList } from '@/lib/mysql'
import { AccountPositioningInsert, AccountPositioningListParams } from '@/lib/types'

// GET - 获取用户的账号定位列表
export async function GET(request: NextRequest) {
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

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20') // 每页数量，默认20
    const offset = parseInt(searchParams.get('offset') || '0') // 偏移量，默认0
    const search = searchParams.get('search') || undefined // 搜索关键词

    // 构建查询参数
    const params: AccountPositioningListParams = {
      user_id: payload.userId,
      limit,
      offset,
      search
    }

    // 获取账号定位列表
    const result = await getAccountPositioningList(params)

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      pagination: {
        limit,
        offset,
        hasMore: (result.total || 0) > offset + limit // 是否还有更多数据
      }
    })

  } catch (error) {
    console.error('获取账号定位列表异常:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// POST - 创建新的账号定位
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

    // 解析请求体
    const body = await request.json()
    const { name, one_line_description, core_value, target_audience, key_persona, core_style } = body

    // 验证必填字段
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '账号定位名称不能为空' },
        { status: 400 }
      )
    }

    // 验证名称长度
    if (name.trim().length > 100) {
      return NextResponse.json(
        { success: false, error: '账号定位名称不能超过100个字符' },
        { status: 400 }
      )
    }

    // 构建插入数据
    const insertData: AccountPositioningInsert = {
      user_id: payload.userId,
      name: name.trim(),
      one_line_description: one_line_description?.trim() || null,
      core_value: core_value?.trim() || null,
      target_audience: target_audience?.trim() || null,
      key_persona: key_persona?.trim() || null,
      core_style: core_style?.trim() || null
    }

    // 创建账号定位
    const result = await createAccountPositioning(insertData)

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    console.log(`✅ [账号定位] 用户 ${payload.userId} 成功创建账号定位: ${name}`)

    return NextResponse.json({
      success: true,
      data: result.data,
      message: '账号定位创建成功'
    })

  } catch (error) {
    console.error('创建账号定位异常:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// OPTIONS - 处理CORS预检请求
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 