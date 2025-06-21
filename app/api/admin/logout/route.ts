import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // 清除管理员认证cookie
    const cookieStore = await cookies()
    cookieStore.delete('admin_auth')
    
    return NextResponse.json({
      success: true,
      message: '登出成功'
    })
    
  } catch (error) {
    console.error('管理员登出错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 