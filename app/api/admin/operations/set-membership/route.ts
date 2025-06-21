import { NextRequest, NextResponse } from 'next/server'
import { adminSetMonthlyMembership, adminSetYearlyMembership } from '@/lib/mysql'
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
    
    const { user_id, membership_type, reason } = await request.json()
    
    if (!user_id || !membership_type) {
      return NextResponse.json(
        { success: false, message: '用户ID和会员类型不能为空' },
        { status: 400 }
      )
    }
    
    if (!['monthly', 'yearly'].includes(membership_type)) {
      return NextResponse.json(
        { success: false, message: '会员类型无效' },
        { status: 400 }
      )
    }
    
    // 获取客户端信息
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // 执行设置会员操作
    let result
    if (membership_type === 'monthly') {
      result = await adminSetMonthlyMembership(
        user_id,
        'admin',
        reason,
        ipAddress,
        userAgent
      )
    } else {
      result = await adminSetYearlyMembership(
        user_id,
        'admin',
        reason,
        ipAddress,
        userAgent
      )
    }
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      )
    }
    
    const membershipTypeName = membership_type === 'monthly' ? '月会员' : '年会员'
    return NextResponse.json({
      success: true,
      message: `成功设置用户为${membershipTypeName}`
    })
    
  } catch (error) {
    console.error('设置会员错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 