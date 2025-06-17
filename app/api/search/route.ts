import { NextRequest, NextResponse } from 'next/server'
import { searchXiaohongshuNotes, convertXiaohongshuNotesToNotes } from '@/lib/coze-api'
import { SearchConfig } from '@/lib/types'

// POST方法处理搜索请求
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json()
    const { keywords, cookieStr, config } = body

    // 验证必要参数
    if (!keywords || typeof keywords !== 'string') {
      return NextResponse.json(
        { error: '搜索关键词不能为空' },
        { status: 400 }
      )
    }

    if (!cookieStr || typeof cookieStr !== 'string') {
      return NextResponse.json(
        { error: '用户Cookie不能为空' },
        { status: 400 }
      )
    }

    // 设置默认搜索配置
    const searchConfig: SearchConfig = {
      noteType: config?.noteType ?? 0, // 默认全部类型
      sort: config?.sort ?? 0, // 默认综合排序  
      totalNumber: config?.totalNumber ?? 20 // 默认20条
    }

    // 调用Coze API搜索小红书笔记
    const xiaohongshuNotes = await searchXiaohongshuNotes(
      keywords,
      cookieStr,
      searchConfig
    )

    // 转换为统一格式
    const notes = convertXiaohongshuNotesToNotes(xiaohongshuNotes)

    // 返回搜索结果
    return NextResponse.json({
      success: true,
      data: notes,
      total: notes.length,
      config: searchConfig,
      keywords
    })

  } catch (error) {
    console.error('搜索API错误:', error)
    
    // 返回错误信息
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '搜索失败，请稍后重试',
        success: false
      },
      { status: 500 }
    )
  }
}

// GET方法处理简单的搜索请求（通过URL参数）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keywords = searchParams.get('keywords')
    const cookieStr = searchParams.get('cookieStr')
    const noteType = parseInt(searchParams.get('noteType') || '0') as 0 | 1 | 2
    const sort = parseInt(searchParams.get('sort') || '0') as 0 | 1 | 2
    const totalNumber = parseInt(searchParams.get('totalNumber') || '20')

    // 验证必要参数
    if (!keywords) {
      return NextResponse.json(
        { error: '搜索关键词不能为空' },
        { status: 400 }
      )
    }

    if (!cookieStr) {
      return NextResponse.json(
        { error: '用户Cookie不能为空' },
        { status: 400 }
      )
    }

    // 搜索配置
    const searchConfig: SearchConfig = {
      noteType,
      sort,
      totalNumber
    }

    // 调用Coze API搜索小红书笔记
    const xiaohongshuNotes = await searchXiaohongshuNotes(
      keywords,
      cookieStr,
      searchConfig
    )

    // 转换为统一格式
    const notes = convertXiaohongshuNotesToNotes(xiaohongshuNotes)

    // 返回搜索结果
    return NextResponse.json({
      success: true,
      data: notes,
      total: notes.length,
      config: searchConfig,
      keywords
    })

  } catch (error) {
    console.error('搜索API错误:', error)
    
    // 返回错误信息
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '搜索失败，请稍后重试',
        success: false
      },
      { status: 500 }
    )
  }
} 