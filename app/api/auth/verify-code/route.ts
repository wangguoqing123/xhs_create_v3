import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailCode } from '@/lib/mysql'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()
    
    if (!email || !code) {
      return NextResponse.json({
        success: false,
        error: '邮箱和验证码不能为空'
      }, { status: 400 })
    }
    
    const result = await verifyEmailCode(email, code)
    
    if (result.user) {
      // 生成JWT令牌
      const token = generateToken(result.user)
      
      // 创建响应
      const response = NextResponse.json({
        success: true,
        message: '登录成功',
        user: {
          id: result.user.id,
          email: result.user.email,
          display_name: result.user.display_name
        }
      })
      
      // 设置HttpOnly Cookie
      console.log('🔍 [API] 设置Cookie调试:')
      console.log('- JWT Token长度:', token.length)
      console.log('- 环境:', process.env.NODE_ENV)
      console.log('- Secure设置:', process.env.NODE_ENV === 'production')
      
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7天
      })
      
      console.log('✅ [API] Cookie已设置')
      
      return response
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || '验证失败'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('验证码验证失败:', error)
    return NextResponse.json({
      success: false,
      error: '验证失败'
    }, { status: 500 })
  }
} 