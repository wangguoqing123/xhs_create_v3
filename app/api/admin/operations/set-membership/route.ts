import { NextRequest, NextResponse } from 'next/server'
import { adminSetMembership, adminSetMonthlyMembership, adminSetYearlyMembership } from '@/lib/mysql'
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
    
    const { user_id, membership_level, membership_duration, membership_type, reason } = await request.json()
    
    if (!user_id) {
      return NextResponse.json(
        { success: false, message: '用户ID不能为空' },
        { status: 400 }
      )
    }
    
    // 获取客户端信息
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    let result
    
    // 支持新的会员体系
    if (membership_level && membership_duration) {
      // 使用新的通用接口
      if (!['lite', 'pro', 'premium'].includes(membership_level)) {
        return NextResponse.json(
          { success: false, message: '会员等级无效，必须是 lite、pro 或 premium' },
          { status: 400 }
        )
      }
      
      if (!['monthly', 'yearly'].includes(membership_duration)) {
        return NextResponse.json(
          { success: false, message: '会员时长无效，必须是 monthly 或 yearly' },
          { status: 400 }
        )
      }
      
      result = await adminSetMembership(
        user_id,
        membership_level as 'lite' | 'pro' | 'premium',
        membership_duration as 'monthly' | 'yearly',
        'admin',
        reason,
        ipAddress,
        userAgent
      )
    } 
    // 保持向后兼容性，支持旧的membership_type
    else if (membership_type) {
    if (membership_type === 'monthly') {
      result = await adminSetMonthlyMembership(
        user_id,
        'admin',
        reason,
        ipAddress,
        userAgent
      )
      } else if (membership_type === 'yearly') {
      result = await adminSetYearlyMembership(
        user_id,
        'admin',
        reason,
        ipAddress,
        userAgent
        )
      } else {
        return NextResponse.json(
          { success: false, message: '会员类型无效' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, message: '必须提供 membership_level + membership_duration 或 membership_type' },
        { status: 400 }
      )
    }
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      )
    }
    
    // 生成成功消息
    let membershipTypeName = ''
    if (membership_level && membership_duration) {
      const levelNames = {
        lite: '入门会员',
        pro: '标准会员',
        premium: '高级会员'
      }
      const durationNames = {
        monthly: '月',
        yearly: '年'
      }
      membershipTypeName = `${levelNames[membership_level as keyof typeof levelNames]}(${durationNames[membership_duration as keyof typeof durationNames]})`
    } else if (membership_type) {
      membershipTypeName = membership_type === 'monthly' ? '月会员' : '年会员'
    }
    
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