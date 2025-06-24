import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getBatchTasks, getPool } from '@/lib/mysql'
import type { BatchTask } from '@/lib/types'

// 获取任务的统计信息（笔记数和内容数）
async function getTaskStats(taskId: string) {
  try {
    const connection = await getPool().getConnection()
    
    // 获取任务的笔记数量
    const [noteCountResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM task_notes WHERE task_id = ?',
      [taskId]
    ) as any[]
    
    const noteCount = noteCountResult[0]?.total || 0
    
    // 获取已完成的内容数量
    const [completedContentResult] = await connection.execute(
      `SELECT COUNT(*) as completed 
       FROM generated_contents gc 
       JOIN task_notes tn ON gc.task_note_id = tn.id 
       WHERE tn.task_id = ? AND gc.status = 'completed'`,
      [taskId]
    ) as any[]
    
    const completedContentCount = completedContentResult[0]?.completed || 0
    
    connection.release()
    
    return {
      progress: {
        total: noteCount
      },
      contentStats: {
        completed: completedContentCount
      }
    }
  } catch (error) {
    console.error('获取任务统计失败:', error)
    return {
      progress: {
        total: 0
      },
      contentStats: {
        completed: 0
      }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // 从URL参数获取分页信息
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') // 可选的状态过滤

    // 获取批量任务列表
    const { data: tasks, error } = await getBatchTasks(userId, limit, offset)
    
    if (error) {
      console.error('获取批量任务列表失败:', error)
      return NextResponse.json(
        { error: '获取任务列表失败' },
        { status: 500 }
      )
    }

    // 如果指定了状态过滤，在这里过滤
    let filteredTasks = tasks || []
    if (status && ['pending', 'processing', 'completed', 'failed'].includes(status)) {
      filteredTasks = filteredTasks.filter((task: BatchTask) => task.status === status)
    }

    // 为每个任务获取统计信息并格式化数据
    const formattedTasks = await Promise.all(
      filteredTasks.map(async (task: BatchTask) => {
        const stats = await getTaskStats(task.id)
        
        return {
          id: task.id,
          taskName: task.task_name,
          status: task.status,
          config: task.config,
          searchKeywords: task.search_keywords,
          errorMessage: task.error_message,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
          completedAt: task.completed_at,
          // 添加统计信息
          progress: stats.progress,
          contentStats: stats.contentStats
        }
      })
    )

    return NextResponse.json({
      tasks: formattedTasks,
      limit,
      offset,
      total: formattedTasks.length
    })

  } catch (error) {
    console.error('获取批量任务列表API错误:', error)
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