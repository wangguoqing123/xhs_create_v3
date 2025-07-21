import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getProfile } from '@/lib/mysql'

export async function GET(request: NextRequest) {
  try {
    // 从Cookie中获取令牌
    const token = request.cookies.get('auth_token')?.value
    
    // 调试信息
    console.log('🔍 [API] /api/auth/me 请求调试:')
    console.log('- 请求URL:', request.url)
    console.log('- 请求Headers:', Object.fromEntries(request.headers.entries()))
    console.log('- 所有Cookies:', Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value])))
    console.log('- auth_token存在:', !!token)
    console.log('- token长度:', token?.length || 0)
    console.log('- Cookie字符串:', request.headers.get('cookie'))
    
    if (!token) {
      console.log('❌ [API] 未找到auth_token Cookie')
      return NextResponse.json({
        success: false,
        error: '未登录'
      }, { status: 401 })
    }
    
    // 验证JWT令牌
    console.log('🔍 [API] 开始验证JWT令牌')
    const payload = verifyToken(token)
    console.log('- JWT验证结果:', !!payload)
    console.log('- JWT载荷:', payload)
    
    if (!payload) {
      console.log('❌ [API] JWT令牌验证失败')
      return NextResponse.json({
        success: false,
        error: '令牌无效'
      }, { status: 401 })
    }
    
    // 获取用户资料
    const result = await getProfile(payload.userId)
    
    if (result.data) {
      return NextResponse.json({
        success: true,
        user: {
          id: result.data.id,
          email: result.data.email,
          display_name: result.data.display_name,
          avatar_url: result.data.avatar_url,
          user_cookie: result.data.user_cookie,
          task_indices: result.data.task_indices,
          credits: result.data.credits,
          created_at: result.data.created_at,
          updated_at: result.data.updated_at,
          last_login_at: result.data.last_login_at
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: '用户不存在'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取用户信息失败'
    }, { status: 500 })
  }
} 