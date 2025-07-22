import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { createBatchTask, createTaskNotes, consumeCredits, getProfile } from '@/lib/mysql'
import type { BatchConfig } from '@/lib/types'

export async function POST(request: NextRequest) {
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

    // 解析请求体
    const body = await request.json()
    const { taskName, searchKeywords, config, notes } = body

    // 验证必需参数
    if (!taskName || !config || !Array.isArray(notes) || notes.length === 0) {
      return NextResponse.json(
        { error: '缺少必需参数：taskName, config, notes' },
        { status: 400 }
      )
    }

    // 验证配置参数
    const batchConfig: BatchConfig = {
      type: config.type || 'auto',
      theme: config.theme || '',
      persona: config.persona || 'default',
      purpose: config.purpose || 'default'
    }

    // 检查用户积分是否足够
    const { data: profile, error: profileError } = await getProfile(userId)
    if (profileError || !profile) {
      return NextResponse.json(
        { error: '获取用户信息失败' },
        { status: 500 }
      )
    }

    const requiredCredits = notes.length * 1 // 每个笔记消耗1积分
    if (profile.credits < requiredCredits) {
      return NextResponse.json(
        { error: '积分不足', required: requiredCredits, current: profile.credits },
        { status: 400 }
      )
    }

    // 创建批量任务
    const { data: task, error: taskError } = await createBatchTask(
      userId,
      taskName,
      {
        ...batchConfig,
        search_keywords: searchKeywords
      }
    )

    if (taskError || !task) {
      console.error('创建批量任务失败:', taskError)
      return NextResponse.json(
        { error: '创建任务失败' },
        { status: 500 }
      )
    }

    // 创建任务笔记关联
    const taskNotes = notes.map((note: any) => ({
      task_id: task.id,
      note_id: note.note_id || note.id,
      note_data: note,
      status: 'pending'
    }))

    console.log('📝 [API] 创建任务笔记关联，笔记数量:', taskNotes.length)

    const { data: createdNotes, error: notesError } = await createTaskNotes(taskNotes)
    if (notesError) {
      console.error('创建任务笔记关联失败:', notesError)
      return NextResponse.json(
        { error: '创建笔记关联失败' },
        { status: 500 }
      )
    }

    // 扣除积分
    const { success: creditSuccess, error: creditError } = await consumeCredits(
      userId,
      requiredCredits,
      `批量改写任务: ${taskName}`,
      task.id
    )

    if (!creditSuccess) {
      console.error('扣除积分失败:', creditError)
      return NextResponse.json(
        { error: '积分扣除失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        taskName: task.task_name,
        status: task.status,
        notesCount: createdNotes.length,
        creditsConsumed: requiredCredits,
        createdAt: task.created_at
      }
    })

  } catch (error) {
    console.error('创建批量改写任务失败:', error)
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 