import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { BatchConfig } from '@/lib/types'
import { searchXiaohongshuNotes } from '@/lib/coze-api'

// 使用单例 Supabase 客户端
const supabase = supabaseServer

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json()
    const { selectedNotes, config, taskName, notesData } = body

    // 验证请求参数
    if (!selectedNotes || !Array.isArray(selectedNotes) || selectedNotes.length === 0) {
      return NextResponse.json(
        { error: '请选择要改写的笔记' },
        { status: 400 }
      )
    }

    if (!config || !taskName) {
      return NextResponse.json(
        { error: '任务名称和配置信息不能为空' },
        { status: 400 }
      )
    }

    if (!notesData || !Array.isArray(notesData)) {
      return NextResponse.json(
        { error: '笔记数据不能为空' },
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

    // 获取用户的cookie信息和积分（用于获取笔记详情和检查积分）
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_cookie, credits')
      .eq('id', userId)
      .single()

    if (!profile?.user_cookie) {
      return NextResponse.json(
        { error: '用户Cookie未设置，无法获取笔记详情' },
        { status: 400 }
      )
    }

    // 检查积分是否足够
    const requiredCredits = selectedNotes.length
    const currentCredits = profile.credits || 0

    if (currentCredits < requiredCredits) {
      return NextResponse.json(
        { 
          error: '积分不足',
          details: {
            required: requiredCredits,
            current: currentCredits,
            shortage: requiredCredits - currentCredits
          }
        },
        { status: 400 }
      )
    }

    console.log('开始创建批量改写任务:', {
      userId,
      taskName,
      selectedNotesCount: selectedNotes.length,
      config
    })

    // 创建批量任务记录
    const { data: task, error: taskError } = await supabase
      .from('batch_tasks')
      .insert({
        user_id: userId,
        task_name: taskName,
        config: config as BatchConfig,
        status: 'pending'
      })
      .select()
      .single()

    if (taskError) {
      console.error('创建批量任务失败:', taskError)
      return NextResponse.json(
        { error: '创建任务失败' },
        { status: 500 }
      )
    }

    console.log('批量任务创建成功:', task.id)

    // 扣除积分
    const { data: creditResult, error: creditError } = await supabase
      .rpc('consume_credits', {
        p_user_id: userId,
        p_amount: requiredCredits,
        p_reason: `批量生成任务：${taskName}`,
        p_task_id: task.id
      })

    if (creditError || !creditResult) {
      console.error('扣除积分失败:', creditError)
      // 删除已创建的任务
      await supabase.from('batch_tasks').delete().eq('id', task.id)
      return NextResponse.json(
        { error: '积分扣除失败，任务已取消' },
        { status: 500 }
      )
    }

    console.log('积分扣除成功，扣除数量:', requiredCredits)

    // 为每个选中的笔记创建任务笔记记录
    const taskNotes = selectedNotes.map((noteId, index) => {
      // 从传入的笔记数据中找到对应的笔记
      const noteData = notesData.find((note: any) => note.id === noteId) || {}
      
      return {
        task_id: task.id,
        note_id: noteId,
        note_data: noteData, // 使用传入的笔记数据
        status: 'pending' as const
      }
    })

    const { data: createdTaskNotes, error: taskNotesError } = await supabase
      .from('task_notes')
      .insert(taskNotes)
      .select()

    if (taskNotesError) {
      console.error('创建任务笔记关联失败:', taskNotesError)
      return NextResponse.json(
        { error: '创建任务笔记关联失败' },
        { status: 500 }
      )
    }

    console.log('任务笔记关联创建成功，数量:', createdTaskNotes.length)

    // 获取扣除积分后的余额
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    // 返回创建成功的任务信息
    return NextResponse.json({
      success: true,
      taskId: task.id,
      taskName: task.task_name,
      status: task.status,
      selectedNotesCount: selectedNotes.length,
      createdAt: task.created_at,
      currentCredits: updatedProfile?.credits || 0
    })

  } catch (error) {
    console.error('创建批量改写任务API错误:', error)
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
} 