import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/mysql'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '用户名和密码不能为空' },
        { status: 400 }
      )
    }
    
    // 验证管理员身份
    const authResult = await authenticateAdmin(username, password)
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      )
    }
    
    // 设置管理员认证cookie
    const cookieStore = await cookies()
    cookieStore.set('admin_auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8 // 8小时
    })
    
    return NextResponse.json({
      success: true,
      message: '登录成功'
    })
    
  } catch (error) {
    console.error('管理员登录错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 