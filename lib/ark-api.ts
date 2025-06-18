import { ARKMessage, ARKChatRequest, ARKStreamChunk, BatchConfig } from './types'

// 环境变量配置
const ARK_API_URL = process.env.ARK_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const ARK_API_KEY = process.env.ARK_API_KEY || ''
const ARK_MODEL = process.env.ARK_MODEL || 'doubao-seed-1-6-flash-250615'

/**
 * 构建改写提示词
 * @param originalContent 原始笔记内容
 * @param config 批量配置
 * @returns string 构建的提示词
 */
function buildRewritePrompt(originalContent: string, config: BatchConfig): string {
  // 根据配置构建人设提示
  const personaPrompts = {
    default: '你是一名专业的内容创作者',
    expert: '你是一名专业导师，擅长深度解析和指导',
    friend: '你是一位贴心闺蜜，语言亲切温暖',
    humor: '你是一位幽默达人，善于用轻松有趣的方式表达',
    professional: '你是一位商务专业人士，语言严谨专业'
  }

  // 根据配置构建目的提示
  const purposePrompts = {
    default: '创作优质内容',
    brand: '种草推荐产品，提升品牌认知',
    review: '客观测评产品，帮助用户做选择',
    traffic: '吸引用户关注，提升账号活跃度',
    education: '科普知识，帮助用户学习'
  }

  // 根据配置构建内容类型提示
  const typePrompts = {
    auto: '根据原内容特点自动判断最适合的形式',
    article: '图文笔记形式，包含丰富的文字描述和结构化内容',
    video: '口播视频稿形式，语言口语化，适合视频讲解'
  }

  let prompt = `${personaPrompts[config.persona as keyof typeof personaPrompts] || personaPrompts.default}，你的任务是${purposePrompts[config.purpose as keyof typeof purposePrompts] || purposePrompts.default}。

请基于以下原始内容，创作一篇全新的、高质量的小红书内容。要求：

1. 内容形式：${typePrompts[config.type as keyof typeof typePrompts] || typePrompts.auto}
2. 内容要求：
   - 完全原创，不要直接复制原文
   - 保持核心价值和信息点
   - 语言风格符合小红书用户喜好
   - 标题吸引人，内容有价值
   - 适当加入表情符号和话题标签
   - 字数控制在500-1000字之间

3. 结构要求：
   - 开头：吸引眼球的话题引入
   - 主体：详细的内容阐述，分点说明
   - 结尾：总结或互动引导`

  // 如果有特定主题，添加主题要求
  if (config.theme && config.theme.trim()) {
    prompt += `\n4. 主题要求：请围绕"${config.theme.trim()}"这个主题进行创作`
  }

  prompt += `\n\n原始内容：\n${originalContent}\n\n请开始创作：`

  return prompt
}

/**
 * 调用ARK API进行流式文本生成
 * @param messages 消息数组
 * @returns ReadableStream 流式响应
 */
