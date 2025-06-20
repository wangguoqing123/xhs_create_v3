import { NextResponse } from 'next/server'

// GET方法用于检查配置状态
export async function GET() {
  try {
    const cozeToken = process.env.COZE_API_TOKEN
    const cozeWorkflowId = process.env.COZE_WORKFLOW_ID
    const dbHost = process.env.DB_HOST
    const dbUser = process.env.DB_USER
    const dbPassword = process.env.DB_PASSWORD
    const dbName = process.env.DB_NAME
    const jwtSecret = process.env.JWT_SECRET

    // 检查配置状态
    const configStatus = {
      cozeApiToken: {
        configured: !!cozeToken,
        length: cozeToken?.length || 0,
        startsWithPat: cozeToken?.startsWith('pat_') || false,
        preview: cozeToken ? `${cozeToken.substring(0, 8)}...` : '未配置'
      },
      cozeWorkflowId: {
        configured: !!cozeWorkflowId,
        value: cozeWorkflowId || '未配置'
      },
      database: {
        hostConfigured: !!dbHost,
        userConfigured: !!dbUser,
        passwordConfigured: !!dbPassword,
        nameConfigured: !!dbName,
        allConfigured: !!(dbHost && dbUser && dbPassword && dbName)
      },
      auth: {
        jwtSecretConfigured: !!jwtSecret
      },
      envFileExists: true, // 如果能读到环境变量，说明文件存在
      timestamp: new Date().toISOString()
    }

    // 生成诊断信息
    const diagnostics = []
    
    if (!cozeToken) {
      diagnostics.push('❌ COZE_API_TOKEN 未配置')
    } else if (!cozeToken.startsWith('pat_')) {
      diagnostics.push('⚠️ COZE_API_TOKEN 格式可能不正确（通常以 pat_ 开头）')
    } else {
      diagnostics.push('✅ COZE_API_TOKEN 已配置')
    }

    if (!cozeWorkflowId) {
      diagnostics.push('❌ COZE_WORKFLOW_ID 未配置')
    } else {
      diagnostics.push('✅ COZE_WORKFLOW_ID 已配置')
    }

    if (!configStatus.database.allConfigured) {
      diagnostics.push('❌ 数据库配置不完整')
    } else {
      diagnostics.push('✅ 数据库已配置')
    }

    if (!jwtSecret) {
      diagnostics.push('❌ JWT_SECRET 未配置')
    } else {
      diagnostics.push('✅ JWT_SECRET 已配置')
    }

    return NextResponse.json({
      success: true,
      config: configStatus,
      diagnostics,
      recommendations: [
        '1. 确保 .env.local 文件位于项目根目录',
        '2. 配置完成后重启开发服务器',
        '3. 检查 Coze API Token 是否有访问工作流的权限',
        '4. 确认 Token 没有过期',
        '5. 确保数据库连接信息正确',
        '6. 生成强随机的 JWT_SECRET'
      ]
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '检查配置时出错',
      diagnostics: ['❌ 无法读取环境变量配置']
    }, { status: 500 })
  }
} 