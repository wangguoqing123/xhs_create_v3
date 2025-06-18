import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database, BatchConfig } from '@/lib/types'
import { generateRewriteContent, extractTitleFromContent } from '@/lib/ark-api'
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
 * @param generateCount 生成数量
 */
async function processNoteRewrite(
  taskNoteId: string,
  noteData: any,
  config: BatchConfig,
  generateCount: number
): Promise<void> {
  try {
    // 更新任务笔记状态为处理中
    await supabase
      .from('task_notes')
      .update({ status: 'processing' })
      .eq('id', taskNoteId)

    console.log(`开始处理笔记改写: ${taskNoteId}, 生成数量: ${generateCount}`)

    // 准备原始内容
    const originalContent = `标题: ${noteData.title || '无标题'}
内容: ${noteData.content || '无内容'}
标签: ${noteData.tags ? noteData.tags.join(', ') : '无标签'}`

    // 为每个生成数量创建内容记录
    const contentPromises = Array.from({ length: generateCount }, async (_, index) => {
      try {
        // 创建生成内容记录
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
          return
        }

        let fullContent = ''
        let currentTitle = ''

        // 调用ARK API生成内容
        await generateRewriteContent(
          originalContent,
          config,
          // onChunk - 流式内容回调（这里可以实现实时更新数据库）
          (chunk: string) => {
            fullContent += chunk
            // 可以在这里实时更新数据库的content字段
            // 为了性能考虑，这里不做实时更新，而是等待完成后统一更新
          },
          // onComplete - 完成回调
          async (finalContent: string) => {
            try {
              // 提取标题
              currentTitle = extractTitleFromContent(finalContent)

              // 更新生成内容记录
              await supabase
                .from('generated_contents')
                .update({
                  title: currentTitle,
                  content: finalContent,
                  status: 'completed',
                  completed_at: new Date().toISOString()
                })
                .eq('id', generatedContent.id)

              console.log(`笔记 ${taskNoteId} 的第 ${index + 1} 个内容生成完成`)
            } catch (error) {
              console.error('更新生成内容失败:', error)
              
              // 标记为失败
              await supabase
                .from('generated_contents')
                .update({
                  status: 'failed',
                  error_message: error instanceof Error ? error.message : '更新内容失败'
                })
                .eq('id', generatedContent.id)
            }
          },
          // onError - 错误回调
          async (errorMessage: string) => {
            console.error(`生成内容失败 (${taskNoteId}-${index}):`, errorMessage)
            
            // 标记为失败
            await supabase
              .from('generated_contents')
              .update({
                status: 'failed',
                error_message: errorMessage
              })
              .eq('id', generatedContent.id)
          }
        )

      } catch (error) {
        console.error(`处理单个内容生成失败 (${taskNoteId}-${index}):`, error)
      }
    })

    // 等待所有内容生成完成
    await Promise.all(contentPromises)

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
    const generateCount = parseInt(config.count || '3')

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
          await processNoteRewrite(taskNote.id, noteData, config, generateCount)

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