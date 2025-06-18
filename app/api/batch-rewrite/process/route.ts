import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { BatchConfig } from '@/lib/types'
import { generateRewriteContent, parseThreeVersions } from '@/lib/ark-api'
import { fetchXiaohongshuNoteDetail } from '@/lib/coze-api'

// 使用单例 Supabase 客户端
const supabase = supabaseServer

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
  const startTime = Date.now()
  try {
    // 更新任务笔记状态为处理中
    await supabase
      .from('task_notes')
      .update({ status: 'processing' })
      .eq('id', taskNoteId)

    console.log(`🚀 [后端] 开始处理笔记改写: ${taskNoteId}，生成3个版本 (标题: ${noteData.title?.substring(0, 20) || '无标题'}...)`)

    // 准备原始内容
    const originalContent = `标题: ${noteData.title || '无标题'}
内容: ${noteData.content || '无内容'}
标签: ${noteData.tags ? noteData.tags.join(', ') : '无标签'}`

    console.log(`📝 [后端] 笔记 ${taskNoteId} 原始内容长度: ${originalContent.length} 字符`)

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
        console.error(`❌ [后端] 笔记 ${taskNoteId} 创建生成内容记录失败:`, createError)
        continue
      }

      contentRecords.push(generatedContent)
      console.log(`✅ [后端] 笔记 ${taskNoteId} 创建版本 ${i + 1} 记录: ${generatedContent.id}`)
    }

    if (contentRecords.length === 0) {
      throw new Error('无法创建生成内容记录')
    }

    console.log(`📋 [后端] 笔记 ${taskNoteId} 成功创建 ${contentRecords.length} 个内容记录`)

    let fullContent = ''
    let chunkCount = 0

    // 调用ARK API生成内容（一次调用）
    console.log(`🔄 [后端] 笔记 ${taskNoteId} 开始调用ARK API生成内容`)
    await generateRewriteContent(
      originalContent,
      config,
      // onChunk - 流式内容回调
      (chunk: string) => {
        fullContent += chunk
        chunkCount++
        if (chunkCount % 10 === 0) {
          console.log(`📡 [后端] 笔记 ${taskNoteId} 已接收 ${chunkCount} 个chunks，当前内容长度: ${fullContent.length}`)
        }
      },
      // onComplete - 完成回调
      async (finalContent: string) => {
        try {
          console.log(`📊 [后端] 笔记 ${taskNoteId} 内容生成完成`)
          console.log(`📏 [后端] 笔记 ${taskNoteId} 最终内容长度: ${finalContent.length} 字符，共接收 ${chunkCount} 个chunks`)
          console.log(`🔍 [后端] 笔记 ${taskNoteId} 开始解析三个版本`)
          
          // 解析三个版本的内容
          const versions = parseThreeVersions(finalContent)
          
          console.log(`📋 [后端] 笔记 ${taskNoteId} 解析得到 ${versions.length} 个版本`)
          
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
            
            console.log(`✅ [后端] 笔记 ${taskNoteId} 的版本 ${i + 1} 保存完成 (标题: ${version.title.substring(0, 20)}...)`)
          }
          
          console.log(`🎉 [后端] 笔记 ${taskNoteId} 所有版本生成完成`)
        } catch (error) {
          console.error(`❌ [后端] 笔记 ${taskNoteId} 处理生成内容失败:`, error)
          
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
        console.error(`❌ [后端] 笔记 ${taskNoteId} 生成内容失败:`, errorMessage)
        
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

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✅ [后端] 笔记改写完成: ${taskNoteId}，耗时 ${duration}s`)

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.error(`❌ [后端] 处理笔记改写失败 (${taskNoteId})，耗时 ${duration}s:`, error)
    
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

    console.log(`🚀 [后端] 开始处理批量改写任务: ${taskId}`)

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
        console.log(`🚀 [后端] 开始并行处理 ${taskNotes.length} 个笔记`)
        
        // 并行处理所有笔记，提高效率
        const processPromises = taskNotes.map(async (taskNote, index) => {
          try {
            // 这里可以从note_data中获取笔记信息，或者通过API重新获取
            // 为了简化，我们使用存储的note_data
            let noteData = taskNote.note_data

            // 如果note_data为空，标记为失败
            if (!noteData || Object.keys(noteData).length === 0) {
              console.log(`❌ [后端] 笔记数据为空，跳过处理: ${taskNote.note_id}`)
              await supabase
                .from('task_notes')
                .update({
                  status: 'failed',
                  error_message: '笔记数据为空'
                })
                .eq('id', taskNote.id)
              return
            }

            // 添加一个小的随机延迟，避免同时调用API导致限流
            // 每个笔记延迟0-2秒，分散API调用时间
            const randomDelay = Math.random() * 2000
            await new Promise(resolve => setTimeout(resolve, randomDelay))
            
            console.log(`📝 [后端] 开始处理第 ${index + 1} 个笔记: ${taskNote.note_id}`)

            // 处理单个笔记的改写
            await processNoteRewrite(taskNote.id, noteData, config)
            
            console.log(`✅ [后端] 第 ${index + 1} 个笔记处理完成: ${taskNote.note_id}`)
          } catch (error) {
            console.error(`❌ [后端] 处理笔记失败 (${taskNote.note_id}):`, error)
            // 单个笔记处理失败不影响其他笔记
            await supabase
              .from('task_notes')
              .update({
                status: 'failed',
                error_message: error instanceof Error ? error.message : '处理失败'
              })
              .eq('id', taskNote.id)
          }
        })

        // 等待所有笔记处理完成
        await Promise.allSettled(processPromises)
        
        console.log(`🎉 [后端] 所有笔记处理完成，共 ${taskNotes.length} 个`)

        // 检查所有任务笔记的状态
        const { data: finalTaskNotes } = await supabase
          .from('task_notes')
          .select('status')
          .eq('task_id', taskId)

        const allCompleted = finalTaskNotes?.every(tn => 
          tn.status === 'completed' || tn.status === 'failed'
        )

        if (allCompleted) {
          // 统计最终结果
          const completedCount = finalTaskNotes?.filter(tn => tn.status === 'completed').length || 0
          const failedCount = finalTaskNotes?.filter(tn => tn.status === 'failed').length || 0
          const totalCount = finalTaskNotes?.length || 0
          
          console.log(`📊 [后端] 任务 ${taskId} 处理统计: 总计 ${totalCount} 个笔记，成功 ${completedCount} 个，失败 ${failedCount} 个`)
          
          if (failedCount > 0) {
            // 返还失败笔记的积分
            try {
              await supabase.rpc('refund_credits', {
                p_user_id: userId,
                p_amount: failedCount,
                p_reason: `任务处理失败返还：${task.task_name}`,
                p_task_id: taskId
              })
              console.log(`💰 [后端] 积分返还成功，返还数量: ${failedCount}`)
            } catch (error) {
              console.error('❌ [后端] 积分返还失败:', error)
            }
          }

          // 更新任务状态为完成
          await supabase
            .from('batch_tasks')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', taskId)

          console.log(`🎉 [后端] 批量改写任务处理完成: ${taskId}`)
        }

      } catch (error) {
        console.error(`❌ [后端] 批量处理任务失败 ${taskId}:`, error)
        
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