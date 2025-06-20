import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getBatchTaskWithNotes, getTaskNotesWithContents } from '@/lib/mysql'
import type { TaskWithDetails } from '@/lib/types'

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

    // 从Cookie中获取JWT令牌
    const token = request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: '未提供认证信息' },
        { status: 401 }
      )
    }

    // 验证JWT令牌
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: '用户认证失败' },
        { status: 401 }
      )
    }

    const userId = payload.userId

    // 获取任务信息
    const { data: task, error: taskError } = await getBatchTaskWithNotes(taskId, userId)

    if (taskError || !task) {
      return NextResponse.json(
        { error: '任务不存在或无权限访问' },
        { status: 404 }
      )
    }

    // 获取任务关联的笔记和生成内容
    let taskNotes = []
    const { data: taskNotesData, error: taskNotesError } = await getTaskNotesWithContents(taskId)

    if (taskNotesError) {
      console.error('获取任务笔记失败:', taskNotesError)
      // 如果获取笔记失败，使用任务中的笔记数据作为后备
      taskNotes = task.notes || []
    } else {
      taskNotes = taskNotesData || []
    }

    // 统计任务进度
    const totalNotes = taskNotes?.length || 0
    const completedNotes = taskNotes?.filter((note: any) => note.status === 'completed').length || 0
    const failedNotes = taskNotes?.filter((note: any) => note.status === 'failed').length || 0
    const processingNotes = taskNotes?.filter((note: any) => note.status === 'processing').length || 0

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
      notes: taskNotes?.map((note: any) => ({
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

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 