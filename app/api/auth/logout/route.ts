import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: '已成功登出'
    })
    
    // 清除认证Cookie
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // 立即过期
    })
    
    return response
  } catch (error) {
    console.error('登出失败:', error)
    return NextResponse.json({
      success: false,
      error: '登出失败'
    }, { status: 500 })
  }
} 