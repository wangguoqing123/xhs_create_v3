import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchXhsNoteForImport } from '@/lib/coze-api'
import { 
  createNewExplosiveContent,
  checkNoteExists,
  convertCozeNoteToInsertWithOSS
} from '@/lib/mysql-explosive-contents'
import type { XhsLinkImportRequest, XhsLinkImportResponse } from '@/lib/types'

// 检查管理员认证
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  return adminAuth?.value === 'authenticated'
}

// 从URL中提取笔记ID
function extractNoteId(url: string): string | null {
  try {
    const patterns = [
      /xiaohongshu\.com\/explore\/([a-f0-9]+)/,
      /xiaohongshu\.com\/discovery\/item\/([a-f0-9]+)/,
      /xhslink\.com.*\/([a-f0-9]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }
    
    return null
  } catch (error) {
    console.error('❌ [提取笔记ID] 解析失败:', error)
    return null
  }
}

// 验证小红书链接格式
function isValidXhsUrl(url: string): boolean {
  const xhsDomains = [
    'xiaohongshu.com',
    'xhslink.com'
  ]
  
  try {
    const urlObj = new URL(url)
    return xhsDomains.some(domain => urlObj.hostname.includes(domain))
  } catch {
    return false
  }
}

// POST方法：批量导入小红书链接
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

    const body: XhsLinkImportRequest = await request.json()
    
    // 验证请求参数
    if (!body.urls || !Array.isArray(body.urls) || body.urls.length === 0) {
      return NextResponse.json(
        { success: false, message: '请提供有效的链接列表' },
        { status: 400 }
      )
    }

    if (body.urls.length > 50) {
      return NextResponse.json(
        { success: false, message: '一次最多只能导入50个链接' },
        { status: 400 }
      )
    }

    // 过滤有效的小红书链接
    const validUrls = body.urls.filter(url => {
      const trimmedUrl = url.trim()
      return trimmedUrl && isValidXhsUrl(trimmedUrl)
    })

    if (validUrls.length === 0) {
      return NextResponse.json(
        { success: false, message: '没有找到有效的小红书链接' },
        { status: 400 }
      )
    }

    console.log('🚀 [链接导入] 开始处理:', {
      总链接数: body.urls.length,
      有效链接数: validUrls.length
    })

    // 获取管理员用户的Cookie（使用通用的认证和获取方式）
    // 注意：这里需要管理员账号也设置了小红书Cookie
    let cookieStr = ''
    
    try {
      // 从请求中获取JWT令牌
      const token = request.cookies.get('auth_token')?.value
      
      if (token) {
        const { verifyToken } = await import('@/lib/auth')
        const payload = verifyToken(token)
        
        if (payload) {
          const { getProfile } = await import('@/lib/mysql')
          const { data: profile } = await getProfile(payload.userId)
          
          if (profile?.user_cookie) {
            cookieStr = profile.user_cookie
            console.log('✅ [链接导入] 使用管理员账号的Cookie')
          }
        }
      }
      
      // 如果管理员没有设置Cookie，尝试使用环境变量作为备用
      if (!cookieStr && process.env.XHS_COOKIE) {
        cookieStr = process.env.XHS_COOKIE
        console.log('✅ [链接导入] 使用环境变量Cookie作为备用')
      }
      
    } catch (cookieError) {
      console.error('❌ [链接导入] 获取Cookie失败:', cookieError)
    }
    
    if (!cookieStr) {
      return NextResponse.json(
        { success: false, message: '未配置小红书Cookie。请管理员登录后在个人设置中配置Cookie，或联系技术支持配置环境变量' },
        { status: 500 }
      )
    }

    // 处理结果统计
    const results: Array<{
      url: string
      success: boolean
      note_id?: string
      error?: string
    }> = []
    
    let successCount = 0
    let failedCount = 0

    // 并发处理（限制并发数量避免API限制）
    const batchSize = 5
    for (let i = 0; i < validUrls.length; i += batchSize) {
      const batch = validUrls.slice(i, i + batchSize)
      const batchPromises = batch.map(async (url) => {
        try {
          console.log(`📥 [链接导入] 处理链接: ${url}`)
          
          // 提取笔记ID
          const noteId = extractNoteId(url)
          if (!noteId) {
            return {
              url,
              success: false,
              error: '无法解析笔记ID'
            }
          }

          // 检查是否已存在
          const existsResult = await checkNoteExists(noteId)
          if (existsResult.error) {
            return {
              url,
              success: false,
              error: `检查重复失败: ${existsResult.error}`
            }
          }

          if (existsResult.exists) {
            return {
              url,
              success: false,
              note_id: noteId,
              error: '笔记已存在'
            }
          }

          // 调用Coze接口获取笔记详情
          const cozeData = await fetchXhsNoteForImport(url, cookieStr)
          
          // 验证返回数据格式
          if (!cozeData || !cozeData.note_detail || !cozeData.note_detail.note_id) {
            return {
              url,
              success: false,
              error: '无法获取笔记详情'
            }
          }

          // 转换数据格式并保存到数据库（包含OSS上传）
          const insertData = await convertCozeNoteToInsertWithOSS(cozeData, url)
          const createResult = await createNewExplosiveContent(insertData)

          if (createResult.error) {
            return {
              url,
              success: false,
              note_id: noteId,
              error: createResult.error
            }
          }

          return {
            url,
            success: true,
            note_id: noteId
          }

        } catch (error) {
          console.error(`❌ [链接导入] 处理失败 ${url}:`, error)
          return {
            url,
            success: false,
            error: error instanceof Error ? error.message : '处理失败'
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // 统计结果
      batchResults.forEach(result => {
        if (result.success) {
          successCount++
        } else {
          failedCount++
        }
      })

      console.log(`📊 [链接导入] 批次完成 ${i + 1}-${Math.min(i + batchSize, validUrls.length)}/${validUrls.length}`)

      // 避免API频率限制，批次间延迟
      if (i + batchSize < validUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const response: XhsLinkImportResponse = {
      success: true,
      data: {
        total: validUrls.length,
        successful: successCount,
        failed: failedCount,
        results
      },
      message: `导入完成：成功 ${successCount} 个，失败 ${failedCount} 个`
    }

    console.log('✅ [链接导入] 处理完成:', response.message)
    
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [链接导入] 处理错误:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '导入处理失败',
        error: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
} 