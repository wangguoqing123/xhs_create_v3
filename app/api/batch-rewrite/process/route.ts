import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database, BatchConfig } from '@/lib/types'
import { generateRewriteContent, parseThreeVersions } from '@/lib/ark-api'
import { fetchXiaohongshuNoteDetail } from '@/lib/coze-api'

// 创建 Supabase 客户端
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * 处理单个笔记的改写任务
 * @param taskNoteId 任务笔记ID
 * @param noteData 笔记数据 
 * @param config 批量配置
 */
async function processNoteRewrite(
  taskNoteId: string,
  noteData: any,
  config: BatchConfig
): Promise<void> {
  try {
    // 更新任务笔记状态为处理中
    await supabase
      .from('task_notes')
      .update({ status: 'processing' })
      .eq('id', taskNoteId)

    console.log(`开始处理笔记改写: ${taskNoteId}，生成3个版本`)

    // 准备原始内容
    const originalContent = `标题: ${noteData.title || '无标题'}
内容: ${noteData.content || '无内容'}
标签: ${noteData.tags ? noteData.tags.join(', ') : '无标签'}`

    // 先创建3个生成内容记录
    const contentRecords: any[] = []
    for (let i = 0; i < 3; i++) {
      const { data: generatedContent, error: createError } = await supabase
        .from('generated_contents')
        .insert({
          task_note_id: taskNoteId,
          content_type: config.type === 'video' ? 'video_script' : 'article',
          generation_config: config,
          status: 'generating'
        })
        .select()
        .single()

      if (createError) {
        console.error('创建生成内容记录失败:', createError)
        continue
      }

      contentRecords.push(generatedContent)
    }

    if (contentRecords.length === 0) {
      throw new Error('无法创建生成内容记录')
    }

    let fullContent = ''

    // 调用ARK API生成内容（一次调用）
    await generateRewriteContent(
      originalContent,
      config,
      // onChunk - 流式内容回调
      (chunk: string) => {
        fullContent += chunk
        // 可以在这里实现实时更新进度
      },
      // onComplete - 完成回调
      async (finalContent: string) => {
        try {
          console.log(`笔记 ${taskNoteId} 内容生成完成，开始解析三个版本`)
          
          // 解析三个版本的内容
          const versions = parseThreeVersions(finalContent)
          
          // 更新每个版本的内容记录
          for (let i = 0; i < Math.min(versions.length, contentRecords.length); i++) {
            const version = versions[i]
            const record = contentRecords[i]
            
            await supabase
              .from('generated_contents')
              .update({
                title: version.title,
                content: version.content,
                status: 'completed',
                completed_at: new Date().toISOString()
              })
              .eq('id', record.id)
            
            console.log(`笔记 ${taskNoteId} 的版本 ${i + 1} 保存完成`)
          }
          
          console.log(`笔记 ${taskNoteId} 所有版本生成完成`)
        } catch (error) {
          console.error('处理生成内容失败:', error)
          
          // 标记所有记录为失败
          for (const record of contentRecords) {
            await supabase
              .from('generated_contents')
              .update({
                status: 'failed',
                error_message: error instanceof Error ? error.message : '处理内容失败'
              })
              .eq('id', record.id)
          }
        }
      },
      // onError - 错误回调
      async (errorMessage: string) => {
        console.error(`生成内容失败 (${taskNoteId}):`, errorMessage)
        
        // 标记所有记录为失败
        for (const record of contentRecords) {
          await supabase
            .from('generated_contents')
            .update({
              status: 'failed',
              error_message: errorMessage
            })
            .eq('id', record.id)
        }
      }
    )

    // 更新任务笔记状态为完成
    await supabase
      .from('task_notes')
      .update({ status: 'completed' })
      .eq('id', taskNoteId)

    console.log(`笔记改写完成: ${taskNoteId}`)

  } catch (error) {
    console.error(`处理笔记改写失败 (${taskNoteId}):`, error)
    
    // 标记任务笔记为失败
    await supabase
      .from('task_notes')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : '处理失败'
      })
      .eq('id', taskNoteId)
  }
}

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json()
    const { taskId } = body

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

    // 检查任务状态
    if (task.status === 'processing') {
      return NextResponse.json(
        { error: '任务正在处理中，请勿重复提交' },
        { status: 400 }
      )
    }

    if (task.status === 'completed') {
      return NextResponse.json(
        { error: '任务已完成，无需重复处理' },
        { status: 400 }
      )
    }

    console.log('开始处理批量改写任务:', taskId)

    // 更新任务状态为处理中
    await supabase
      .from('batch_tasks')
      .update({ status: 'processing' })
      .eq('id', taskId)

    // 获取任务关联的笔记
    const { data: taskNotes, error: taskNotesError } = await supabase
      .from('task_notes')
      .select('*')
      .eq('task_id', taskId)
      .eq('status', 'pending')

    if (taskNotesError) {
      console.error('获取任务笔记失败:', taskNotesError)
      return NextResponse.json(
        { error: '获取任务笔记失败' },
        { status: 500 }
      )
    }

    if (!taskNotes || taskNotes.length === 0) {
      return NextResponse.json(
        { error: '没有待处理的笔记' },
        { status: 400 }
      )
    }

    // 获取用户Cookie（用于获取笔记详情）
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_cookie')
      .eq('id', userId)
      .single()

    if (!profile?.user_cookie) {
      return NextResponse.json(
        { error: '用户Cookie未设置' },
        { status: 400 }
      )
    }

    // 解析配置
    const config = task.config as BatchConfig

    // 异步处理所有笔记（不阻塞响应）
    setImmediate(async () => {
      try {
        // 串行处理每个笔记，避免API调用过于频繁
        for (const taskNote of taskNotes) {
          // 这里可以从note_data中获取笔记信息，或者通过API重新获取
          // 为了简化，我们使用存储的note_data
          let noteData = taskNote.note_data

          // 如果note_data为空，可以尝试重新获取
          if (!noteData || Object.keys(noteData).length === 0) {
            console.log(`笔记数据为空，跳过处理: ${taskNote.note_id}`)
            await supabase
              .from('task_notes')
              .update({
                status: 'failed',
                error_message: '笔记数据为空'
              })
              .eq('id', taskNote.id)
            continue
          }

          // 处理单个笔记的改写
          await processNoteRewrite(taskNote.id, noteData, config)

          // 在处理下一个笔记前稍作延迟，避免API限流
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        // 检查所有任务笔记的状态
        const { data: finalTaskNotes } = await supabase
          .from('task_notes')
          .select('status')
          .eq('task_id', taskId)

        const allCompleted = finalTaskNotes?.every(tn => 
          tn.status === 'completed' || tn.status === 'failed'
        )

        if (allCompleted) {
          // 更新任务状态为完成
          await supabase
            .from('batch_tasks')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', taskId)

          console.log('批量改写任务处理完成:', taskId)
        }

      } catch (error) {
        console.error('批量处理任务失败:', error)
        
        // 标记任务为失败
        await supabase
          .from('batch_tasks')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : '批量处理失败'
          })
          .eq('id', taskId)
      }
    })

    // 立即返回处理开始的响应
    return NextResponse.json({
      success: true,
      message: '批量改写任务已开始处理',
      taskId: taskId,
      noteCount: taskNotes.length
    })

  } catch (error) {
    console.error('批量改写处理API错误:', error)
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