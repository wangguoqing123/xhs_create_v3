import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getProfile, consumeCredits, refundCredits } from '@/lib/mysql'
import { createStreamChatCompletion } from '@/lib/ark-api'
import type { ARKMessage } from '@/lib/types'

// POST - AI生成账号定位
export async function POST(request: NextRequest) {
  try {
    // 从Cookie中获取JWT令牌
    const token = request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未提供认证信息' },
        { status: 401 }
      )
    }

    // 验证JWT令牌
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '用户认证失败' },
        { status: 401 }
      )
    }

    const userId = payload.userId

    // 解析请求体
    const body = await request.json()
    const { keywords } = body

    // 验证必填字段
    if (!keywords || typeof keywords !== 'string' || keywords.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '关键词不能为空' },
        { status: 400 }
      )
    }

    // 检查用户积分是否足够
    console.log('🔍 [AI生成定位] 开始检查用户积分，用户ID:', userId)
    const { data: profile, error: profileError } = await getProfile(userId)
    if (profileError || !profile) {
      console.error('❌ [AI生成定位] 获取用户信息失败:', profileError)
      return NextResponse.json(
        { success: false, error: '获取用户信息失败' },
        { status: 500 }
      )
    }

    const requiredCredits = 1 // AI生成账号定位消耗1积分
    if (profile.credits < requiredCredits) {
      console.log('❌ [AI生成定位] 积分不足:', {
        required: requiredCredits,
        current: profile.credits
      })
      return NextResponse.json(
        { success: false, error: '积分不足', required: requiredCredits, current: profile.credits },
        { status: 400 }
      )
    }

    console.log('🚀 [AI生成定位] 开始生成内容:', {
      userId,
      keywords: keywords.trim(),
      userCredits: profile.credits
    })

    // 先扣除积分
    console.log(`💰 [AI生成定位] 开始扣除积分: ${requiredCredits}，用户ID: ${userId}`)
    const { success: creditSuccess, error: creditError } = await consumeCredits(
      userId,
      requiredCredits,
      'AI生成账号定位',
      undefined
    )

    if (!creditSuccess) {
      console.error('❌ [AI生成定位] 积分扣除失败:', creditError)
      return NextResponse.json(
        { success: false, error: creditError || '积分扣除失败' },
        { status: 400 }
      )
    }

    console.log('✅ [AI生成定位] 积分扣除成功')

    try {
      // 构建AI提示词
      const prompt = buildAccountPositioningPrompt(keywords.trim())
      
      // 构建消息
      const messages: ARKMessage[] = [
        {
          role: 'system',
          content: '你是一名专业的小红书账号定位策略师，擅长根据用户描述创建精准的账号定位。请严格按照要求的JSON格式返回结果。'
        },
        {
          role: 'user',
          content: prompt
        }
      ]

      // 调用豆包API
      const stream = await createStreamChatCompletion(messages)
      
      // 解析流式响应
      let fullContent = ''
      const reader = stream.getReader()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = new TextDecoder().decode(value)
          const lines = chunk.split('\n').filter(line => line.trim())
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              
              try {
                const parsed = JSON.parse(data)
                if (parsed.choices?.[0]?.delta?.content) {
                  fullContent += parsed.choices[0].delta.content
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      console.log('🤖 [AI生成定位] AI生成原始内容:', fullContent)

      // 解析AI生成的内容
      const parsedResult = parseAccountPositioningResult(fullContent)
      
      if (!parsedResult) {
        // AI生成失败，退还积分
        console.log(`🔄 [AI生成定位] AI解析失败，退还积分: ${requiredCredits}`)
        await refundCredits(userId, requiredCredits, 'AI生成定位失败退还', undefined)
        
        return NextResponse.json(
          { success: false, error: 'AI生成内容解析失败，请重试' },
          { status: 500 }
        )
      }

      console.log('✅ [AI生成定位] 生成成功:', parsedResult)

      return NextResponse.json({
        success: true,
        data: parsedResult,
        message: 'AI生成账号定位成功'
      })

    } catch (error) {
      console.error('❌ [AI生成定位] AI调用失败:', error)
      
      // AI调用失败，退还积分
      console.log(`🔄 [AI生成定位] AI调用失败，退还积分: ${requiredCredits}`)
      await refundCredits(userId, requiredCredits, 'AI生成定位失败退还', undefined)
      
      return NextResponse.json(
        { success: false, error: `AI生成失败: ${error instanceof Error ? error.message : '未知错误'}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ [AI生成定位] API错误:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

/**
 * 构建账号定位AI提示词
 * @param keywords 用户输入的关键词
 * @returns 提示词字符串
 */
function buildAccountPositioningPrompt(keywords: string): string {
  return `# 小红书账号定位AI生成

## 用户描述
${keywords}

## 任务目标
根据用户描述，创建精准的小红书账号定位，包含6个核心维度，每个维度内容简洁有力。

## 输出要求

**1. 账号定位命名** - 8-12字
- 体现专业特色和个人优势
- 简洁易记，避免复杂词汇

**2. 一句话定位** - 15-25字  
- 核心价值主张，突出差异化
- 语言生动，具有吸引力

**3. 核心价值** - 40-60字
- 用户能获得的具体价值
- 突出专业性和实用性

**4. 目标用户** - 30-45字
- 精准的用户画像描述
- 包含年龄、需求、特征

**5. 关键人设** - 20-30字
- 鲜明的个人形象特点
- 建立信任感和亲和力

**6. 核心风格** - 8-15字
- 内容创作风格定位
- 简洁有力，易于执行

## 输出格式
请严格按照以下JSON格式返回结果，不要包含任何其他内容：

\`\`\`json
{
  "name": "账号定位命名",
  "slogan": "一句话定位", 
  "coreValue": "核心价值描述",
  "targetUser": "目标用户描述",
  "keyPersona": "关键人设描述", 
  "coreStyle": "核心风格描述"
}
\`\`\`

## 关键原则
- 内容精准，避免冗余
- 突出核心优势
- 确保可操作性
- 符合小红书平台调性

请根据用户描述，创建简洁精准的账号定位。`
}

/**
 * 解析AI生成的账号定位结果
 * @param content AI生成的原始内容
 * @returns 解析后的结果对象或null
 */
function parseAccountPositioningResult(content: string): {
  name: string
  slogan: string
  coreValue: string
  targetUser: string
  keyPersona: string
  coreStyle: string
} | null {
  try {
    // 尝试提取JSON内容
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0]
      const parsed = JSON.parse(jsonStr)
      
      // 验证必要字段
      if (parsed.name && parsed.slogan && parsed.coreValue && 
          parsed.keyPersona && parsed.coreStyle) {
        return {
          name: parsed.name.trim(),
          slogan: parsed.slogan.trim(),
          coreValue: parsed.coreValue.trim(),
          targetUser: parsed.targetUser?.trim() || '',
          keyPersona: parsed.keyPersona.trim(),
          coreStyle: parsed.coreStyle.trim()
        }
      }
    }
    
    // 如果JSON解析失败，尝试文本解析
    return parseAccountPositioningFromText(content)
    
  } catch (error) {
    console.error('解析AI生成内容失败:', error)
    return parseAccountPositioningFromText(content)
  }
}

/**
 * 从文本中解析账号定位信息
 * @param content 文本内容
 * @returns 解析后的结果对象或null
 */
function parseAccountPositioningFromText(content: string): {
  name: string
  slogan: string
  coreValue: string
  targetUser: string
  keyPersona: string
  coreStyle: string
} | null {
  try {
    // 使用正则表达式提取各个字段
    const nameMatch = content.match(/(?:账号定位命名|name)[：:]\s*([^\n]+)/i)
    const sloganMatch = content.match(/(?:一句话定位|slogan)[：:]\s*([^\n]+)/i)
    const coreValueMatch = content.match(/(?:核心价值|coreValue)[：:]\s*([^\n]+)/i)
    const targetUserMatch = content.match(/(?:目标用户|targetUser)[：:]\s*([^\n]+)/i)
    const keyPersonaMatch = content.match(/(?:关键人设|keyPersona)[：:]\s*([^\n]+)/i)
    const coreStyleMatch = content.match(/(?:核心风格|coreStyle)[：:]\s*([^\n]+)/i)
    
    if (nameMatch && sloganMatch && coreValueMatch && keyPersonaMatch && coreStyleMatch) {
      return {
        name: nameMatch[1].trim(),
        slogan: sloganMatch[1].trim(),
        coreValue: coreValueMatch[1].trim(),
        targetUser: targetUserMatch?.[1]?.trim() || '',
        keyPersona: keyPersonaMatch[1].trim(),
        coreStyle: coreStyleMatch[1].trim()
      }
    }
    
    return null
  } catch (error) {
    console.error('文本解析失败:', error)
    return null
  }
} 