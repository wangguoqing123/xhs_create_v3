import { NextRequest, NextResponse } from 'next/server'
import { updateExplosiveContent } from '@/lib/mysql'
import { cookies } from 'next/headers'

// 检查管理员认证
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  return adminAuth?.value === 'authenticated'
}

// POST方法：批量审核操作
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { contentIds, action } = body // contentIds: string[], action: 'approve' | 'disable'
    
    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return NextResponse.json(
        { error: '缺少要操作的内容ID' },
        { status: 400 }
      )
    }

    if (!action || !['approve', 'disable'].includes(action)) {
      return NextResponse.json(
        { error: '操作类型无效' },
        { status: 400 }
      )
    }

    // 根据操作类型设置状态
    const status = action === 'approve' ? 'enabled' : 'disabled'
    
    const results = {
      successful: [] as string[],
      failed: [] as { id: string, error: string }[]
    }

    // 批量更新状态
    for (const contentId of contentIds) {
      try {
        const { data, error } = await updateExplosiveContent(contentId, { status })
        
        if (error) {
          results.failed.push({ id: contentId, error })
        } else {
          results.successful.push(contentId)
        }
      } catch (error) {
        results.failed.push({ 
          id: contentId, 
          error: error instanceof Error ? error.message : '未知错误' 
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `批量${action === 'approve' ? '审核通过' : '禁用'}完成：成功 ${results.successful.length} 个，失败 ${results.failed.length} 个`
    })

  } catch (error) {
    console.error('批量审核操作失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 