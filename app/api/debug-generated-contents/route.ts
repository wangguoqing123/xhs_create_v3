import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getPool } from '@/lib/mysql'

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

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

    const connection = await getPool().getConnection()
    
    // 查询任务笔记
    const [taskNotes] = await connection.execute(
      'SELECT id, note_id, status FROM task_notes WHERE task_id = ?',
      [taskId]
    ) as any[]

    // 查询生成内容
    const [generatedContents] = await connection.execute(`
      SELECT 
        gc.id,
        gc.task_note_id,
        gc.title,
        LENGTH(gc.content) as content_length,
        gc.content,
        gc.status,
        gc.error_message,
        gc.created_at,
        gc.updated_at,
        tn.note_id
      FROM generated_contents gc
      JOIN task_notes tn ON gc.task_note_id = tn.id
      WHERE tn.task_id = ?
      ORDER BY gc.created_at
    `, [taskId]) as any[]

    connection.release()

    return NextResponse.json({
      taskId,
      taskNotes,
      generatedContents: generatedContents.map((gc: any) => ({
        id: gc.id,
        task_note_id: gc.task_note_id,
        note_id: gc.note_id,
        title: gc.title,
        content_length: gc.content_length,
        content_preview: gc.content ? gc.content.substring(0, 200) + '...' : null,
        status: gc.status,
        error_message: gc.error_message,
        created_at: gc.created_at,
        updated_at: gc.updated_at
      }))
    })

  } catch (error) {
    console.error('调试生成内容API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 