import { NextRequest, NextResponse } from 'next/server'
import { getExplosiveContentById, updateExplosiveContent, deleteExplosiveContent } from '@/lib/mysql'
import { cookies } from 'next/headers'
import type { ExplosiveContentUpdate } from '@/lib/types'

// 检查管理员认证
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  return adminAuth?.value === 'authenticated'
}

// GET方法：获取单个爆款内容
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 检查管理员认证
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      )
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少内容ID' },
        { status: 400 }
      )
    }

    // 获取爆款内容
    const result = await getExplosiveContentById(id)
    
    if (result.error) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: result.error === '爆款内容不存在' ? 404 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('获取爆款内容错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}

// PUT方法：更新爆款内容
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 检查管理员认证
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      )
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少内容ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // 准备更新数据
    const updateData: ExplosiveContentUpdate = {}
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.content !== undefined) updateData.content = body.content
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.industry !== undefined) updateData.industry = body.industry
    if (body.content_type !== undefined) updateData.content_type = body.content_type
    if (body.source_urls !== undefined) updateData.source_urls = body.source_urls
    if (body.cover_image !== undefined) updateData.cover_image = body.cover_image
    if (body.likes !== undefined) updateData.likes = parseInt(body.likes) || 0
    if (body.views !== undefined) updateData.views = parseInt(body.views) || 0
    if (body.author !== undefined) updateData.author = body.author
    if (body.status !== undefined) updateData.status = body.status

    // 更新爆款内容
    const result = await updateExplosiveContent(id, updateData)
    
    if (result.error) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: result.error === '内容不存在' ? 404 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '爆款内容更新成功',
      data: result.data
    })

  } catch (error) {
    console.error('更新爆款内容错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}

// DELETE方法：删除爆款内容
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 检查管理员认证
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      )
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少内容ID' },
        { status: 400 }
      )
    }

    // 删除爆款内容
    const result = await deleteExplosiveContent(id)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: result.error === '内容不存在' ? 404 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '爆款内容删除成功'
    })

  } catch (error) {
    console.error('删除爆款内容错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 