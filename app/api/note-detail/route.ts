import { NextRequest, NextResponse } from 'next/server'
import { fetchXiaohongshuNoteDetail, convertXiaohongshuNoteDetailToNoteDetail } from '@/lib/coze-api'

/**
 * 获取笔记详情 API
 * POST /api/note-detail
 */
export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const body = await req.json()
    const { noteUrl, cookieStr } = body

    // 参数验证
    if (!noteUrl) {
      return NextResponse.json(
        { error: '笔记URL不能为空' },
        { status: 400 }
      )
    }

    if (!cookieStr) {
      return NextResponse.json(
        { error: '用户Cookie不能为空' },
        { status: 400 }
      )
    }

    // 记录请求日志
    console.log('接收到笔记详情请求:', {
      noteUrl,
      hasCookie: !!cookieStr,
      cookieLength: cookieStr.length
    })

    // 调用API获取笔记详情
    const xiaohongshuNoteDetail = await fetchXiaohongshuNoteDetail(noteUrl, cookieStr)
    
    // 转换为统一格式
    const noteDetail = convertXiaohongshuNoteDetailToNoteDetail(xiaohongshuNoteDetail)

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: noteDetail
    })

  } catch (error) {
    // 错误处理
    console.error('获取笔记详情失败:', error)
    
    const errorMessage = error instanceof Error ? error.message : '获取笔记详情失败'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false 
      },
      { status: 500 }
    )
  }
}

/**
 * 处理OPTIONS请求（CORS预检请求）
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 