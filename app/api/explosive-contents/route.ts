import { NextRequest, NextResponse } from 'next/server'
import { 
  getNewExplosiveContentList
} from '@/lib/mysql-explosive-contents'
import type { ExplosiveContentListParams } from '@/lib/types'

// GET方法：获取爆款内容列表（公开接口，供前端使用）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // 解析查询参数
    const trackIds = searchParams.getAll('track_id').map(id => parseInt(id)).filter(id => !isNaN(id))
    const typeIds = searchParams.getAll('type_id').map(id => parseInt(id)).filter(id => !isNaN(id))
    const toneIds = searchParams.getAll('tone_id').map(id => parseInt(id)).filter(id => !isNaN(id))
    
    const params: ExplosiveContentListParams = {
      track_id: trackIds.length > 0 ? trackIds : undefined,
      type_id: typeIds.length > 0 ? typeIds : undefined,
      tone_id: toneIds.length > 0 ? toneIds : undefined,
      status: 'enabled', // 只返回启用的内容
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      search: searchParams.get('search') || undefined
    }

    console.log('🔍 [前端API] 查询参数:', params)

    // 获取爆款内容列表
    const result = await getNewExplosiveContentList(params)
    
    if (result.error) {
      console.error('❌ [前端API] 查询失败:', result.error)
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      )
    }

    console.log('✅ [前端API] 查询成功:', {
      count: result.data.length,
      total: result.total
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      params
    })

  } catch (error) {
    console.error('❌ [前端API] 服务器错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 