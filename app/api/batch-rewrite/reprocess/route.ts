import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { 
  getBatchTaskWithNotes, 
  updateBatchTaskStatus, 
  getTaskNotes, 
  updateTaskNoteStatus,
  updateGeneratedContent,
  getProfile,
  getTaskNotesWithContents
} from '@/lib/mysql'
import type { BatchConfig, TaskNote } from '@/lib/types'
import { generateBatchRewriteContent, parseThreeVersions } from '@/lib/ark-api'

/**
 * 重新处理单个笔记的改写任务（用于调试）
 */
async function reprocessNoteRewrite(
  taskNoteId: string,
  noteData: any,
  config: BatchConfig,
  existingContentIds: string[]
): Promise<void> {
  const startTime = Date.now()
  try {
    console.log(`🚀 [重新处理] 开始处理笔记改写: ${taskNoteId}，使用现有的生成内容记录`)

    // 准备原始内容
    const originalContent = `标题: ${noteData.title || '无标题'}
内容: ${noteData.content || '无内容'}
标签: ${noteData.tags ? noteData.tags.join(', ') : '无标签'}`

    console.log(`📝 [重新处理] 笔记 ${taskNoteId} 原始内容长度: ${originalContent.length} 字符`)

    let fullContent = ''
    let chunkCount = 0

    // 调用ARK API生成内容
    console.log(`🔄 [重新处理] 笔记 ${taskNoteId} 开始调用ARK API生成内容`)
    await generateBatchRewriteContent(
      originalContent,
      config,
      // onChunk - 流式内容回调
      (chunk: string) => {
        fullContent += chunk
        chunkCount++
        if (chunkCount % 10 === 0) {
          console.log(`📡 [重新处理] 笔记 ${taskNoteId} 已接收 ${chunkCount} 个chunks，当前内容长度: ${fullContent.length}`)
        }
      },
      // onComplete - 完成回调
      async (finalContent: string) => {
        try {
          console.log(`📊 [重新处理] 笔记 ${taskNoteId} 内容生成完成`)
          console.log(`📏 [重新处理] 笔记 ${taskNoteId} 最终内容长度: ${finalContent.length} 字符，共接收 ${chunkCount} 个chunks`)
          console.log(`🔍 [重新处理] 笔记 ${taskNoteId} 开始解析三个版本`)
          
          // 解析三个版本的内容
          const versions = parseThreeVersions(finalContent)
          
          console.log(`📋 [重新处理] 笔记 ${taskNoteId} 解析得到 ${versions.length} 个版本`)
          
          // 更新每个版本的内容记录
          for (let i = 0; i < Math.min(versions.length, existingContentIds.length); i++) {
            const version = versions[i]
            const contentId = existingContentIds[i]
            
            console.log(`🔄 [重新处理] 笔记 ${taskNoteId} 开始保存版本 ${i + 1}:`, {
              contentId: contentId,
              versionTitle: version.title,
              versionContentLength: version.content?.length,
              versionPreview: version.content?.substring(0, 100)
            })
            
            const updateResult = await updateGeneratedContent(contentId, {
              title: version.title,
              content: version.content,
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            
            if (updateResult.success) {
              console.log(`✅ [重新处理] 笔记 ${taskNoteId} 的版本 ${i + 1} 保存完成 (标题: ${version.title?.substring(0, 20) || '无标题'}...)`)
            } else {
              console.error(`❌ [重新处理] 笔记 ${taskNoteId} 的版本 ${i + 1} 保存失败:`, updateResult.error)
            }
          }
          
          console.log(`🎉 [重新处理] 笔记 ${taskNoteId} 所有版本生成完成`)
        } catch (error) {
          console.error(`❌ [重新处理] 笔记 ${taskNoteId} 处理生成内容失败:`, error)
          
          // 标记所有记录为失败
          for (const contentId of existingContentIds) {
            await updateGeneratedContent(contentId, {
              status: 'failed',
              error_message: error instanceof Error ? error.message : '处理内容失败'
            })
          }
        }
      },
      // onError - 错误回调
      async (errorMessage: string) => {
        console.error(`❌ [重新处理] 笔记 ${taskNoteId} 生成内容失败:`, errorMessage)
        
        // 标记所有记录为失败
        for (const contentId of existingContentIds) {
          await updateGeneratedContent(contentId, {
            status: 'failed',
            error_message: errorMessage
          })
        }
      }
    )

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✅ [重新处理] 笔记改写完成: ${taskNoteId}，耗时 ${duration}s`)

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.error(`❌ [重新处理] 处理笔记改写失败 (${taskNoteId})，耗时 ${duration}s:`, error)
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

    console.log(`🚀 [重新处理] 开始重新处理批量改写任务: ${taskId}`)

    // 获取任务关联的笔记
    const { data: taskNotes, error: taskNotesError } = await getTaskNotes(taskId)

    if (taskNotesError) {
      console.error('获取任务笔记失败:', taskNotesError)
      return NextResponse.json(
        { error: '获取任务笔记失败' },
        { status: 500 }
      )
    }

    if (!taskNotes || taskNotes.length === 0) {
      return NextResponse.json(
        { error: '没有找到任务笔记' },
        { status: 400 }
      )
    }

    // 检查用户Cookie
    const { data: profile, error: profileError } = await getProfile(userId)
    if (profileError || !profile?.user_cookie) {
      return NextResponse.json(
        { error: '用户Cookie未设置' },
        { status: 400 }
      )
    }

    // 解析配置
    const config = task.config as BatchConfig

          // 获取现有的生成内容记录ID
    const { data: notesWithContents } = await getTaskNotesWithContents(taskId)
    
    // 异步处理（不阻塞响应）
    setImmediate(async () => {
      try {
        console.log(`🚀 [重新处理] 开始处理 ${taskNotes.length} 个笔记`)
        
        for (const taskNote of taskNotes) {
          try {
            // 找到对应的生成内容记录
            const noteWithContents = notesWithContents?.find((n: any) => n.id === taskNote.id)
            const existingContentIds = noteWithContents?.generated_contents?.map((gc: any) => gc.id) || []
            
            if (existingContentIds.length === 0) {
              console.log(`⚠️ [重新处理] 笔记 ${taskNote.id} 没有找到生成内容记录，跳过`)
              continue
            }

            console.log(`📝 [重新处理] 开始处理笔记: ${taskNote.note_id}，找到 ${existingContentIds.length} 个生成内容记录`)

            // 重新处理笔记
            await reprocessNoteRewrite(taskNote.id, taskNote.note_data, config, existingContentIds)
            
            console.log(`✅ [重新处理] 笔记处理完成: ${taskNote.note_id}`)
          } catch (error) {
            console.error(`❌ [重新处理] 处理笔记失败 (${taskNote.note_id}):`, error)
          }
        }
        
        console.log(`🎉 [重新处理] 所有笔记处理完成`)
      } catch (error) {
        console.error('❌ [重新处理] 批量处理失败:', error)
      }
    })

    return NextResponse.json({
      success: true,
      message: '重新处理任务已启动，请查看控制台日志'
    })

  } catch (error) {
    console.error('重新处理任务API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 