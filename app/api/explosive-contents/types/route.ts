import { NextRequest, NextResponse } from 'next/server'
import { getNoteTypeList } from '@/lib/mysql-explosive-contents'

// GET方法：获取笔记类型列表（公开接口）
export async function GET(request: NextRequest) {
  try {
    // 获取类型列表
    const result = await getNoteTypeList()
    
    if (result.error) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('获取笔记类型列表错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 