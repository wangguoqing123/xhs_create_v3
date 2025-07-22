import { NextRequest, NextResponse } from 'next/server'
import { getUserMembershipStatus } from '@/lib/mysql'
import { getProfile } from '@/lib/mysql'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 从Cookie中获取JWT令牌进行用户认证（与其他API保持一致）
    const token = request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: '未登录' },
        { status: 401 }
      )
    }
    
    // 验证JWT令牌
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: '用户认证失败' },
        { status: 401 }
      )
    }
    
    const userId = payload.userId
    
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
      
      // 返回非会员状态 - 完整的数据结构
      return NextResponse.json({
        success: true,
        data: {
          user_id: userId,
          email: profileResult.data.email,
          display_name: profileResult.data.display_name,
          credits: profileResult.data.credits,
          membership_type: null,
          membership_level: null,
          membership_duration: null,
          membership_status: null,
          membership_start: null,
          membership_end: null,
          monthly_credits: null,
          last_credits_reset: null,
          next_credits_reset: null,
          is_active_member: false,
          is_lite_member: false,
          is_pro_member: false,
          is_premium_member: false,
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