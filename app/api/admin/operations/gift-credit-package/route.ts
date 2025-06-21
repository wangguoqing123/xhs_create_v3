import { NextRequest, NextResponse } from 'next/server'
import { adminGrantCreditPackage } from '@/lib/mysql'
import { cookies } from 'next/headers'

// 检查管理员认证
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  return adminAuth?.value === 'authenticated'
}

export async function POST(request: NextRequest) {
  try {
    // 检查管理员认证
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      )
    }
    
    const { user_id, credits_amount, reason } = await request.json()
    
    if (!user_id || !credits_amount) {
      return NextResponse.json(
        { success: false, message: '用户ID和积分数量不能为空' },
        { status: 400 }
      )
    }
    
    if (credits_amount <= 0) {
      return NextResponse.json(
        { success: false, message: '积分数量必须大于0' },
        { status: 400 }
      )
    }
    
    // 获取客户端信息
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // 执行赠送积分包操作
    const result = await adminGrantCreditPackage(
      user_id,
      credits_amount,
      'admin',
      reason,
      ipAddress,
      userAgent
    )
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `成功为用户赠送 ${credits_amount} 积分包`
    })
    
  } catch (error) {
    console.error('赠送积分包错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 