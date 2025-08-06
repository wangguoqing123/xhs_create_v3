import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getProfile, consumeCredits, getPool } from '@/lib/mysql'
import { 
  createCreativeInspirationSession, 
  updateCreativeInspirationSession,
  createCreativeInspirationTopics 
} from '@/lib/mysql'
import { searchXiaohongshuNotes } from '@/lib/coze-api'
import { createStreamChatCompletion, parseStreamResponse } from '@/lib/ark-api'
import { 
  CREATIVE_INSPIRATION_PROMPT, 
  CREDITS_CONFIG, 
  VALIDATION_RULES, 
  API_CONFIG,
  SEARCH_CONFIG,
  ERROR_MESSAGES,
  PATTERNS,
  DEFAULT_VALUES
} from '@/lib/creative-inspiration-constants'
import type { 
  CreativeInspirationSession, 
  CreativeInspirationTopic, 
  CreativeInspirationAnalyzeRequest,
  CreativeInspirationResponse,
  XiaohongshuNote,
  ARKMessage
} from '@/lib/types'

// 用户认证和Cookie获取的通用函数（复用search API逻辑）
async function authenticateAndGetCookie(request: NextRequest): Promise<{ userId: string, userCookie: string }> {
  // 从Cookie中获取JWT令牌进行用户认证
  const token = request.cookies.get('auth_token')?.value
  
  if (!token) {
    throw new Error(ERROR_MESSAGES.AUTHENTICATION_FAILED)
  }

  // 验证JWT令牌
  const payload = verifyToken(token)
  if (!payload) {
    throw new Error(ERROR_MESSAGES.AUTHENTICATION_FAILED)
  }

  const userId = payload.userId

  // 从用户profile获取Cookie
  const { data: profile, error: profileError } = await getProfile(userId)
  if (profileError || !profile?.user_cookie) {
    throw new Error(ERROR_MESSAGES.COOKIE_NOT_SET)
  }

  return { userId, userCookie: profile.user_cookie }
}

// 输入验证函数
function validateIndustryInput(industry: string): { isValid: boolean, error?: string } {
  if (!industry || typeof industry !== 'string') {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_INPUT }
  }

  const trimmedIndustry = industry.trim()
  
  // 长度验证 - 已移除具体限制，只检查非空
  // if (trimmedIndustry.length < VALIDATION_RULES.INDUSTRY_MIN_LENGTH || 
  //     trimmedIndustry.length > VALIDATION_RULES.INDUSTRY_MAX_LENGTH) {
  //   return { isValid: false, error: ERROR_MESSAGES.INVALID_INPUT }
  // }

  // 字符格式验证
  if (!VALIDATION_RULES.INDUSTRY_PATTERN.test(trimmedIndustry)) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_INPUT }
  }

  // 禁用词检查
  const lowerIndustry = trimmedIndustry.toLowerCase()
  for (const word of VALIDATION_RULES.FORBIDDEN_WORDS) {
    if (lowerIndustry.includes(word.toLowerCase())) {
      return { isValid: false, error: ERROR_MESSAGES.FORBIDDEN_WORD }
    }
  }

  return { isValid: true }
}

// 解析AI返回的主题数据
function parseAITopicsResponse(aiContent: string): CreativeInspirationTopic[] {
  try {
    console.log('🔍 [AI主题解析] 开始解析AI返回内容，长度:', aiContent.length)
    
    // 提取JSON内容
    const jsonMatch = aiContent.match(PATTERNS.EXTRACT_JSON)
    if (!jsonMatch) {
      console.warn('⚠️ [AI主题解析] 未找到JSON格式内容')
      throw new Error('AI返回格式不正确')
    }

    const jsonStr = jsonMatch[0]
    console.log('🔍 [AI主题解析] 提取到JSON字符串，长度:', jsonStr.length)

    // 解析JSON
    const parsed = JSON.parse(jsonStr)
    
    // 验证结构
    if (!parsed.topics || !Array.isArray(parsed.topics)) {
      console.warn('⚠️ [AI主题解析] JSON结构不正确，缺少topics数组')
      throw new Error('AI返回数据结构不正确')
    }

    // 处理主题数据
    const topics: CreativeInspirationTopic[] = []
    const targetCount = Math.min(parsed.topics.length, API_CONFIG.TOPICS_COUNT)

    for (let i = 0; i < targetCount; i++) {
      const topic = parsed.topics[i]
      
      if (!topic.title || typeof topic.title !== 'string') {
        console.warn(`⚠️ [AI主题解析] 主题${i + 1}缺少有效标题`)
        continue
      }

      // 清理和验证数据
      const cleanedTopic = {
        id: '', // 将由数据库生成
        session_id: '', // 将在调用处设置
        title: topic.title.trim().replace(PATTERNS.CLEAN_TITLE, ''),
        description: topic.description ? 
          topic.description.trim().replace(PATTERNS.CLEAN_DESCRIPTION, ' ') : 
          `关于${topic.title}的创作主题`,
        keywords: Array.isArray(topic.keywords) ? 
          topic.keywords.filter((k: any) => k && typeof k === 'string').slice(0, 5) : 
          [],
        popularity_score: typeof topic.popularity === 'number' ? 
          Math.max(1, Math.min(100, topic.popularity)) : 
          DEFAULT_VALUES.TOPIC_POPULARITY,
        sort_order: i,
        created_at: new Date().toISOString()
      }

      topics.push(cleanedTopic)
    }

    console.log('✅ [AI主题解析] 解析成功:', topics.length, '个主题')
    return topics

  } catch (error) {
    console.error('❌ [AI主题解析] 解析失败:', error)
    
    // 返回默认主题
    console.log('🔄 [AI主题解析] 使用默认主题作为备用')
    return DEFAULT_VALUES.FALLBACK_TOPICS.map((topic, index) => ({
      id: '',
      session_id: '',
      title: topic.title,
      description: topic.description,
      keywords: [...topic.keywords],
      popularity_score: topic.popularity,
      sort_order: index,
      created_at: new Date().toISOString()
    }))
  }
}

