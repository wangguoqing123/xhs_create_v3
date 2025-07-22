import { NextRequest, NextResponse } from 'next/server'
import { checkAndResetUserCredits } from '@/lib/mysql'

export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json()
    
    if (!user_id) {
      return NextResponse.json(
        { success: false, message: '用户ID不能为空' },
        { status: 400 }
      )
    }
    
    // 调用积分重置检查函数
    const result = await checkAndResetUserCredits(user_id)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '积分检查完成',
        data: result.data
      })
    } else {
      // 即使检查失败，也不返回错误状态，避免影响用户体验
      return NextResponse.json({
        success: true,
        message: '积分检查完成（可能无需重置）'
      })
    }
    
  } catch (error) {
    console.error('积分重置检查错误:', error)
    // 静默处理错误，返回成功状态，不影响用户体验
    return NextResponse.json({
      success: true,
      message: '积分检查完成'
    })
  }
} 