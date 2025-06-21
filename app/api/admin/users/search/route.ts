import { NextRequest, NextResponse } from 'next/server'
import { searchUsers } from '@/lib/mysql'
import { cookies } from 'next/headers'

// 检查管理员认证
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  return adminAuth?.value === 'authenticated'
}

export async function GET(request: NextRequest) {
  try {
    // 检查管理员认证
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    
    if (!searchTerm.trim()) {
      return NextResponse.json(
        { success: false, message: '搜索关键词不能为空' },
        { status: 400 }
      )
    }
    
    // 搜索用户
    const result = await searchUsers(searchTerm, limit)
    
    if (result.error) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: result.data
    })
    
  } catch (error) {
    console.error('搜索用户错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 