// POST方法处理分析请求
export async function POST(request: NextRequest) {
  let sessionId: string | null = null

  try {
    console.log('🚀 [创作灵感分析] 收到分析请求')
    
    // 解析请求体
    const body = await request.json()
    const { industry } = body as CreativeInspirationAnalyzeRequest

    // 输入验证
    const validation = validateIndustryInput(industry)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: validation.error 
        },
        { status: 400 }
      )
    }

    const cleanIndustry = industry.trim()
    console.log('✅ [创作灵感分析] 输入验证通过，行业关键词:', cleanIndustry)

    // 用户认证和Cookie获取
    const { userId, userCookie } = await authenticateAndGetCookie(request)
    console.log('✅ [创作灵感分析] 用户认证成功，用户ID:', userId)

    // 积分检查
    const { data: profile } = await getProfile(userId)
    if (!profile || profile.credits < CREDITS_CONFIG.INDUSTRY_ANALYSIS) {
      return NextResponse.json(
        { 
          success: false,
          error: ERROR_MESSAGES.INSUFFICIENT_CREDITS 
        },
        { status: 400 }
      )
    }

    console.log('✅ [创作灵感分析] 积分检查通过，当前积分:', profile.credits)

    // 创建分析会话
    const sessionResult = await createCreativeInspirationSession({
      user_id: userId,
      industry: cleanIndustry,
      status: 'analyzing'
    })

    if (!sessionResult.success || !sessionResult.data) {
      throw new Error('创建分析会话失败')
    }

    sessionId = sessionResult.data.id
    console.log('✅ [创作灵感分析] 会话创建成功，会话ID:', sessionId)

    // 第一阶段：搜索热门内容
    console.log('🔍 [创作灵感分析] 开始搜索热门内容...')
    
    const xiaohongshuNotes = await searchXiaohongshuNotes(
      cleanIndustry,
      userCookie,
      SEARCH_CONFIG.INDUSTRY_ANALYSIS
    )

    if (!xiaohongshuNotes || xiaohongshuNotes.length === 0) {
      await updateCreativeInspirationSession(sessionId, {
        status: 'failed',
        error_message: '未找到相关内容'
      })
      
      return NextResponse.json(
        { 
          success: false,
          error: '未找到相关热门内容，请尝试其他关键词' 
        },
        { status: 404 }
      )
    }

    console.log('✅ [创作灵感分析] 搜索完成，找到', xiaohongshuNotes.length, '个内容')

    // 更新会话搜索结果数量
    await updateCreativeInspirationSession(sessionId, {
      search_results_count: xiaohongshuNotes.length
    })

    // 第二阶段：AI分析生成主题
    console.log('🤖 [创作灵感分析] 开始AI分析...')
    
    // 提取标题用于AI分析
    const titles = xiaohongshuNotes.map(note => note.note_display_title || '').filter(title => title.trim())
    
    if (titles.length === 0) {
      await updateCreativeInspirationSession(sessionId, {
        status: 'failed',
        error_message: '内容标题为空'
      })
      
      return NextResponse.json(
        { 
          success: false,
          error: '获取的内容标题为空，请尝试其他关键词' 
        },
        { status: 400 }
      )
    }

    // 构建AI分析消息
    const messages: ARKMessage[] = [
      {
        role: 'user',
        content: CREATIVE_INSPIRATION_PROMPT(cleanIndustry, titles)
      }
    ]

    // 调用ARK API进行AI分析
    let aiFullContent = ''
    let aiError: string | null = null

    const stream = await createStreamChatCompletion(messages)
    
    await parseStreamResponse(
      stream,
      (chunk) => {
        aiFullContent += chunk
      },
      (fullContent) => {
        aiFullContent = fullContent
        console.log('✅ [创作灵感分析] AI分析完成，内容长度:', aiFullContent.length)
      },
      (error) => {
        aiError = error
        console.error('❌ [创作灵感分析] AI分析失败:', error)
      }
    )

    if (aiError) {
      await updateCreativeInspirationSession(sessionId, {
        status: 'failed',
        error_message: aiError
      })
      
      return NextResponse.json(
        { 
          success: false,
          error: ERROR_MESSAGES.AI_ANALYSIS_ERROR 
        },
        { status: 500 }
      )
    }

    // 第三阶段：解析AI返回的主题
    console.log('📝 [创作灵感分析] 开始解析AI主题...')
    
    const topics = parseAITopicsResponse(aiFullContent)
    
    if (topics.length === 0) {
      await updateCreativeInspirationSession(sessionId, {
        status: 'failed',
        error_message: '未能生成有效主题'
      })
      
      return NextResponse.json(
        { 
          success: false,
          error: '生成主题失败，请稍后重试' 
        },
        { status: 500 }
      )
    }

    // 设置主题的会话ID
    const topicsWithSessionId = topics.map(topic => ({
      ...topic,
      session_id: sessionId!
    }))

    // 保存主题到数据库
    const topicsResult = await createCreativeInspirationTopics(topicsWithSessionId)
    
    if (!topicsResult.success) {
      await updateCreativeInspirationSession(sessionId, {
        status: 'failed',
        error_message: '保存主题失败'
      })
      
      return NextResponse.json(
        { 
          success: false,
          error: ERROR_MESSAGES.DATABASE_ERROR 
        },
        { status: 500 }
      )
    }

    // 第四阶段：消耗积分并完成会话
    console.log('💰 [创作灵感分析] 开始消耗积分...')
    
    const consumeResult = await consumeCredits(
      userId, 
      CREDITS_CONFIG.INDUSTRY_ANALYSIS, 
      `创作灵感分析 - ${cleanIndustry}`,
      undefined // 创作灵感分析不是批量任务，不关联taskId
    )
    
    if (!consumeResult.success) {
      // 积分消耗失败，但会话已创建，标记为失败
      await updateCreativeInspirationSession(sessionId, {
        status: 'failed',
        error_message: '积分消耗失败'
      })
      
      return NextResponse.json(
        { 
          success: false,
          error: '积分消耗失败，请稍后重试' 
        },
        { status: 500 }
      )
    }

    // 记录积分交易
    try {
      const connection = await getPool().getConnection()
      await connection.execute(
        'INSERT INTO credit_transactions (user_id, transaction_type, amount, reason) VALUES (?, ?, ?, ?)',
        [userId, 'consume', -CREDITS_CONFIG.INDUSTRY_ANALYSIS, `创作灵感分析 - ${cleanIndustry}`]
      )
      connection.release()
      console.log('✅ [创作灵感分析] 积分交易记录成功')
    } catch (transactionError) {
      console.error('⚠️ [创作灵感分析] 积分交易记录失败:', transactionError)
      // 不影响主流程，只记录错误
    }

    // 更新会话状态为完成
    await updateCreativeInspirationSession(sessionId, {
      status: 'completed',
      credits_consumed: CREDITS_CONFIG.INDUSTRY_ANALYSIS
    })

    console.log('✅ [创作灵感分析] 分析完成，积分消耗:', CREDITS_CONFIG.INDUSTRY_ANALYSIS)

    // 返回成功结果
    const response: CreativeInspirationResponse = {
      success: true,
      data: {
        session: sessionResult.data,
        topics: topicsResult.data || [],
        searchResults: xiaohongshuNotes // 直接使用原始搜索结果，保持XiaohongshuNote[]类型
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [创作灵感分析] 处理失败:', error)
    
    // 如果会话已创建，更新为失败状态
    if (sessionId) {
      await updateCreativeInspirationSession(sessionId, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : '未知错误'
      })
    }
    
    const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
    const statusCode = errorMessage.includes('认证') || errorMessage.includes('Cookie') ? 401 : 500
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage
      },
      { status: statusCode }
    )
  }
}

// 处理OPTIONS请求（CORS预检请求）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}