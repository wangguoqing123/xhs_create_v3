import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { TaskWithDetails } from '@/lib/types'

// 使用单例 Supabase 客户端
const supabase = supabaseServer

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    // 验证请求参数
    if (!taskId) {
      return NextResponse.json(
        { error: '任务ID不能为空' },
        { status: 400 }
      )
    }

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

    // 获取任务信息
    const { data: task, error: taskError } = await supabase
      .from('batch_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: '任务不存在或无权限访问' },
        { status: 404 }
      )
    }

    // 获取任务关联的笔记
    const { data: taskNotes, error: taskNotesError } = await supabase
      .from('task_notes')
      .select(`
        *,
        generated_contents (*)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (taskNotesError) {
      console.error('获取任务笔记失败:', taskNotesError)
      return NextResponse.json(
        { error: '获取任务笔记失败' },
        { status: 500 }
      )
    }

    // 统计任务进度
    const totalNotes = taskNotes?.length || 0
    const completedNotes = taskNotes?.filter(note => note.status === 'completed').length || 0
    const failedNotes = taskNotes?.filter(note => note.status === 'failed').length || 0
    const processingNotes = taskNotes?.filter(note => note.status === 'processing').length || 0

    // 构建响应数据
    const response = {
      taskId: task.id,
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
      notes: taskNotes?.map(note => ({
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

    return NextResponse.json(response)

  } catch (error) {
    console.error('查询任务状态API错误:', error)
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