export async function createStreamChatCompletion(messages: ARKMessage[]): Promise<ReadableStream<Uint8Array>> {
  // 检查环境变量配置
  if (!ARK_API_KEY) {
    throw new Error('ARK_API_KEY 环境变量未配置，请在 .env.local 文件中设置')
  }

  // 构建请求参数
  const requestBody: ARKChatRequest = {
    messages,
    model: ARK_MODEL,
    stream: true,
    temperature: 0.7, // 设置一定的创造性
    max_tokens: 2000 // 限制最大生成长度
  }

  console.log('发送ARK API请求:', {
    url: ARK_API_URL,
    model: ARK_MODEL,
    messageCount: messages.length,
    hasKey: !!ARK_API_KEY
  })

  // 发送API请求
  const response = await fetch(ARK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ARK_API_KEY}`
    },
    body: JSON.stringify(requestBody)
  })

  // 检查HTTP响应状态
  if (!response.ok) {
    let errorMessage = `ARK API请求失败: ${response.status} ${response.statusText}`
    
    try {
      const errorData = await response.json()
      if (errorData.error?.message) {
        errorMessage += ` - ${errorData.error.message}`
      }
      console.error('ARK API错误详情:', errorData)
    } catch (e) {
      console.error('无法解析ARK API错误响应:', e)
    }

    // 针对401错误提供特定提示
    if (response.status === 401) {
      errorMessage = 'ARK API认证失败，请检查 ARK_API_KEY 环境变量配置'
    }

    throw new Error(errorMessage)
  }

  // 返回流式响应
  if (!response.body) {
    throw new Error('ARK API响应体为空')
  }

  return response.body
}

/**
 * 解析ARK API的流式响应
 * @param stream 流式响应
 * @param onChunk 处理每个数据块的回调
 * @param onComplete 完成时的回调
 * @param onError 错误时的回调
 */
export async function parseStreamResponse(
  stream: ReadableStream<Uint8Array>,
  onChunk: (content: string) => void,
  onComplete: (fullContent: string) => void,
  onError: (error: string) => void
): Promise<void> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        break
      }

      // 解码数据块
      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      // 按行分割处理
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留最后一个不完整的行

      for (const line of lines) {
        const trimmedLine = line.trim()
        
        // 跳过空行和注释行
        if (!trimmedLine || trimmedLine.startsWith(':')) {
          continue
        }

        // 处理数据行
        if (trimmedLine.startsWith('data: ')) {
          const dataStr = trimmedLine.slice(6) // 移除 "data: " 前缀
          
          // 检查是否为结束标志
          if (dataStr === '[DONE]') {
            onComplete(fullContent)
            return
          }

          try {
            // 解析JSON数据
            const data: ARKStreamChunk = JSON.parse(dataStr)
            
            if (data.choices && data.choices.length > 0) {
              const choice = data.choices[0]
              
              if (choice.delta?.content) {
                const content = choice.delta.content
                fullContent += content
                onChunk(content)
              }

              // 检查是否完成
              if (choice.finish_reason === 'stop') {
                onComplete(fullContent)
                return
              }
            }
          } catch (error) {
            console.error('解析ARK API响应数据失败:', error, 'data:', dataStr)
            // 继续处理下一行，不中断整个流程
          }
        }
      }
    }

    // 流结束但没有收到 [DONE] 标志
    onComplete(fullContent)

  } catch (error) {
    console.error('处理ARK API流式响应失败:', error)
    onError(error instanceof Error ? error.message : '未知错误')
  } finally {
    reader.releaseLock()
  }
}

/**
 * 生成改写内容
 * @param originalContent 原始内容
 * @param config 批量配置
 * @param onChunk 流式内容回调
 * @param onComplete 完成回调
 * @param onError 错误回调
 */
export async function generateRewriteContent(
  originalContent: string,
  config: BatchConfig,
  onChunk: (content: string) => void,
  onComplete: (fullContent: string) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    // 构建消息
    const messages: ARKMessage[] = [
      {
        role: 'system',
        content: '你是一名专业的小红书内容创作者，擅长创作吸引人的优质内容。'
      },
      {
        role: 'user', 
        content: buildRewritePrompt(originalContent, config)
      }
    ]

    // 获取流式响应
    const stream = await createStreamChatCompletion(messages)
    
    // 解析流式响应
    await parseStreamResponse(stream, onChunk, onComplete, onError)

  } catch (error) {
    console.error('生成改写内容失败:', error)
    onError(error instanceof Error ? error.message : '生成内容时发生未知错误')
  }
}

/**
 * 提取笔记标题（从生成的内容中）
 * @param content 生成的内容
 * @returns string 提取的标题
 */
export function extractTitleFromContent(content: string): string {
  // 查找第一行作为标题，或者提取emoji和关键字作为标题
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length === 0) return '无标题'
  
  const firstLine = lines[0].trim()
  
  // 如果第一行太长，截取前50个字符
  if (firstLine.length > 50) {
    return firstLine.substring(0, 47) + '...'
  }
  
  return firstLine
} 