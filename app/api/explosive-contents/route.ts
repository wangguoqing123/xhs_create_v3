import { NextRequest, NextResponse } from 'next/server'
import { getExplosiveContentList } from '@/lib/mysql'
import { verifyToken } from '@/lib/auth'
import type { ExplosiveContentListParams } from '@/lib/types'

// GET方法：获取爆款内容列表（用户登录后可访问）
export async function GET(request: NextRequest) {
  try {
    // 从Cookie中获取JWT令牌进行用户认证
    const token = request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未提供认证信息' },
        { status: 401 }
      )
    }

    // 验证JWT令牌
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '用户认证失败' },
        { status: 401 }
      )
    }

    // 临时解决方案：如果表不存在，先创建表
    try {
      const connection = await import('@/lib/mysql').then(m => m.getPool().getConnection())
      
      // 检查表是否存在
      const [tableExists] = await connection.execute(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'explosive_contents'`,
        []
      ) as any[]
      
      if (tableExists[0].count === 0) {
        console.log('🔧 [临时修复] explosive_contents 表不存在，正在创建...')
        
        // 创建表的 SQL（简化版）
        const createTableSQL = `
          CREATE TABLE explosive_contents (
            id VARCHAR(36) PRIMARY KEY,
            title VARCHAR(500) NOT NULL,
            content TEXT NOT NULL,
            tags JSON DEFAULT NULL,
            industry ENUM('decoration', 'beauty', 'parenting', 'other') DEFAULT 'other',
            content_type ENUM('note', 'review', 'guide', 'case', 'other') DEFAULT 'other',
            source_urls JSON DEFAULT NULL,
            cover_image VARCHAR(500) DEFAULT NULL,
            likes INT DEFAULT 0,
            views INT DEFAULT 0,
            author VARCHAR(100) DEFAULT NULL,
            status ENUM('enabled', 'disabled') DEFAULT 'enabled',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_industry (industry),
            INDEX idx_content_type (content_type),
            INDEX idx_status (status),
            INDEX idx_created_at (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `
        
        await connection.execute(createTableSQL, [])
        console.log('✅ [临时修复] explosive_contents 表创建成功')
        
        // 插入一些示例数据
        const insertSampleData = `
          INSERT INTO explosive_contents (id, title, content, tags, industry, content_type, likes, views, author) VALUES
          (UUID(), '秋冬护肤必备清单', '秋冬季节护肤要点：1. 补水保湿是关键 2. 选择温和的洁面产品 3. 使用滋润型面霜', '["护肤", "秋冬", "保湿"]', 'beauty', 'guide', 1200, 5600, '护肤达人小美'),
          (UUID(), '装修省钱攻略', '装修如何省钱：1. 合理规划预算 2. 选择性价比高的材料 3. 避免过度装修', '["装修", "省钱", "攻略"]', 'decoration', 'guide', 800, 3200, '装修小王'),
          (UUID(), '宝宝辅食制作指南', '6个月宝宝辅食制作：1. 米粉是首选 2. 蔬菜泥要细腻 3. 注意营养搭配', '["辅食", "宝宝", "营养"]', 'parenting', 'guide', 950, 4100, '育儿专家')
        `
        
        await connection.execute(insertSampleData, [])
        console.log('✅ [临时修复] 示例数据插入成功')
      }
      
      connection.release()
    } catch (setupError) {
      console.error('❌ [临时修复] 表创建失败:', setupError)
      return NextResponse.json(
        { success: false, error: '数据库初始化失败' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // 解析查询参数
    const params: ExplosiveContentListParams = {
      industry: searchParams.getAll('industry') as any[] || undefined,
      content_type: searchParams.getAll('content_type') as any[] || undefined,
      tone: searchParams.getAll('tone') as any[] || undefined,
      status: 'enabled', // 普通用户只能看到启用的内容
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      search: searchParams.get('search') || undefined
    }

    // 获取爆款内容列表
    const result = await getExplosiveContentList(params)
    
    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      params
    })

  } catch (error) {
    console.error('获取爆款内容列表错误:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    )
  }
} 