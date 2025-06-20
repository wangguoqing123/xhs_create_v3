import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getAccountPositioningById, updateAccountPositioning, deleteAccountPositioning } from '@/lib/mysql'
import { AccountPositioningUpdate } from '@/lib/types'

// GET - 根据ID获取单个账号定位
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // 获取路径参数中的ID
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: '账号定位ID不能为空' },
        { status: 400 }
      )
    }

    // 获取账号定位详情
    const result = await getAccountPositioningById(id, payload.userId)

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error.includes('不存在') || result.error.includes('无权限') ? 404 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('获取账号定位详情异常:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// PUT - 更新账号定位
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // 获取路径参数中的ID
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: '账号定位ID不能为空' },
        { status: 400 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const { name, one_line_description, core_value, target_audience, key_persona, core_style } = body

    // 验证名称字段（如果提供的话）
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: '账号定位名称不能为空' },
          { status: 400 }
        )
      }
      
      if (name.trim().length > 100) {
        return NextResponse.json(
          { success: false, error: '账号定位名称不能超过100个字符' },
          { status: 400 }
        )
      }
    }

    // 构建更新数据（只包含提供的字段）
    const updateData: AccountPositioningUpdate = {}
    
    if (name !== undefined) {
      updateData.name = name.trim()
    }
    
    if (one_line_description !== undefined) {
      updateData.one_line_description = one_line_description?.trim() || null
    }
    
    if (core_value !== undefined) {
      updateData.core_value = core_value?.trim() || null
    }
    
    if (target_audience !== undefined) {
      updateData.target_audience = target_audience?.trim() || null
    }
    
    if (key_persona !== undefined) {
      updateData.key_persona = key_persona?.trim() || null
    }
    
    if (core_style !== undefined) {
      updateData.core_style = core_style?.trim() || null
    }

    // 检查是否有要更新的字段
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: '没有提供要更新的字段' },
        { status: 400 }
      )
    }

    // 更新账号定位
    const result = await updateAccountPositioning(id, payload.userId, updateData)

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error.includes('不存在') || result.error.includes('无权限') ? 404 : 500 }
      )
    }

    console.log(`✅ [账号定位] 用户 ${payload.userId} 成功更新账号定位: ${id}`)

    return NextResponse.json({
      success: true,
      data: result.data,
      message: '账号定位更新成功'
    })

  } catch (error) {
    console.error('更新账号定位异常:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// DELETE - 删除账号定位
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // 获取路径参数中的ID
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: '账号定位ID不能为空' },
        { status: 400 }
      )
    }

    // 删除账号定位
    const result = await deleteAccountPositioning(id, payload.userId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error?.includes('不存在') || result.error?.includes('无权限') ? 404 : 500 }
      )
    }

    console.log(`✅ [账号定位] 用户 ${payload.userId} 成功删除账号定位: ${id}`)

    return NextResponse.json({
      success: true,
      message: '账号定位删除成功'
    })

  } catch (error) {
    console.error('删除账号定位异常:', error)
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 