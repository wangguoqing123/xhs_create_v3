import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// 使用单例 Supabase 客户端
const supabase = supabaseServer

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 获取用户认证信息
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '未提供认证信息' },
        { status: 401 }
      )
    }

    // 解析Bearer token
    const token = authHeader.replace('Bearer ', '')
    
    // 获取用户信息
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData?.user) {
      return NextResponse.json(
        { error: '用户认证失败' },
        { status: 401 }
      )
    }

    const userId = userData.user.id

    // 获取用户的所有批量任务
    const { data: tasks, error: tasksError } = await supabase
      .from('batch_tasks')
      .select(`
        *,
        task_notes (
          id,
          note_id,
          note_data,
          status,
          error_message,
          created_at,
          updated_at,
          generated_contents (
            id,
            title,
            content,
            content_type,
            status,
            error_message,
            created_at,
            updated_at,
            completed_at
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (tasksError) {
      console.error('获取任务列表失败:', tasksError)
      return NextResponse.json(
        { error: '获取任务列表失败' },
        { status: 500 }
      )
    }

    // 获取总数
    const { count, error: countError } = await supabase
      .from('batch_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      console.error('获取任务总数失败:', countError)
    }

    // 格式化返回数据
    const formattedTasks = tasks?.map(task => {
      // 计算任务进度
      const totalNotes = task.task_notes?.length || 0
      const completedNotes = task.task_notes?.filter((note: any) => note.status === 'completed').length || 0
      const failedNotes = task.task_notes?.filter((note: any) => note.status === 'failed').length || 0
      const processingNotes = task.task_notes?.filter((note: any) => note.status === 'processing').length || 0

      // 计算生成内容统计
      const totalContents = task.task_notes?.reduce((acc: number, note: any) => acc + (note.generated_contents?.length || 0), 0) || 0
      const completedContents = task.task_notes?.reduce((acc: number, note: any) => 
        acc + (note.generated_contents?.filter((content: any) => content.status === 'completed').length || 0), 0) || 0

      return {
        id: task.id,
        taskName: task.task_name,
        searchKeywords: task.search_keywords,
        config: task.config,
        status: task.status,
        errorMessage: task.error_message,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        completedAt: task.completed_at,
        progress: {
          total: totalNotes,
          completed: completedNotes,
          failed: failedNotes,
          processing: processingNotes,
          pending: totalNotes - completedNotes - failedNotes - processingNotes
        },
        contentStats: {
          total: totalContents,
          completed: completedContents
        },
        notes: task.task_notes?.map((note: any) => ({
          id: note.id,
          noteId: note.note_id,
          noteData: note.note_data,
          status: note.status,
          errorMessage: note.error_message,
          createdAt: note.created_at,
          updatedAt: note.updated_at,
          generatedContents: note.generated_contents || []
        })) || []
      }
    }) || []

    return NextResponse.json({
      tasks: formattedTasks,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('获取任务列表API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
} 