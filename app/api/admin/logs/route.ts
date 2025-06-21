import { NextRequest, NextResponse } from 'next/server'
import { getAdminOperationLogs } from '@/lib/mysql'
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // 获取操作日志
    const result = await getAdminOperationLogs(limit, offset)
    
    if (result.error) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total
    })
    
  } catch (error) {
    console.error('获取操作日志错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 