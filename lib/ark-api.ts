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
    default: '',
    expert: '一个长期在该领域深耕的专业导师',
    friend: '一个贴心闺蜜',
    humor: '一个幽默风趣的达人',
    professional: '一个商务专业人士'
  }

  // 根据配置构建目的提示
  const purposePrompts = {
    '': '按照原文的目的和口吻进行分享', // 空值默认按原文目的和口吻
    default: '按照原文的目的和口吻进行分享',
    'share-experience': '分享经验',
    'product-review': '产品测评',
    'tutorial-guide': '教程攻略',
    'daily-life': '日常记录',
    'recommendation': '好物推荐',
    'problem-solving': '问题解答',
    'inspiration-sharing': '灵感分享',
    'trend-analysis': '趋势分析',
    'personal-story': '个人故事',
    'knowledge-sharing': '知识科普',
    // 保持向后兼容
    brand: '种草',
    review: '种草', 
    traffic: '引流',
    education: '纯素人分享'
  }

  // 根据配置构建内容类型提示
  const typePrompts = {
    auto: '跟原文一样的内容类型',
    article: '图文笔记',
    video: '视频口播'
  }

  const prompt = `# 任务：基于可选深度定位的小红书爆款图文笔记创作

## 0. 核心指令
你的**任务**是扮演一位顶级的小红书内容策略总监。你将根据客户提供的简报（briefing）和一篇爆款范文，为客户的账号创作出**两版**风格统一但角度不同的高质量图文笔记。你的工作核心是深度理解客户意图，并灵活调用范文的成功框架。

---

## 1. 用户输入信息（客户简报）

### a. 改写主题 (Rewrite Topic) (可选)
* [用户输入的核心主题。**如果此项为空，你将自动分析并使用范文的原有主题进行改写**]
* 实际内容：${config.theme?.trim() || ''}

### b. 账号定位 (Account Positioning) (可选)
* **一句话定位**: [例如："一个帮助打工人实现WLB（工作生活平衡）的效率教练"]
* **核心价值**: [例如："提供不内卷、可持续的个人成长方法论"]
* **目标用户**: [例如："25-35岁，在一线城市感到迷茫和疲惫的职场人"]
* **关键人设**: [例如："清醒的旁观者、温柔的陪伴者、务实的实践家"]
* **核心风格**: [例如："理性、真诚、有温度、逻辑清晰、拒绝贩卖焦虑"]
* **实际内容**: ${config.accountPositioning?.trim() || ''}
* **注意：如果此"账号定位"部分整体为空，你将在后续步骤中被要求模仿范文的人设与风格。**

### c. 营销目的 (Marketing Purpose) (可选)
* [用户选择的目的："引流"、"种草"或"纯素人分享"。如果为空，则默认为"纯素人分享"]
* 实际内容：${purposePrompts[config.purpose as keyof typeof purposePrompts] || purposePrompts.default}

### d. SEO关键词 (SEO Keywords) (可选)
* [一个或多个关键词，用逗号分隔，例如："职场成长, 个人提升, WLB, 效率工具"]
* 实际内容：${config.keywords && config.keywords.length > 0 ? config.keywords.join(', ') : ''}

---

## 2. 待分析的范例文案
${originalContent}

---

## 3. 内部执行：深度分析与策略制定（此部分内容无需输出）

### 第一阶段：拆解爆款范文框架
你将拆解范文，以学习其**成功的底层结构、节奏、人设和风格**。
* **标题公式分析**: 诊断范文标题的爆款类型。
* **结构节奏分析**: 分析范文的行文结构、段落排版和阅读节奏。
* **互动引导分析**: 分析其结尾的号召性用语（CTA）是如何设计的。
* **人设风格提炼**: 分析并概括出范文的作者人设与核心写作风格。
* **核心主题提炼**: 如果用户未提供【改写主题】，则必须从此项分析中得出创作主题。

### 第二阶段：制定创作核心策略
1.  **确定核心人设与风格**: 这是所有创作的基石。
    * **优先方案**: 如果用户在【步骤1-b】中提供了【账号定位】，则必须将该定位的五要素完全吸收内化。后续创作必须严格符合此定位。
    * **备用方案**: 如果【账号定位】为空，则必须使用你在【步骤3-第一阶段】中提炼出的"范文人设风格"作为创作基石。
2.  **确定最终主题**: 优先使用用户在【步骤1-a】中输入的【改写主题】。如果该项为空，则使用你在【步骤3-第一阶段】中提炼出的"核心主题"进行创作。
3.  **制定SEO策略**: 分析【步骤1-d】中的所有SEO关键词。你的任务**不是**把所有词都塞进去，而是**智能地判断和挑选**出1-2个与"最终主题"最相关、最能带来流量的关键词，并思考如何将它们**自然无痕地**融入到文案中。

---

## 4. 最终任务：创作两版图文笔记
现在，请整合你的所有分析和策略，开始创作。

### **步骤 4a:【内部执行】爆款标题头脑风暴 (此部分内容无需输出)**
在撰写完整内容前，你必须先针对你在【步骤3】中确定的"最终创作主题"，进行一次高强度的标题创意风暴。请生成至少5个运用了不同爆款公式的、极具吸引力的备选方案。
* **你必须从以下公式中进行选择和组合：**
    * **数字盘点式**: "5个方法，让xx效率翻倍"
    * **结果炫耀式**: "我靠xx，实现了xx惊人结果"
    * **反向安利式**: "求求别用xx，我怕你xx"
    * **痛点共鸣式**: "你是不是也xx"
    * **保姆级教程**: "保姆级/手把手，教你xx"
    * **制造悬念式**: "xx的秘密，终于被我发现了！"

### **步骤 4b: 正式创作 (输出两版文案)**

**【核心创作规则】**
* **格式**: 严格按照小红书图文笔记格式，包含【标题】、【正文】、【Emoji】和【5个高度相关的Hashtag】。
* **字数**: **标题**不超过20字符，**正文**不超过800字符（Emoji计2字符，其他计1字符）。
* **标题**: 两个版本的标题都必须从你在【步骤4a】头脑风暴出的备选方案中汲取灵感或直接选用，确保其符合爆款特质。

### 版本一：经典策略版
* **目标**: 将你在【步骤3】中确定的"核心人设与风格"与分析出的"范文成功框架"进行完美结合。使用范文的结构和节奏，来讲述你自己的主题和内容。此版本追求**稳妥和高效**，确保内容的可读性和传播性。

### 版本二：人设深耕版
* **目标**: 在保持主题不变的前提下，更侧重于**深化和凸显你在【步骤3】中确定的"核心人设与风格"**。你可以稍微调整结构，使用更强的第一人称视角、讲述一个个人故事、或分享一个更深刻的个人感悟，让读者能强烈地感受到这个账号独特的魅力和温度。此版本追求**强共鸣和高粘性**。

---
请用清晰的分割线将两个版本分开，以便于我的网站进行解析。现在，开始你的创作。

**重要：请严格按照以下格式输出，确保每个版本都能被正确解析：**

---

### 版本一：经典策略版

**标题**：[这里写标题]

**正文**：
[这里写正文内容]

---

### 版本二：人设深耕版

**标题**：[这里写标题]

**正文**：
[这里写正文内容]

---`

  return prompt
}

