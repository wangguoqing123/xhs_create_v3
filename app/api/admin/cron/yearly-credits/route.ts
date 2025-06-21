import { NextRequest, NextResponse } from 'next/server'
import { grantYearlyMemberMonthlyCredits } from '@/lib/mysql'

export async function POST(request: NextRequest) {
  try {
    // 简单的认证检查（可以根据需要添加更复杂的认证）
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer yearly-credits-cron-token') {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      )
    }
    
    // 执行年会员每月积分发放
    const result = await grantYearlyMemberMonthlyCredits()
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: '年会员每月积分发放完成',
      result: result.result
    })
    
  } catch (error) {
    console.error('年会员积分发放错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}

// 也支持GET请求，用于手动触发（仅在开发环境）
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, message: '仅在开发环境可用' },
      { status: 403 }
    )
  }
  
  try {
    // 执行年会员每月积分发放
    const result = await grantYearlyMemberMonthlyCredits()
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: '年会员每月积分发放完成',
      result: result.result
    })
    
  } catch (error) {
    console.error('年会员积分发放错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 