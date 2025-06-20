import { NextRequest, NextResponse } from 'next/server'
import { testEmailConfig, isEmailConfigured } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [邮件测试] 开始测试邮件配置')
    
    // 检查邮件是否配置
    if (!isEmailConfigured()) {
      return NextResponse.json({
        success: false,
        configured: false,
        error: '邮件服务未配置，请设置 SMTP_USER 和 SMTP_PASSWORD 环境变量'
      }, { status: 400 })
    }
    
    // 测试邮件配置
    const result = await testEmailConfig()
    
    return NextResponse.json({
      success: result.success,
      configured: true,
      error: result.error,
      message: result.success ? 'SMTP配置验证成功' : 'SMTP配置验证失败'
    })
    
  } catch (error) {
    console.error('❌ [邮件测试] 测试异常:', error)
    return NextResponse.json({
      success: false,
      configured: isEmailConfigured(),
      error: '测试过程中发生异常'
    }, { status: 500 })
  }
} 