/**
 * 构建批量改写提示词（生成2个版本）
 * @param originalContent 原始笔记内容
 * @param config 批量配置
 * @returns string 构建的提示词
 */
function buildBatchRewritePrompt(originalContent: string, config: BatchConfig): string {
  // 复用单次改写的提示词逻辑，确保一致性和质量
  return buildRewritePrompt(originalContent, config)
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
    max_tokens: 2000, // 限制最大生成长度
    stream_options: {
      include_usage: true // 在流式响应中包含tokens使用统计
    }
  }

  console.log('发送ARK API请求:', {
    url: ARK_API_URL,
    model: ARK_MODEL,
    messageCount: messages.length,
    hasKey: !!ARK_API_KEY,
    stream: requestBody.stream,
    includeUsage: requestBody.stream_options?.include_usage
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
  let totalTokens = { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 }
  let hasReceivedTokens = false

  console.log('🚀 [ARK API] 开始解析流式响应')

  try {
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        console.log('📡 [ARK API] 流式响应读取完成')
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
            console.log('🏁 [ARK API] 收到结束标志 [DONE]')
            if (hasReceivedTokens && totalTokens.total_tokens > 0) {
              console.log('📊 [ARK API] 流式响应完成，最终Tokens使用统计:', {
                prompt_tokens: totalTokens.prompt_tokens,
                completion_tokens: totalTokens.completion_tokens,
                total_tokens: totalTokens.total_tokens
              })
            } else {
              console.log('⚠️ [ARK API] 未收到tokens使用统计信息')
              console.log('💡 [ARK API] 已设置include_usage=true但仍未收到tokens统计')
            }
            onComplete(fullContent)
            return
          }

          try {
            // 解析JSON数据
            const data: ARKStreamChunk = JSON.parse(dataStr)
            
            // 打印原始响应数据用于调试（只在有特殊情况时打印）
            if (data.usage || data.choices?.[0]?.finish_reason) {
              console.log('📥 [ARK API] 收到特殊响应数据:', {
                hasChoices: !!(data.choices && data.choices.length > 0),
                hasUsage: !!data.usage,
                finishReason: data.choices?.[0]?.finish_reason,
                hasContent: !!(data.choices?.[0]?.delta?.content),
                rawUsage: data.usage
              })
            }
            
            // 检查并处理tokens使用情况
            if (data.usage) {
              totalTokens = {
                completion_tokens: data.usage.completion_tokens || 0,
                prompt_tokens: data.usage.prompt_tokens || 0,
                total_tokens: data.usage.total_tokens || 0
              }
              hasReceivedTokens = true
              console.log('🔥 [ARK API] 收到Tokens使用统计:', {
                prompt_tokens: totalTokens.prompt_tokens,
                completion_tokens: totalTokens.completion_tokens,
                total_tokens: totalTokens.total_tokens
              })
            }
            
            if (data.choices && data.choices.length > 0) {
              const choice = data.choices[0]
              
              if (choice.delta?.content) {
                const content = choice.delta.content
                fullContent += content
                onChunk(content)
              }

              // 检查是否完成
              if (choice.finish_reason === 'stop') {
                console.log('🛑 [ARK API] 收到完成信号 finish_reason=stop')
                
                // 如果在这个响应中包含usage信息，再次打印
                if (data.usage && !hasReceivedTokens) {
                  totalTokens = {
                    completion_tokens: data.usage.completion_tokens || 0,
                    prompt_tokens: data.usage.prompt_tokens || 0,
                    total_tokens: data.usage.total_tokens || 0
                  }
                  hasReceivedTokens = true
                  console.log('🔥 [ARK API] 在完成响应中收到Tokens统计:', {
                    prompt_tokens: totalTokens.prompt_tokens,
                    completion_tokens: totalTokens.completion_tokens,
                    total_tokens: totalTokens.total_tokens
                  })
                }
                
                if (hasReceivedTokens && totalTokens.total_tokens > 0) {
                  console.log('📊 [ARK API] 生成完成，最终Tokens使用统计:', {
                    prompt_tokens: totalTokens.prompt_tokens,
                    completion_tokens: totalTokens.completion_tokens,
                    total_tokens: totalTokens.total_tokens
                  })
                } else {
                  console.log('⚠️ [ARK API] 生成完成但未收到tokens统计')
                  console.log('💡 [ARK API] 可能的原因：')
                  console.log('   1. ARK API版本不支持stream_options.include_usage参数')
                  console.log('   2. 当前模型不返回tokens统计信息')
                  console.log('   3. API配置问题，请检查ARK API文档')
                }
                
                onComplete(fullContent)
                return
              }
            }
          } catch (error) {
            console.error('❌ [ARK API] 解析响应数据失败:', error, 'data:', dataStr.substring(0, 200) + '...')
            // 继续处理下一行，不中断整个流程
          }
        }
      }
    }

    // 流结束但没有收到 [DONE] 标志
    console.log('📡 [ARK API] 流结束，未收到[DONE]标志')
    if (hasReceivedTokens && totalTokens.total_tokens > 0) {
      console.log('📊 [ARK API] 流结束，最终Tokens使用统计:', {
        prompt_tokens: totalTokens.prompt_tokens,
        completion_tokens: totalTokens.completion_tokens,
        total_tokens: totalTokens.total_tokens
      })
    } else {
      console.log('⚠️ [ARK API] 流结束但未收到tokens统计信息')
      console.log('💡 [ARK API] 请检查ARK API是否支持stream_options.include_usage参数')
    }
    onComplete(fullContent)

  } catch (error) {
    console.error('❌ [ARK API] 处理流式响应失败:', error)
    onError(error instanceof Error ? error.message : '未知错误')
  } finally {
    reader.releaseLock()
  }
}

