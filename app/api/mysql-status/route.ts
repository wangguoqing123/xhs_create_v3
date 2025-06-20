import { NextRequest, NextResponse } from 'next/server'
import { testConnection, warmupPool } from '@/lib/mysql'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [MySQL状态API] 开始检查数据库状态')
    
    // 首先尝试预热连接池
    const warmupResult = await warmupPool()
    if (warmupResult.success) {
      console.log('✅ [MySQL状态API] 连接池预热成功')
    } else {
      console.warn('⚠️ [MySQL状态API] 连接池预热失败:', warmupResult.error)
    }
    
    // 然后测试数据库连接
    const connectionResult = await testConnection()
    
    return NextResponse.json({
      mysql: {
        status: connectionResult.success ? 'connected' : 'error',
        message: connectionResult.success ? '连接正常' : (connectionResult.error || '连接失败'),
        timestamp: new Date().toISOString(),
        // 添加预热状态信息
        warmup: {
          success: warmupResult.success,
          message: warmupResult.error || '预热成功'
        }
      }
    })
  } catch (error) {
    console.error('❌ [MySQL状态API] 状态检查失败:', error)
    return NextResponse.json({
      mysql: {
        status: 'error',
        message: error instanceof Error ? error.message : '连接失败',
        timestamp: new Date().toISOString(),
        warmup: {
          success: false,
          message: '预热过程中出错'
        }
      }
    }, { status: 500 })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 