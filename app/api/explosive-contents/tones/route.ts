import { NextRequest, NextResponse } from 'next/server'
import { getNoteToneList } from '@/lib/mysql-explosive-contents'

// GET方法：获取笔记口吻列表（公开接口）
export async function GET(request: NextRequest) {
  try {
    // 获取口吻列表
    const result = await getNoteToneList()
    
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
    console.error('获取笔记口吻列表错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 