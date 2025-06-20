import nodemailer from 'nodemailer'

// 邮件配置接口
interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  password: string
}

// QQ邮箱SMTP配置
const getEmailConfig = (): EmailConfig => {
  return {
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // 587端口使用STARTTLS
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || ''
  }
}

// 检查邮件配置是否完整
export const isEmailConfigured = (): boolean => {
  const config = getEmailConfig()
  return !!(config.user && config.password)
}

// 创建邮件传输器
const createTransporter = () => {
  const config = getEmailConfig()
  
  if (!isEmailConfigured()) {
    throw new Error('邮件服务未配置，请设置SMTP_USER和SMTP_PASSWORD环境变量')
  }
  
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password
    },
    // 添加一些可靠性配置
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5
  })
}

// 验证码邮件模板
const getVerificationEmailTemplate = (code: string, email: string) => {
  return {
    subject: '【灵感矩阵】邮箱验证码',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>邮箱验证码</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
          .code-box { background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 4px; font-family: 'Courier New', monospace; }
          .info { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">✨ 灵感矩阵</div>
            <p>您的专属创作助手</p>
          </div>
          
          <h2>邮箱验证码</h2>
          <p>您好！</p>
          <p>您正在使用邮箱 <strong>${email}</strong> 登录灵感矩阵，请使用以下验证码完成验证：</p>
          
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          
          <div class="info">
            <strong>重要提醒：</strong>
            <ul>
              <li>验证码有效期为 <strong>10分钟</strong></li>
              <li>请勿将验证码告诉他人</li>
              <li>如非本人操作，请忽略此邮件</li>
            </ul>
          </div>
          
          <p>感谢您使用灵感矩阵！</p>
          
          <div class="footer">
            <p>此邮件由系统自动发送，请勿回复</p>
            <p>© 2024 灵感矩阵 - 让创作更简单</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
【灵感矩阵】邮箱验证码

您好！

您正在使用邮箱 ${email} 登录灵感矩阵，验证码为：

${code}

重要提醒：
- 验证码有效期为10分钟
- 请勿将验证码告诉他人
- 如非本人操作，请忽略此邮件

感谢您使用灵感矩阵！

此邮件由系统自动发送，请勿回复
© 2024 灵感矩阵
    `
  }
}

// 发送验证码邮件
export const sendVerificationEmail = async (email: string, code: string): Promise<{
  success: boolean
  error?: string
}> => {
  try {
    console.log('📧 [邮件] 开始发送验证码邮件:', { email, codeLength: code.length })
    
    // 检查配置
    if (!isEmailConfigured()) {
      console.error('❌ [邮件] 邮件服务未配置')
      return {
        success: false,
        error: '邮件服务未配置，请联系管理员'
      }
    }
    
    // 创建传输器
    const transporter = createTransporter()
    
    // 获取邮件模板
    const template = getVerificationEmailTemplate(code, email)
    
    // 发送邮件
    const info = await transporter.sendMail({
      from: {
        name: '灵感矩阵',
        address: getEmailConfig().user
      },
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
    
    console.log('✅ [邮件] 验证码邮件发送成功:', {
      messageId: info.messageId,
      response: info.response,
      email
    })
    
    return { success: true }
    
  } catch (error) {
    console.error('❌ [邮件] 发送验证码邮件失败:', error)
    
    // 根据错误类型返回不同的错误信息
    let errorMessage = '发送邮件失败，请稍后重试'
    
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase()
      
      if (errorMsg.includes('authentication') || errorMsg.includes('auth')) {
        errorMessage = '邮件服务认证失败，请检查配置'
      } else if (errorMsg.includes('network') || errorMsg.includes('connect')) {
        errorMessage = '网络连接失败，请检查网络'
      } else if (errorMsg.includes('invalid') && errorMsg.includes('recipient')) {
        errorMessage = '邮箱地址无效'
      }
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

// 测试邮件配置
export const testEmailConfig = async (): Promise<{
  success: boolean
  error?: string
}> => {
  try {
    if (!isEmailConfigured()) {
      return {
        success: false,
        error: '邮件服务未配置'
      }
    }
    
    const transporter = createTransporter()
    
    // 验证SMTP连接
    await transporter.verify()
    
    console.log('✅ [邮件] SMTP配置验证成功')
    return { success: true }
    
  } catch (error) {
    console.error('❌ [邮件] SMTP配置验证失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '配置验证失败'
    }
  }
} 