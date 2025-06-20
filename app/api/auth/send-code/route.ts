import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationCode } from '@/lib/mysql'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: '邮箱地址不能为空'
      }, { status: 400 })
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: '邮箱格式不正确'
      }, { status: 400 })
    }
    
    const result = await sendVerificationCode(email)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '验证码已发送',
        // 开发环境返回验证码，生产环境不返回
        ...(process.env.NODE_ENV === 'development' && { code: result.code })
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    return NextResponse.json({
      success: false,
      error: '发送验证码失败'
    }, { status: 500 })
  }
} 