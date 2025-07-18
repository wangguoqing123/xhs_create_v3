import { NextRequest, NextResponse } from 'next/server'
import { updateExplosiveContent, deleteExplosiveContent, getExplosiveContentById } from '@/lib/mysql'
import { cookies } from 'next/headers'

// 检查管理员认证
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  return adminAuth?.value === 'authenticated'
}

// GET方法：获取单个爆款内容
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    // 验证管理员权限
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const contentId = params.id
    
    // 获取爆款内容
    const { data: content, error } = await getExplosiveContentById(contentId)
    
    if (error) {
      return NextResponse.json(
        { error: error },
        { status: 500 }
      )
    }

    if (!content) {
      return NextResponse.json(
        { error: '内容不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: content
    })

  } catch (error) {
    console.error('获取爆款内容失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// PUT方法：更新爆款内容
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    // 验证管理员权限
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const contentId = params.id
    const body = await request.json()
    
    // 更新爆款内容
    const { data: content, error } = await updateExplosiveContent(contentId, body)
    
    if (error) {
      return NextResponse.json(
        { error: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: content
    })

  } catch (error) {
    console.error('更新爆款内容失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// DELETE方法：删除爆款内容
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    // 验证管理员权限
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const contentId = params.id
    
    // 删除爆款内容
    const { error } = await deleteExplosiveContent(contentId)
    
    if (error) {
      return NextResponse.json(
        { error: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '删除成功'
    })

  } catch (error) {
    console.error('删除爆款内容失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// PATCH方法：审核操作（启用/禁用）
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    // 验证管理员权限
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const contentId = params.id
    const body = await request.json()
    const { action } = body // 'approve' 或 'disable'
    
    // 根据操作类型设置状态
    const status = action === 'approve' ? 'enabled' : 'disabled'
    
    // 更新爆款内容状态
    const { data: content, error } = await updateExplosiveContent(contentId, { status })
    
    if (error) {
      return NextResponse.json(
        { error: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: content,
      message: action === 'approve' ? '已审核通过' : '已禁用'
    })

  } catch (error) {
    console.error('审核操作失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 