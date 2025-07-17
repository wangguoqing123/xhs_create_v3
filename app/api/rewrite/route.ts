import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getProfile, consumeCredits, refundCredits, createRewriteRecord, updateRewriteRecord } from '@/lib/mysql'
import { generateRewriteContent, parseTwoVersions } from '@/lib/ark-api'
import type { BatchConfig, RewriteGenerationConfig, RewriteGeneratedVersion } from '@/lib/types'

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
    const { 
      originalText, 
      theme, 
      persona, 
      purpose, 
      keywords,
      accountPositioning,
      sourceUrl // 新增：如果是链接解析的，会传递原始链接
    } = body

    // 验证必需参数
    if (!originalText || !originalText.trim()) {
      return NextResponse.json(
        { error: '原文内容不能为空' },
        { status: 400 }
      )
    }

    // 检查用户积分是否足够
    console.log('🔍 [爆文改写] 开始检查用户积分，用户ID:', userId)
    const { data: profile, error: profileError } = await getProfile(userId)
    if (profileError || !profile) {
      console.error('❌ [爆文改写] 获取用户信息失败:', profileError)
      return NextResponse.json(
        { error: '获取用户信息失败' },
        { status: 500 }
      )
    }

    console.log('✅ [爆文改写] 用户信息获取成功:', {
      userId: profile.id,
      email: profile.email,
      currentCredits: profile.credits
    })

    const requiredCredits = 1 // 生成2个版本消耗1积分
    if (profile.credits < requiredCredits) {
      console.log('❌ [爆文改写] 积分不足:', {
        required: requiredCredits,
        current: profile.credits
      })
      return NextResponse.json(
        { error: '积分不足', required: requiredCredits, current: profile.credits },
        { status: 400 }
      )
    }

    // 构建配置参数
    const config: BatchConfig = {
      type: 'auto', // 跟原文一样的内容类型
      theme: theme || '',
      persona: persona || 'default',
      purpose: purpose || 'default'
    }

    console.log('🚀 [爆文改写] 开始生成内容:', {
      userId,
      originalTextLength: originalText.length,
      theme,
      persona,
      purpose,
      keywordsCount: keywords?.length || 0,
      hasAccountPositioning: !!accountPositioning
    })

    // 准备原始内容，整合所有参数
    let enhancedOriginalText = originalText.trim()
    
    // 添加改写主题
    if (theme && theme.trim()) {
      enhancedOriginalText += `\n\n【改写主题】${theme.trim()}`
    }
    
    // 添加账号定位信息
    if (accountPositioning && accountPositioning.trim()) {
      enhancedOriginalText += `\n\n【账号定位】${accountPositioning.trim()}`
    }
    
    // 添加SEO关键词
    if (keywords && keywords.length > 0) {
      enhancedOriginalText += `\n\n【SEO关键词】${keywords.join(', ')}`
    }

    console.log('📝 [爆文改写] 增强后的原文长度:', enhancedOriginalText.length)

    // 先扣除积分
    console.log(`💰 [爆文改写] 开始扣除积分: ${requiredCredits}，用户ID: ${userId}`)
    const { success: creditSuccess, error: creditError, remainingCredits } = await consumeCredits(
      userId,
      requiredCredits,
      '爆文改写生成',
      undefined // 没有关联任务ID
    )

    if (!creditSuccess) {
      console.error('❌ [爆文改写] 扣除积分失败:', creditError)
      return NextResponse.json(
        { error: '积分扣除失败' },
        { status: 500 }
      )
    }

    console.log('✅ [爆文改写] 积分扣除成功，开始生成内容，剩余积分:', remainingCredits)

    // 准备生成配置对象，用于数据库记录
    const generationConfig: RewriteGenerationConfig = {
      theme: theme || '',
      persona: persona || 'default',
      purpose: purpose || 'default',
      keywords: keywords || [],
      account_positioning: accountPositioning || '',
      original_text_length: originalText.length
    }

    // 判断来源类型：如果有sourceUrl则为链接解析，否则为直接输入
    const sourceType = sourceUrl ? 'link' : 'text'

    // 创建爆文改写记录（在开始生成时立即写入数据库）
    console.log('💾 [爆文改写] 开始创建数据库记录')
    const { data: rewriteRecord, error: createError } = await createRewriteRecord({
      user_id: userId,
      original_text: originalText.trim(),
      source_url: sourceUrl || null,
      source_type: sourceType,
      generation_config: generationConfig,
      credits_consumed: requiredCredits
    })

    if (createError || !rewriteRecord) {
      console.error('❌ [爆文改写] 创建数据库记录失败:', createError)
      // 如果数据库记录创建失败，退还积分
      await refundCredits(userId, requiredCredits, '数据库记录创建失败退还', undefined)
      return NextResponse.json(
        { error: '创建记录失败' },
        { status: 500 }
      )
    }

    console.log('✅ [爆文改写] 数据库记录创建成功，记录ID:', rewriteRecord.id)

    // 使用流式生成，但在内存中收集完整内容
    let fullContent = ''
    let chunkCount = 0

    return new Promise<NextResponse>((resolve) => {
      generateRewriteContent(
        enhancedOriginalText,
        config,
        // onChunk - 流式内容回调
        (chunk: string) => {
          fullContent += chunk
          chunkCount++
          if (chunkCount % 20 === 0) {
            console.log(`📡 [爆文改写] 已接收 ${chunkCount} 个chunks，当前内容长度: ${fullContent.length}`)
          }
        },
        // onComplete - 完成回调
        async (finalContent: string) => {
          try {
            console.log(`📊 [爆文改写] 内容生成完成，最终长度: ${finalContent.length}`)
            
            // 调试：输出完整的生成内容
            console.log('🔍 [爆文改写] 完整生成内容:')
            console.log('='.repeat(80))
            console.log(finalContent)
            console.log('='.repeat(80))
            
            // 解析两个版本的内容
            const versions = parseTwoVersions(finalContent)
            console.log(`📋 [爆文改写] 解析得到 ${versions.length} 个版本`)
            
            // 转换为数据库存储格式
            const generatedVersions: RewriteGeneratedVersion[] = versions.map((version, index) => ({
              title: version.title || `版本${index + 1}`,
              content: version.content || '',
              version_name: index === 0 ? '经典策略版' : '人设深耕版'
            }))

            // 更新数据库记录：标记为完成并保存生成的内容
            console.log('💾 [爆文改写] 开始更新数据库记录为完成状态')
            const { error: updateError } = await updateRewriteRecord(rewriteRecord.id, {
              generated_content: generatedVersions,
              status: 'completed',
              completed_at: new Date().toISOString() // 在updateRewriteRecord函数内部会转换为MySQL格式
            })

            if (updateError) {
              console.error('❌ [爆文改写] 更新数据库记录失败:', updateError)
              // 虽然更新失败，但生成已完成，不退还积分，只记录错误
            } else {
              console.log('✅ [爆文改写] 数据库记录更新完成')
            }
            
            console.log('✅ [爆文改写] 生成完成，返回2个版本')
            
            resolve(NextResponse.json({
              success: true,
              data: {
                versions: versions,
                creditsConsumed: requiredCredits,
                originalTextLength: originalText.length,
                generatedAt: new Date().toISOString(),
                recordId: rewriteRecord.id // 返回记录ID，供前端使用
              }
            }))

          } catch (error) {
            console.error('❌ [爆文改写] 处理生成内容失败:', error)
            
            // 更新数据库记录：标记为失败
            await updateRewriteRecord(rewriteRecord.id, {
              status: 'failed',
              error_message: error instanceof Error ? error.message : '处理生成内容失败',
              completed_at: new Date().toISOString() // 在updateRewriteRecord函数内部会转换为MySQL格式
            })
            
            // 生成失败，退还积分
            console.log(`🔄 [爆文改写] 生成失败，退还积分: ${requiredCredits}`)
            await refundCredits(userId, requiredCredits, '爆文改写失败退还', undefined)
            
            resolve(NextResponse.json(
              { error: '处理生成内容失败' },
              { status: 500 }
            ))
          }
        },
        // onError - 错误回调
        async (errorMessage: string) => {
          console.error('❌ [爆文改写] 生成内容失败:', errorMessage)
          
          // 更新数据库记录：标记为失败
          await updateRewriteRecord(rewriteRecord.id, {
            status: 'failed',
            error_message: errorMessage,
            completed_at: new Date().toISOString() // 在updateRewriteRecord函数内部会转换为MySQL格式
          })
          
          // 生成失败，退还积分
          console.log(`🔄 [爆文改写] 生成失败，退还积分: ${requiredCredits}`)
          await refundCredits(userId, requiredCredits, '爆文改写失败退还', undefined)
          
          resolve(NextResponse.json(
            { error: `生成内容失败: ${errorMessage}` },
            { status: 500 }
          ))
        }
      )
    })

  } catch (error) {
    console.error('❌ [爆文改写] API错误:', error)
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