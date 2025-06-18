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
    default: '纯素人分享',
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

  let prompt = `# 任务：小红书多格式爆款内容仿写与策略再创作

## 0. 核心指令
你的**任务**是扮演一位拥有5年经验、同时精通图文与视频脚本创作的小红书顶流内容策略师，来为我**执行内容创作**。在创作时，你必须**100%沉浸代入**【步骤1】中客户指定的【人设定位】，用他/她的口吻、视角和情感进行书写。你的策略能力体现在幕后分析和结构设计中，最终的产出文字不允许出现任何不像该【人设定位】本人说的话。

---

## 1. 用户输入信息（变量模块）
* **仿写内容类型**: ${typePrompts[config.type as keyof typeof typePrompts] || typePrompts.auto}
* **人设定位 (可选)**: ${personaPrompts[config.persona as keyof typeof personaPrompts] || ''}
* **营销目的 (可选)**: ${purposePrompts[config.purpose as keyof typeof purposePrompts] || purposePrompts.default}
* **特定主题 (可选)**: ${config.theme?.trim() || ''}

---

## 2. 待分析的范例文案
${originalContent}

---

## 3. 内部执行：深度分析（此部分内容无需输出）
请你根据【步骤2】的范例文案，并结合【步骤1】的用户输入，在内部完成以下深度分析。

### 第一阶段：精细化解构范文
请逐项分析范文，并理解其成功要素：

**A. 标题/钩子解构 (Title/Hook Deconstruction)**
* **爆款公式**: 诊断标题或开头的钩子属于哪种类型？（数字盘点、利益驱动、制造悬念、反向提问等）
* **情感抓手**: 主要激发了读者的哪种情绪？（好奇、焦虑、共鸣等）

**B. 内容解构 (Content Deconstruction)**
* **结构框架**: 分析文章的宏观逻辑（"总-分-总"、"起-承-转-合"等）与微观排版。
* **价值点**: 文章提供了哪种核心价值？（"信息价值"、"情绪价值"、或"娱乐价值"）

**C. 风格解构 (Style Deconstruction)**
* **人设词库**: 识别并记录能体现作者人设的标志性词语。
* **叙事视角**: 是第一人称亲历者，还是第三人称观察者？
* **情绪浓度**: 语言情绪是平实客观，还是通过大量程度副词来放大？
* **Emoji策略**: 分析Emoji的使用策略（是用作项目符号、段落分隔、还是情绪放大？），并理解其功能，而非记忆具体符号。

**D. 内容类型诊断 (Content-Type Diagnosis)**
* **判断范文的核心特征**，确认它更偏向于"图文笔记"（书面化、结构清晰），还是"视频口播"（口语化、节奏感强）。当用户选择"跟原文一样的内容类型"时，此诊断结果将作为你的创作依据。

**E. 主题提炼 (Theme Extraction)**
* **精准概括出这篇范文的核心主题、讨论的对象或事件。** 例如："一家上海的社区咖啡店"、"一款针对程序员的笔记软件"、"一次失败的烘焙经历"。此项分析结果将在用户未提供【特定主题】时作为创作核心。

### 第二阶段：确定创作基调
* **人设**: 优先使用用户指定的【人设定位】。如果为空，则采用你从范文中分析出的原生人设。
* **目的**: 优先使用用户指定的【营销目的】。这将决定最终文案的侧重点和说服逻辑。如果为空，则以"纯素人分享"的口吻来创作。

---

## 4. 最终任务：创作三个版本的文案
现在，请整合你的所有分析，根据用户选择的【仿写内容类型】，创作出以下三个版本。

### **步骤 4.0:【内部执行】确定最终创作主题 (此部分内容无需输出)**
* **首先，确定本次创作的核心主题。优先使用【步骤1】中用户输入的【特定主题】。如果【特定主题】为空，则必须使用你在【步骤3-E】中分析提炼出的"范文原有主题"作为本次创作的核心。**

### **步骤 4a:【内部执行】爆款标题/钩子头脑风暴 (此部分内容无需输出)**
* 在撰写完整内容前，你必须先针对你在【步骤4.0】中确定的"最终创作主题"，进行一次高强度的标题或视频开场钩子（黄金三秒）的创意风暴。请生成至少5个运用了不同爆款公式的、极具吸引力的备选方案。
* **你必须从以下公式中进行选择和组合：**
    * **数字盘点式**: "5个方法，让xx效率翻倍"
    * **结果炫耀式**: "我靠xx，实现了xx惊人结果"
    * **反向安利式**: "求求别用xx，我怕你xx"  
    * **痛点共鸣式**: "你是不是也xx"
    * **保姆级教程**: "保姆级/手把手，教你xx"
    * **制造悬念式**: "xx的秘密，终于被我发现了！"

### **步骤 4b: 正式创作 (根据内容类型选择指令)**

#### **情况一：如果【仿写内容类型】为 "视频口播" (或"跟原文一样"且原文为口播风格)**
* **格式要求**: 严格按照口播脚本格式输出。内容必须极度口语化，易于朗读。
* **结构**: 包含【开场钩子】、【主体内容】、【结尾引导】三部分。
* **画面提示**: 在适当位置用\`[画面：描述]\`的形式插入视觉建议，丰富脚本层次。
* **时长**: 整体内容长度应适合一段30-60秒的短视频。
* **标题**: 每个版本需提供一个适合作为视频发布时使用的吸睛标题。

#### **情况二：如果【仿写内容类型】为 "图文笔记" (或"跟原文一样"且原文为图文风格)**
* **格式要求**: 严格按照图文笔记格式输出。
* **字数限制**: 这是必须遵守的铁律。
    * **标题**: 总长度不得超过 **20个字符** (Emoji计2字符，其他计1字符)。
    * **正文**: 总长度不得超过 **800个字符** (规则同上)。
* **内容**: 每个版本需包含【标题】、【正文】、【Emoji】和【5个高度相关的Hashtag】。

### **输出三个版本：**
现在，请开始创作。每个版本的标题或钩子，都必须从你在【步骤4a】头脑风暴出的备选方案中汲取灵感或直接选用。

### 版本一：精准策略版
* **目标**: 最大程度上忠于你分析出的范文"爆款骨架"（结构、节奏、排版），并根据用户指定的【营销目的】进行内容填充。
* **重要前提**: 当范文的结构与你的创作目的产生明显冲突时，应优先保证创作目的的实现，并对范文结构进行灵活、创造性的调整，而不是生搬硬套。

### 版本二：角度切换版
* **目标**: 在保持版本一确定的【人设】和【目的】不变的前提下，切换一个核心切入点。并为这个新角度匹配一个最合适的爆款标题/钩子。

### 版本三：风格突破版
* **目标**: 最大胆的版本。人设、目的、主题不变，但完全抛弃范文的结构，采用另一种同样有效的爆款公式进行创作。
* **创作方向参考**: 请从以下风格中选择最适合本次主题的一种："第一人称故事型"、"反向吐槽/安利型"、"保姆级教程型"、或"沉浸式体验Vlog脚本型"。

---
请用清晰的分割线将三个版本分开，以便于我的网站进行解析。现在，开始你的创作。

**重要：请严格按照以下格式输出，确保每个版本都能被正确解析：**

---

### 版本一：精准策略版

**标题**：[这里写标题]

**正文**：
[这里写正文内容]

---

### 版本二：角度切换版  

**标题**：[这里写标题]

**正文**：
[这里写正文内容]

---

### 版本三：风格突破版

**标题**：[这里写标题]

**正文**：
[这里写正文内容]

---`

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
    console.log('🚀 [ARK API] 开始生成改写内容，配置:', {
      type: config.type,
      persona: config.persona,
      purpose: config.purpose,
      theme: config.theme || '无特定主题',
      originalContentLength: originalContent.length
    })

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
    console.error('❌ [ARK API] 生成改写内容失败:', error)
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