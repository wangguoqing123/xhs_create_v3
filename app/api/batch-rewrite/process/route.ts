import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { 
  getBatchTaskWithNotes, 
  updateBatchTaskStatus, 
  getTaskNotes, 
  updateTaskNoteStatus,
  createGeneratedContent,
  updateGeneratedContent,
  refundCredits,
  getProfile
} from '@/lib/mysql'
import type { BatchConfig, TaskNote } from '@/lib/types'
import { generateBatchRewriteContent, parseTwoVersions } from '@/lib/ark-api'
import { fetchXiaohongshuNoteDetail, convertXiaohongshuNoteDetailToNoteDetail } from '@/lib/coze-api'

/**
 * 处理单个笔记的改写任务
 * @param taskNoteId 任务笔记ID
 * @param noteData 笔记数据 
 * @param config 批量配置
 * @param userCookie 用户Cookie（用于获取笔记详情）
 */
async function processNoteRewrite(
  taskNoteId: string,
  noteData: any,
  config: BatchConfig,
  userCookie: string
): Promise<void> {
  const startTime = Date.now()
  try {
    // 更新任务笔记状态为处理中
    await updateTaskNoteStatus(taskNoteId, 'processing')

    console.log(`🚀 [后端] 开始处理笔记改写: ${taskNoteId}，生成2个版本 (标题: ${noteData.title?.substring(0, 20) || '无标题'}...)`)

    // 准备原始内容 - 优先获取完整的原文内容
    let originalContent = ''
    let useFullContent = false
    
    // 尝试获取原文链接
    const originalData = noteData.originalData || {}
    const noteUrl = noteData.note_url || noteData.noteUrl || noteData.url || 
                   originalData.note_url || originalData.noteUrl || originalData.url ||
                   originalData.backup_note_url
    
    // 如果有原文链接，尝试获取完整内容
    if (noteUrl && noteUrl.trim() && noteUrl !== 'null' && noteUrl !== 'undefined') {
      try {
        console.log(`📡 [后端] 笔记 ${taskNoteId} 开始获取完整原文内容，链接: ${noteUrl}`)
        
        // 调用API获取完整的笔记详情
        const fullNoteDetail = await fetchXiaohongshuNoteDetail(noteUrl, userCookie)
        
        if (fullNoteDetail && fullNoteDetail.note_display_title && fullNoteDetail.note_desc) {
          // 使用完整的原文内容，格式与单次改写保持一致
          originalContent = `【标题】${fullNoteDetail.note_display_title}\n\n【正文】${fullNoteDetail.note_desc}`
          
          // 添加标签信息
          if (fullNoteDetail.note_tags && fullNoteDetail.note_tags.length > 0) {
            const topics = fullNoteDetail.note_tags.map((tag: string) => `#${tag}`).join(' ')
            originalContent += `\n\n【话题】${topics}`
          }
          
          useFullContent = true
          console.log(`✅ [后端] 笔记 ${taskNoteId} 成功获取完整原文，长度: ${originalContent.length} 字符`)
        } else {
          console.log(`⚠️ [后端] 笔记 ${taskNoteId} API返回数据不完整，使用备用内容`)
        }
      } catch (error) {
        console.error(`❌ [后端] 笔记 ${taskNoteId} 获取完整原文失败:`, error)
        console.log(`🔄 [后端] 笔记 ${taskNoteId} 将使用数据库中的基础内容`)
      }
    } else {
      console.log(`⚠️ [后端] 笔记 ${taskNoteId} 没有有效的原文链接，使用数据库内容`)
    }
    
    // 如果没有获取到完整内容，使用数据库中的基础内容
    if (!useFullContent) {
      if (noteData.originalData && noteData.originalData.note_display_title && noteData.content) {
        // 构建与单次改写相同格式的内容
        originalContent = `【标题】${noteData.originalData.note_display_title || noteData.title || '无标题'}\n\n【正文】${noteData.content || '无内容'}`
        
        // 添加标签信息
        if (noteData.tags && noteData.tags.length > 0) {
          const topics = noteData.tags.map((tag: string) => `#${tag}`).join(' ')
          originalContent += `\n\n【话题】${topics}`
        }
      } else {
        // 最后的备用格式
        originalContent = `标题: ${noteData.title || '无标题'}
内容: ${noteData.content || '无内容'}
标签: ${noteData.tags ? noteData.tags.join(', ') : '无标签'}`
      }
    }

    // 增强原始内容，添加批量配置信息（与单次改写保持一致）
    if (config.theme && config.theme.trim()) {
      originalContent += `\n\n【改写主题】${config.theme.trim()}`
    }
    
    // 添加账号定位信息
    if (config.accountPositioning && config.accountPositioning.trim()) {
      originalContent += `\n\n【账号定位】${config.accountPositioning.trim()}`
    }
    
    // 添加SEO关键词
    if (config.keywords && config.keywords.length > 0) {
      originalContent += `\n\n【SEO关键词】${config.keywords.join(', ')}`
    }

    console.log(`📝 [后端] 笔记 ${taskNoteId} 原始内容长度: ${originalContent.length} 字符`)
    console.log(`🔧 [后端] 笔记 ${taskNoteId} 配置信息:`, {
      theme: config.theme,
      accountPositioning: config.accountPositioning,
      keywords: config.keywords,
      purpose: config.purpose,
      useFullContent: useFullContent,
      hasNoteUrl: !!noteUrl
    })
    
    // 调试：输出完整的增强原文内容
    console.log(`📄 [后端] 笔记 ${taskNoteId} 完整原文内容:`)
    console.log('='.repeat(50))
    console.log(originalContent)
    console.log('='.repeat(50))

    // 先创建2个生成内容记录
    const contentRecords: any[] = []
    for (let i = 0; i < 2; i++) {
      const { data: generatedContent, error: createError } = await createGeneratedContent(
        taskNoteId,
        config.type === 'video' ? 'video_script' : 'article',
        config
      )

      if (createError || !generatedContent) {
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

    // 调用ARK API生成内容
    console.log(`🔄 [后端] 笔记 ${taskNoteId} 开始调用ARK API生成内容`)
    await generateBatchRewriteContent(
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
          console.log(`🔍 [后端] 笔记 ${taskNoteId} 开始解析两个版本`)
          
          // 解析两个版本的内容
          const versions = parseTwoVersions(finalContent)
          
          console.log(`📋 [后端] 笔记 ${taskNoteId} 解析得到 ${versions.length} 个版本`)
          
          // 更新每个版本的内容记录
          for (let i = 0; i < Math.min(versions.length, contentRecords.length); i++) {
            const version = versions[i]
            const record = contentRecords[i]
            
            console.log(`🔄 [后端] 笔记 ${taskNoteId} 开始保存版本 ${i + 1}:`, {
              recordId: record.id,
              versionTitle: version.title,
              versionContentLength: version.content?.length,
              versionPreview: version.content?.substring(0, 100)
            })
            
            const updateResult = await updateGeneratedContent(record.id, {
              title: version.title,
              content: version.content,
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            
            if (updateResult.success) {
              console.log(`✅ [后端] 笔记 ${taskNoteId} 的版本 ${i + 1} 保存完成 (标题: ${version.title?.substring(0, 20) || '无标题'}...)`)
            } else {
              console.error(`❌ [后端] 笔记 ${taskNoteId} 的版本 ${i + 1} 保存失败:`, updateResult.error)
            }
          }
          
          console.log(`🎉 [后端] 笔记 ${taskNoteId} 所有版本生成完成`)
        } catch (error) {
          console.error(`❌ [后端] 笔记 ${taskNoteId} 处理生成内容失败:`, error)
          
          // 标记所有记录为失败
          for (const record of contentRecords) {
            await updateGeneratedContent(record.id, {
              status: 'failed',
              error_message: error instanceof Error ? error.message : '处理内容失败'
            })
          }
        }
      },
      // onError - 错误回调
      async (errorMessage: string) => {
        console.error(`❌ [后端] 笔记 ${taskNoteId} 生成内容失败:`, errorMessage)
        
        // 标记所有记录为失败
        for (const record of contentRecords) {
          await updateGeneratedContent(record.id, {
            status: 'failed',
            error_message: errorMessage
          })
        }
      }
    )

    // 更新任务笔记状态为完成
    await updateTaskNoteStatus(taskNoteId, 'completed')

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✅ [后端] 笔记改写完成: ${taskNoteId}，耗时 ${duration}s`)

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.error(`❌ [后端] 处理笔记改写失败 (${taskNoteId})，耗时 ${duration}s:`, error)
    
    // 标记任务笔记为失败
    await updateTaskNoteStatus(
      taskNoteId, 
      'failed', 
      error instanceof Error ? error.message : '处理失败'
    )
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
    await updateBatchTaskStatus(taskId, 'processing')

    // 获取任务关联的待处理笔记
    const { data: taskNotes, error: taskNotesError } = await getTaskNotes(taskId, 'pending')

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

    // 检查用户Cookie（用于获取笔记详情）
    const { data: profile, error: profileError } = await getProfile(userId)
    if (profileError || !profile?.user_cookie) {
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
        const processPromises = taskNotes.map(async (taskNote: TaskNote, index: number) => {
          try {
            // 这里可以从note_data中获取笔记信息，或者通过API重新获取
            // 为了简化，我们使用存储的note_data
            const noteData = taskNote.note_data

            // 如果note_data为空，标记为失败
            if (!noteData || Object.keys(noteData).length === 0) {
              console.log(`❌ [后端] 笔记数据为空，跳过处理: ${taskNote.note_id}`)
              await updateTaskNoteStatus(taskNote.id, 'failed', '笔记数据为空')
              return
            }

            // 检查是否有原文链接（用于"查看原文"功能）
            // 尝试从多个位置获取链接，与result-viewer.tsx保持一致
            const originalData = noteData.originalData || {}
            const hasNoteUrl = noteData.note_url || noteData.noteUrl || noteData.url || 
                              originalData.note_url || originalData.noteUrl || originalData.url ||
                              originalData.backup_note_url
            
            console.log(`🔍 [后端] 笔记 ${taskNote.note_id} 链接检查:`, {
              '最终链接': hasNoteUrl,
              '链接来源': originalData.note_url ? 'originalData.note_url' : 
                        originalData.backup_note_url ? 'originalData.backup_note_url' : 
                        noteData.note_url ? 'noteData.note_url' : '未找到'
            })
            
            // 更宽松的链接检查逻辑
            const isValidLink = hasNoteUrl && 
                               typeof hasNoteUrl === 'string' && 
                               hasNoteUrl.trim() !== '' && 
                               hasNoteUrl !== 'null' && 
                               hasNoteUrl !== 'undefined' &&
                               (hasNoteUrl.includes('xiaohongshu') || hasNoteUrl.includes('xhslink'))
            
            console.log(`🔍 [后端] 笔记 ${taskNote.note_id} 链接验证结果:`, {
              链接: hasNoteUrl,
              有效: isValidLink
            })
            
            if (!isValidLink) {
              console.error(`❌ [后端] 笔记 ${taskNote.note_id} 缺少有效的原文链接，终止处理`)
              await updateTaskNoteStatus(taskNote.id, 'failed', '未找到有效的小红书原文链接，无法生成内容。前端应该已经过滤此类笔记。')
              return
            }
            
            console.log(`✅ [后端] 笔记 ${taskNote.note_id} 链接验证通过，准备处理`)

            // 添加一个小的随机延迟，避免同时调用API导致限流
            // 每个笔记延迟0-2秒，分散API调用时间
            const randomDelay = Math.random() * 2000
            await new Promise(resolve => setTimeout(resolve, randomDelay))
            
            console.log(`📝 [后端] 开始处理第 ${index + 1} 个笔记: ${taskNote.note_id}`)

            // 处理单个笔记的改写
            await processNoteRewrite(taskNote.id, noteData, config, profile.user_cookie)
            
            console.log(`✅ [后端] 第 ${index + 1} 个笔记处理完成: ${taskNote.note_id}`)
          } catch (error) {
            console.error(`❌ [后端] 处理笔记失败 (${taskNote.note_id}):`, error)
            // 单个笔记处理失败不影响其他笔记
            await updateTaskNoteStatus(
              taskNote.id, 
              'failed', 
              error instanceof Error ? error.message : '处理失败'
            )
          }
        })

        // 等待所有笔记处理完成
        await Promise.allSettled(processPromises)
        
        console.log(`🎉 [后端] 所有笔记处理完成，共 ${taskNotes.length} 个`)

        // 检查所有任务笔记的状态
        const { data: finalTaskNotes } = await getTaskNotes(taskId)

        const allCompleted = finalTaskNotes?.every((tn: TaskNote) => 
          tn.status === 'completed' || tn.status === 'failed'
        )

        if (allCompleted) {
          // 统计最终结果
          const completedCount = finalTaskNotes?.filter((tn: TaskNote) => tn.status === 'completed').length || 0
          const failedCount = finalTaskNotes?.filter((tn: TaskNote) => tn.status === 'failed').length || 0
          const totalCount = finalTaskNotes?.length || 0
          
          console.log(`📊 [后端] 任务 ${taskId} 处理统计: 总计 ${totalCount} 个笔记，成功 ${completedCount} 个，失败 ${failedCount} 个`)
          
          if (failedCount > 0) {
            // 返还失败笔记的积分
            try {
              const refundAmount = failedCount * 1 // 每个笔记1积分
              await refundCredits(
                userId,
                refundAmount,
                `任务处理失败返还：${task.task_name}`,
                taskId
              )
              console.log(`💰 [后端] 积分返还成功，返还数量: ${refundAmount}`)
            } catch (error) {
              console.error('❌ [后端] 积分返还失败:', error)
            }
          }

          // 更新任务状态为完成
          await updateBatchTaskStatus(taskId, 'completed')

          console.log(`🎉 [后端] 批量改写任务处理完成: ${taskId}`)
        }

      } catch (error) {
        console.error(`❌ [后端] 批量处理任务失败 ${taskId}:`, error)
        
        // 标记任务为失败
        await updateBatchTaskStatus(
          taskId, 
          'failed', 
          error instanceof Error ? error.message : '批量处理失败'
        )
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