/**
 * 生成改写内容（爆文改写，2个版本）
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
    console.log('🚀 [ARK API] 开始生成改写内容，原始内容长度:', originalContent.length)
    
    // 构建消息数组
    const messages: ARKMessage[] = [
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
    console.error('❌ [ARK API] 生成改写内容失败:', error)
    onError(error instanceof Error ? error.message : '生成内容时发生未知错误')
  }
}

/**
 * 生成批量改写内容（批量改写，2个版本）
 * @param originalContent 原始内容
 * @param config 批量配置
 * @param onChunk 流式内容回调
 * @param onComplete 完成回调
 * @param onError 错误回调
 */
export async function generateBatchRewriteContent(
  originalContent: string,
  config: BatchConfig,
  onChunk: (content: string) => void,
  onComplete: (fullContent: string) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    console.log('🚀 [ARK API] 开始生成批量改写内容，原始内容长度:', originalContent.length)
    
    // 构建消息数组
    const messages: ARKMessage[] = [
      {
        role: 'user',
        content: buildBatchRewritePrompt(originalContent, config)
      }
    ]

    // 获取流式响应
    const stream = await createStreamChatCompletion(messages)
    
    // 解析流式响应
    await parseStreamResponse(stream, onChunk, onComplete, onError)

  } catch (error) {
    console.error('❌ [ARK API] 生成批量改写内容失败:', error)
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

/**
 * 解析两个版本的内容（专门用于爆文改写）
 * @param fullContent 完整的AI生成内容
 * @returns Array<{title: string, content: string}> 两个版本的内容数组
 */
export function parseTwoVersions(fullContent: string): Array<{title: string, content: string}> {
  const versions: Array<{title: string, content: string}> = []
  
  try {
    console.log('🔍 [爆文改写] 开始解析两个版本的内容，原始内容长度:', fullContent.length)
    
    // 方法1：寻找明确的版本标识符
    const version1Patterns = [
      /###\s*版本一[：:：]\s*经典策略版/gi,
      /版本一[：:：]\s*经典策略版/gi,
      /###\s*版本一[：:：]/gi,
      /版本一[：:：]/gi
    ]
    
    const version2Patterns = [
      /###\s*版本二[：:：]\s*人设深耕版/gi,
      /版本二[：:：]\s*人设深耕版/gi,
      /###\s*版本二[：:：]/gi,
      /版本二[：:：]/gi
    ]
    
    let version1Match = null
    let version2Match = null
    
    // 尝试匹配版本标识符
    for (const pattern of version1Patterns) {
      version1Match = fullContent.match(pattern)
      if (version1Match) {
        console.log('🔍 [爆文改写] 找到版本一标识符:', version1Match[0])
        break
      }
    }
    
    for (const pattern of version2Patterns) {
      version2Match = fullContent.match(pattern)
      if (version2Match) {
        console.log('🔍 [爆文改写] 找到版本二标识符:', version2Match[0])
        break
      }
    }
    
    let sections: string[] = []
    
    if (version1Match && version2Match) {
      // 找到了明确的版本标识符，直接分割
      const v1Index = fullContent.indexOf(version1Match[0])
      const v2Index = fullContent.indexOf(version2Match[0])
      
      if (v1Index !== -1 && v2Index !== -1 && v1Index < v2Index) {
        const v1Start = v1Index + version1Match[0].length
        const v2Start = v2Index + version2Match[0].length
        
        sections = [
          fullContent.substring(v1Start, v2Index).trim(),
          fullContent.substring(v2Start).trim()
        ]
        console.log('🔍 [爆文改写] 使用版本标识符分割，得到2个sections')
      }
    }
    
    // 方法2：如果版本标识符方法失败，尝试分割线方法
    if (sections.length < 2) {
      console.log('🔍 [爆文改写] 版本标识符方法失败，尝试分割线方法')
      
             // 寻找有效的分割线（前后都有实质内容）
       const allSections = fullContent.split(/---+/)
       const validSections: string[] = []
      
      for (let i = 0; i < allSections.length; i++) {
        const section = allSections[i].trim()
        
        // 过滤掉太短的section（可能是空白或无意义内容）
        if (section.length > 100) {
          // 检查是否包含标题和正文标识符
          const hasTitle = section.includes('**标题**') || section.includes('标题：') || section.includes('标题:')
          const hasContent = section.includes('**正文**') || section.includes('正文：') || section.includes('正文:')
          
          if (hasTitle || hasContent || section.length > 200) {
            validSections.push(section)
          }
        }
      }
      
      console.log('🔍 [爆文改写] 分割线方法找到有效sections:', validSections.length)
      
      if (validSections.length >= 2) {
        sections = validSections.slice(0, 2)
      }
    }
    
    // 方法3：如果前两种方法都失败，尝试智能分割
    if (sections.length < 2) {
      console.log('🔍 [爆文改写] 分割线方法失败，尝试智能分割')
      
             // 寻找可能的分割点
       const lines = fullContent.split('\n')
       const splitPoints: number[] = []
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // 寻找可能的标题行
        if (line.includes('**标题**') || 
            line.includes('标题：') || 
            line.includes('标题:') ||
            (line.length > 10 && line.length < 50 && 
             (line.includes('绍兴') || line.includes('施工') || line.includes('装修')))) {
          splitPoints.push(i)
        }
      }
      
      console.log('🔍 [爆文改写] 找到可能的分割点:', splitPoints.length)
      
      if (splitPoints.length >= 2) {
        const midPoint = Math.floor(lines.length / 2)
        const secondSplit = splitPoints.find(p => p > midPoint) || splitPoints[1]
        
        sections = [
          lines.slice(0, secondSplit).join('\n').trim(),
          lines.slice(secondSplit).join('\n').trim()
        ]
      }
    }
    
    console.log('🔍 [爆文改写] 最终分割后的sections数量:', sections.length)
    
    // 处理每个版本
    for (let i = 0; i < 2; i++) {
      let versionContent = ''
      let title = i === 0 ? '经典策略版' : '人设深耕版'
      
      if (sections.length > i && sections[i]) {
        versionContent = sections[i].trim()
        
        // 清理版本标识符
        versionContent = versionContent
          .replace(/^###\s*版本[一二][：:：].*?\n/gm, '')
          .replace(/^版本[一二][：:：].*?\n/gm, '')
          .trim()
        
        // 提取标题
        const titlePatterns = [
          /\*\*标题\*\*[：:]\s*(.+?)(?=\n|\*\*正文\*\*)/,
          /标题[：:]\s*(.+?)(?=\n)/,
          /^(.+?)(?=\n)/
        ]
        
        for (const pattern of titlePatterns) {
          const titleMatch = versionContent.match(pattern)
          if (titleMatch && titleMatch[1]) {
            const extractedTitle = titleMatch[1].trim()
            if (extractedTitle.length > 5 && extractedTitle.length < 100) {
              title = extractedTitle
              // 移除标题行
              versionContent = versionContent.replace(pattern, '').trim()
              break
            }
          }
        }
        
        // 提取正文
        const contentMatch = versionContent.match(/\*\*正文\*\*[：:]\s*([\s\S]*)/)
        if (contentMatch) {
          versionContent = contentMatch[1].trim()
        }
        
        // 清理多余的空行和格式
        versionContent = versionContent
          .replace(/\n{3,}/g, '\n\n')
          .replace(/^\s*\n+/, '')
          .replace(/\n+\s*$/, '')
          .trim()
        
        console.log(`🔍 [爆文改写] 版本${i + 1} 解析结果:`, {
          title: title,
          contentLength: versionContent.length,
          contentPreview: versionContent.substring(0, 100) + '...'
        })
      }
      
      versions.push({
        title: title || (i === 0 ? '经典策略版' : '人设深耕版'),
        content: versionContent || ''
      })
    }
    
    // 验证解析结果
    const validVersions = versions.filter(v => v.content.length > 20)
    if (validVersions.length === 0) {
      console.warn('⚠️ [爆文改写] 没有解析出有效的版本内容，使用原始内容')
      const defaultTitle = extractTitleFromContent(fullContent)
      return [
        { title: defaultTitle + ' - 经典策略版', content: fullContent },
        { title: defaultTitle + ' - 人设深耕版', content: fullContent }
      ]
    }
    
    // 如果只解析出一个版本，复制为两个版本
    if (validVersions.length === 1) {
      const firstValid = validVersions[0]
      return [
        { title: firstValid.title, content: firstValid.content },
        { title: firstValid.title + ' - 人设深耕版', content: firstValid.content }
      ]
    }
    
    console.log('✅ [爆文改写] 最终解析结果:', versions.map(v => ({ title: v.title, contentLength: v.content.length })))
    return versions.slice(0, 2) // 确保只返回两个版本
    
  } catch (error) {
    console.error('❌ [爆文改写] 解析两个版本内容失败:', error)
    
    // 出错时返回默认版本
    const defaultTitle = extractTitleFromContent(fullContent)
    return [
      { title: defaultTitle + ' - 经典策略版', content: fullContent },
      { title: defaultTitle + ' - 人设深耕版', content: fullContent }
    ]
  }
}

/**
 * 解析三个版本的内容
 * @param fullContent 完整的AI生成内容
 * @returns Array<{title: string, content: string}> 三个版本的内容数组
 */
export function parseThreeVersions(fullContent: string): Array<{title: string, content: string}> {
  const versions: Array<{title: string, content: string}> = []
  
  try {
    console.log('开始解析三个版本的内容，原始内容长度:', fullContent.length)
    
    // 先尝试用分割线分割
    let sections = fullContent.split(/---+/).filter(section => section.trim().length > 50)
    
    // 如果分割线方式不行，尝试用版本标识符分割
    if (sections.length < 3) {
      // 寻找版本标识符的位置
      const version1Patterns = [
        /###\s*版本一[：:：]/,
        /版本一[：:：]\s*精准策略版/,
        /版本一[：:：]/
      ]
      const version2Patterns = [
        /###\s*版本二[：:：]/,
        /版本二[：:：]\s*角度切换版/,
        /版本二[：:：]/
      ]
      const version3Patterns = [
        /###\s*版本三[：:：]/,
        /版本三[：:：]\s*风格突破版/,
        /版本三[：:：]/
      ]
      
      let version1Match, version2Match, version3Match
      
      // 尝试匹配各种模式
      for (const pattern of version1Patterns) {
        version1Match = fullContent.match(pattern)
        if (version1Match) break
      }
      for (const pattern of version2Patterns) {
        version2Match = fullContent.match(pattern)
        if (version2Match) break
      }
      for (const pattern of version3Patterns) {
        version3Match = fullContent.match(pattern)
        if (version3Match) break
      }
      
      if (version1Match && version2Match && version3Match) {
        const v1Start = version1Match.index! + version1Match[0].length
        const v2Start = version2Match.index! + version2Match[0].length
        const v3Start = version3Match.index! + version3Match[0].length
        
        sections = [
          fullContent.substring(v1Start, version2Match.index!).trim(),
          fullContent.substring(v2Start, version3Match.index!).trim(),
          fullContent.substring(v3Start).trim()
        ]
      }
    }
    
    console.log('分割后的sections数量:', sections.length)
    
    // 处理每个版本
    for (let i = 0; i < 3; i++) {
      let versionContent = ''
      let title = `版本${i + 1}`
      
      if (sections.length > i && sections[i]) {
        versionContent = sections[i].trim()
        
        // 清理版本标识符
        versionContent = versionContent
          .replace(/^###\s*版本[一二三][：:：].*?\n/, '')
          .replace(/^版本[一二三][：:：].*?\n/, '')
          .trim()
        
        // 提取标题和正文
        const titleMatch = versionContent.match(/\*\*标题\*\*[：:]\s*(.+?)(?=\n|\*\*正文\*\*)/)
        if (titleMatch) {
          title = titleMatch[1].trim()
          // 移除标题部分，保留正文
          versionContent = versionContent.replace(/\*\*标题\*\*[：:].*?(?=\*\*正文\*\*)/, '')
        }
        
        // 提取正文
        const contentMatch = versionContent.match(/\*\*正文\*\*[：:]\s*([\s\S]*)/)
        if (contentMatch) {
          versionContent = contentMatch[1].trim()
        } else {
          // 如果没有明确的正文标识，尝试其他方式提取标题
          const lines = versionContent.split('\n').filter(line => line.trim())
          if (lines.length > 0) {
            // 寻找标题行
            for (const line of lines.slice(0, 5)) {
              const cleanLine = line.trim()
              if (cleanLine.includes('**标题**') || cleanLine.includes('标题：') || cleanLine.includes('标题:')) {
                title = cleanLine
                  .replace(/\*\*标题\*\*[：:]\s*/, '')
                  .replace(/标题[：:]\s*/, '')
                  .trim()
                // 移除标题行
                versionContent = lines.slice(lines.indexOf(line) + 1).join('\n').trim()
                break
              }
            }
            
            // 如果还没找到标题，使用第一行作为标题
            if (title === `版本${i + 1}` && lines.length > 1) {
              const firstLine = lines[0].trim()
              if (firstLine.length < 50 && firstLine.length > 5) {
                title = firstLine.replace(/\*\*/g, '').trim()
                versionContent = lines.slice(1).join('\n').trim()
              }
            }
          }
        }
        
        console.log(`版本${i + 1} 解析结果:`, {
          title: title,
          contentLength: versionContent.length,
          contentPreview: versionContent.substring(0, 100) + '...'
        })
      }
      
      versions.push({
        title: title || `版本${i + 1}`,
        content: versionContent || ''
      })
    }
    
    // 验证解析结果
    const validVersions = versions.filter(v => v.content.length > 20)
    if (validVersions.length === 0) {
      console.warn('没有解析出有效的版本内容，使用原始内容')
      const defaultTitle = extractTitleFromContent(fullContent)
      return [
        { title: defaultTitle + ' - 版本1', content: fullContent },
        { title: defaultTitle + ' - 版本2', content: fullContent },
        { title: defaultTitle + ' - 版本3', content: fullContent }
      ]
    }
    
    // 如果只解析出部分版本，用第一个版本填充
    while (versions.length < 3) {
      const firstValid = validVersions[0]
      versions.push({
        title: firstValid.title + ` - 版本${versions.length + 1}`,
        content: firstValid.content
      })
    }
    
    console.log('最终解析结果:', versions.map(v => ({ title: v.title, contentLength: v.content.length })))
    return versions
    
  } catch (error) {
    console.error('解析三个版本内容失败:', error)
    
    // 出错时返回默认版本
    const defaultTitle = extractTitleFromContent(fullContent)
    return [
      { title: defaultTitle + ' - 版本1', content: fullContent },
      { title: defaultTitle + ' - 版本2', content: fullContent },
      { title: defaultTitle + ' - 版本3', content: fullContent }
    ]
  }
} 