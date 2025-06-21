import { NextRequest, NextResponse } from 'next/server'
import { getUserMembershipStatus } from '@/lib/mysql'
import { getProfile } from '@/lib/mysql'

export async function GET(request: NextRequest) {
  try {
    // 从cookie中获取用户ID（这里假设有认证中间件设置了用户信息）
    const authCookie = request.cookies.get('auth_user_id')
    
    if (!authCookie) {
      return NextResponse.json(
        { success: false, message: '未登录' },
        { status: 401 }
      )
    }
    
    const userId = authCookie.value
    
    // 获取用户会员状态
    const membershipResult = await getUserMembershipStatus(userId)
    
    if (membershipResult.error) {
      return NextResponse.json(
        { success: false, message: membershipResult.error },
        { status: 500 }
      )
    }
    
    // 如果没有找到用户，尝试从profiles表获取基本信息
    if (!membershipResult.data) {
      const profileResult = await getProfile(userId)
      if (profileResult.error) {
        return NextResponse.json(
          { success: false, message: '用户不存在' },
          { status: 404 }
        )
      }
      
      // 返回非会员状态
      return NextResponse.json({
        success: true,
        data: {
          user_id: userId,
          email: profileResult.data.email,
          display_name: profileResult.data.display_name,
          credits: profileResult.data.credits,
          membership_type: null,
          membership_status: null,
          membership_start: null,
          membership_end: null,
          is_active_member: false,
          is_yearly_member: false,
          is_monthly_member: false
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      data: membershipResult.data
    })
    
  } catch (error) {
    console.error('获取会员状态错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 