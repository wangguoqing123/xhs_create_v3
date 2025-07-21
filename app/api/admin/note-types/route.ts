import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getNoteTypeList } from '@/lib/mysql-explosive-contents'

// 检查管理员认证
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  return adminAuth?.value === 'authenticated'
}

// GET方法：获取笔记类型列表
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

    // 获取类型列表
    const result = await getNoteTypeList()
    
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
    console.error('获取笔记类型列表错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 