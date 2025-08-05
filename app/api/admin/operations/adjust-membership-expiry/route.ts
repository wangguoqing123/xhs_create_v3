import { NextRequest, NextResponse } from 'next/server'
import { adminAdjustMembershipExpiry } from '@/lib/mysql'
import { cookies } from 'next/headers'

// 检查管理员认证
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  return adminAuth?.value === 'authenticated'
}

// 验证日期格式和有效性
function validateExpiryDate(dateString: string): { isValid: boolean; error?: string; date?: Date } {
  if (!dateString) {
    return { isValid: false, error: '到期时间不能为空' }
  }

  // 尝试解析日期
  const date = new Date(dateString)
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return { isValid: false, error: '日期格式无效' }
  }

  // 允许设置过去日期（用于测试过期会员功能）
  // 但检查日期不能太久远（比如不能早于2020年）
  const minDate = new Date('2020-01-01')
  if (date < minDate) {
    return { isValid: false, error: '到期时间不能早于2020年1月1日' }
  }

  // 检查日期是否过于遥远（比如超过10年）
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 10)
  if (date > maxDate) {
    return { isValid: false, error: '到期时间不能超过10年' }
  }

  return { isValid: true, date }
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
    
    // 解析请求体，添加错误处理
    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: '请求体格式无效，请发送有效的JSON数据' },
        { status: 400 }
      )
    }
    
    const { user_id, new_expiry_date, reason } = requestBody
    
    // 验证必需参数
    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { success: false, message: '用户ID不能为空且必须是字符串' },
        { status: 400 }
      )
    }

    if (!new_expiry_date || typeof new_expiry_date !== 'string') {
      return NextResponse.json(
        { success: false, message: '新的到期时间不能为空且必须是字符串' },
        { status: 400 }
      )
    }

    // 验证用户ID格式（UUID格式）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(user_id)) {
      return NextResponse.json(
        { success: false, message: '用户ID格式无效，必须是有效的UUID' },
        { status: 400 }
      )
    }

    // 验证原因字段（如果提供）
    if (reason !== undefined && (typeof reason !== 'string' || reason.length > 500)) {
      return NextResponse.json(
        { success: false, message: '原因必须是字符串且不能超过500个字符' },
        { status: 400 }
      )
    }

    // 验证日期格式和有效性
    const dateValidation = validateExpiryDate(new_expiry_date)
    if (!dateValidation.isValid) {
      return NextResponse.json(
        { success: false, message: dateValidation.error },
        { status: 400 }
      )
    }

    // 获取客户端信息
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // 记录操作开始日志
    console.log('🔧 [调整会员到期时间] 开始操作:', {
      user_id,
      new_expiry_date: dateValidation.date!.toISOString(),
      reason: reason || '无',
      ipAddress,
      adminUser: 'admin'
    })
    
    // 执行调整会员到期时间操作
    const result = await adminAdjustMembershipExpiry(
      user_id,
      dateValidation.date!,
      'admin',
      reason,
      ipAddress,
      userAgent
    )
    
    if (!result.success) {
      // 根据错误类型返回不同的状态码
      let statusCode = 500
      if (result.error?.includes('用户不存在')) {
        statusCode = 404
      } else if (result.error?.includes('不是活跃会员')) {
        statusCode = 400
      }
      
      return NextResponse.json(
        { success: false, message: result.error },
        { status: statusCode }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: '成功调整用户会员到期时间',
      data: {
        new_expiry_date: dateValidation.date!.toISOString(),
        previous_expiry_date: result.previousExpiryDate,
        credits_change: result.creditsChange,
        next_credits_reset: result.nextCreditsReset
      }
    })
    
  } catch (error) {
    console.error('调整会员到期时间错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}