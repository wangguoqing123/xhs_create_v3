import { 
  CozeSearchParams, 
  CozeNoteDetailParams,
  CozeAuthorNotesParams,
  CozeApiResponse, 
  CozeDataResponse, 
  CozeNoteDetailResponse,
  NewFormatAuthorNotesResponse,
  NewFormatNote,
  NewFormatUserInfo,
  XiaohongshuNote, 
  XiaohongshuNoteDetail,
  AuthorNotesResult,
  AuthorInfo,
  Note, 
  NoteDetail,
  SearchConfig 
} from './types'

// 环境变量配置
const COZE_API_URL = 'https://api.coze.cn/v1/workflow/run'
const COZE_API_TOKEN = process.env.COZE_API_TOKEN || ''
// 搜索接口的工作流ID
const COZE_SEARCH_WORKFLOW_ID = process.env.COZE_SEARCH_WORKFLOW_ID || '7511639630044119067'
// 笔记详情接口的工作流ID
const COZE_DETAIL_WORKFLOW_ID = process.env.COZE_DETAIL_WORKFLOW_ID || '7511959723135762472'
// 作者笔记获取接口的工作流ID
const COZE_AUTHOR_NOTES_WORKFLOW_ID = '7519557885735469106'

/**
 * 调用Coze API获取小红书笔记数据
 * @param keywords 搜索关键词
 * @param cookieStr 用户cookie字符串
 * @param config 搜索配置
 * @returns Promise<XiaohongshuNote[]> 小红书笔记列表
 */
export async function searchXiaohongshuNotes(
  keywords: string,
  cookieStr: string,
  config: SearchConfig = {
    noteType: 0, // 默认全部类型
    sort: 0, // 默认综合排序
    totalNumber: 20 // 默认获取20条
  }
): Promise<XiaohongshuNote[]> {
  try {
    // 检查环境变量配置
    if (!COZE_API_TOKEN) {
      throw new Error('Coze API Token 未配置，请在项目根目录创建 .env.local 文件并设置 COZE_API_TOKEN')
    }

    if (!COZE_SEARCH_WORKFLOW_ID) {
      throw new Error('Coze搜索工作流ID 未配置，请在 .env.local 文件中设置 COZE_SEARCH_WORKFLOW_ID')
    }

    // 构建请求参数
    const requestParams: CozeSearchParams = {
      cookieStr,
      keywords,
      noteType: config.noteType,
      sort: config.sort,
      totalNumber: config.totalNumber
    }

    console.log('发送Coze搜索API请求:', {
      url: COZE_API_URL,
      workflow_id: COZE_SEARCH_WORKFLOW_ID,
      hasToken: !!COZE_API_TOKEN,
      tokenLength: COZE_API_TOKEN.length,
      keywords
    })

    // 发送API请求
    const response = await fetch(COZE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parameters: requestParams,
        workflow_id: COZE_SEARCH_WORKFLOW_ID
      })
    })

    // 检查HTTP响应状态
    if (!response.ok) {
      // 尝试获取详细错误信息
      let errorMessage = `HTTP错误: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`
        }
        console.error('Coze搜索API错误详情:', errorData)
      } catch (e) {
        console.error('无法解析错误响应:', e)
      }
      
      // 针对401错误提供特定提示
      if (response.status === 401) {
        errorMessage = 'Coze API认证失败，请检查以下配置：\n1. .env.local 文件中的 COZE_API_TOKEN 是否正确\n2. Token是否已过期\n3. Token是否有访问该工作流的权限'
      }
      
      throw new Error(errorMessage)
    }

    // 解析响应数据
    const apiResponse: CozeApiResponse = await response.json()

    // 检查API响应状态
    if (apiResponse.code !== 0) {
      throw new Error(`搜索API错误: ${apiResponse.msg}`)
    }

    // 解析data字段中的JSON字符串
    const dataResponse: CozeDataResponse = JSON.parse(apiResponse.data)

    // 检查内部数据状态
    if (dataResponse.code !== 0) {
      throw new Error(`搜索数据错误: ${dataResponse.msg}`)
    }

    // 返回小红书笔记列表
    return dataResponse.data || []

  } catch (error) {
    console.error('搜索小红书笔记失败:', error)
    throw new Error(error instanceof Error ? error.message : '未知错误')
  }
}

/**
 * 调用Coze API获取小红书笔记详情
 * @param noteUrl 笔记URL
 * @param cookieStr 用户cookie字符串
 * @returns Promise<XiaohongshuNoteDetail> 小红书笔记详情
 */
export async function fetchXiaohongshuNoteDetail(
  noteUrl: string,
  cookieStr: string
): Promise<XiaohongshuNoteDetail> {
  try {
    // 检查环境变量配置
    if (!COZE_API_TOKEN) {
      throw new Error('Coze API Token 未配置，请在项目根目录创建 .env.local 文件并设置 COZE_API_TOKEN')
    }

    if (!COZE_DETAIL_WORKFLOW_ID) {
      throw new Error('Coze详情工作流ID 未配置，请在 .env.local 文件中设置 COZE_DETAIL_WORKFLOW_ID')
    }

    // 构建请求参数
    const requestParams: CozeNoteDetailParams = {
      cookieStr,
      noteUrl
    }

    console.log('发送Coze详情API请求:', {
      url: COZE_API_URL,
      workflow_id: COZE_DETAIL_WORKFLOW_ID,
      hasToken: !!COZE_API_TOKEN,
      noteUrl
    })

    // 发送API请求
    const response = await fetch(COZE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parameters: requestParams,
        workflow_id: COZE_DETAIL_WORKFLOW_ID
      })
    })

    // 检查HTTP响应状态
    if (!response.ok) {
      let errorMessage = `HTTP错误: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`
        }
        console.error('Coze详情API错误详情:', errorData)
      } catch (e) {
        console.error('无法解析错误响应:', e)
      }
      
      if (response.status === 401) {
        errorMessage = 'Coze API认证失败，请检查Token配置'
      }
      
      throw new Error(errorMessage)
    }

    // 解析响应数据
    const apiResponse: CozeApiResponse = await response.json()

    // 检查API响应状态
    if (apiResponse.code !== 0) {
      throw new Error(`详情API错误: ${apiResponse.msg}`)
    }

    // 解析data字段中的JSON字符串
    const dataResponse: CozeNoteDetailResponse = JSON.parse(apiResponse.data)

    // 检查内部数据状态
    if (dataResponse.code !== 0) {
      throw new Error(`详情数据错误: ${dataResponse.msg}`)
    }

    // 返回小红书笔记详情
    if (!dataResponse.data?.note) {
      throw new Error('未获取到笔记详情数据')
    }

    return dataResponse.data.note

  } catch (error) {
    console.error('获取小红书笔记详情失败:', error)
    throw new Error(error instanceof Error ? error.message : '获取笔记详情失败')
  }
}

/**
 * 将小红书笔记详情数据转换为统一格式
 * @param xhsNoteDetail 小红书笔记详情
 * @returns NoteDetail 统一格式的笔记详情
 */
export function convertXiaohongshuNoteDetailToNoteDetail(xhsNoteDetail: XiaohongshuNoteDetail): NoteDetail {
  // 解析笔记描述，分离正文和标签
  const { content, tags } = parseNoteDescription(xhsNoteDetail.note_desc, xhsNoteDetail.note_tags)
  
  // 解析数字字符串，去除逗号分隔符
  const likeCount = parseInt(xhsNoteDetail.note_liked_count.replace(/,/g, '')) || 0
  const collectCount = parseInt(xhsNoteDetail.collected_count.replace(/,/g, '')) || 0
  const commentCount = parseInt(xhsNoteDetail.comment_count.replace(/,/g, '')) || 0
  const shareCount = parseInt(xhsNoteDetail.share_count.replace(/,/g, '')) || 0

  // 判断是否为视频笔记
  const isVideo = xhsNoteDetail.note_card_type === 'video' && !!xhsNoteDetail.video_id

  return {
    id: xhsNoteDetail.note_id,
    title: xhsNoteDetail.note_display_title,
    author: xhsNoteDetail.auther_nick_name,
    authorAvatar: xhsNoteDetail.auther_avatar,
    authorId: xhsNoteDetail.auther_user_id,
    content,
    tags,
    images: xhsNoteDetail.note_image_list || [],
    createTime: formatNoteTime(xhsNoteDetail.note_create_time),
    likeCount,
    collectCount,
    commentCount,
    shareCount,
    isLiked: xhsNoteDetail.note_liked,
    isCollected: xhsNoteDetail.collected,
    noteUrl: xhsNoteDetail.note_url,
    isVideo,
    videoDuration: xhsNoteDetail.note_duration || undefined,
    videoUrls: isVideo ? {
      h264: xhsNoteDetail.video_h264_url || undefined,
      h265: xhsNoteDetail.video_h265_url || undefined
    } : undefined
  }
}

/**
 * 解析笔记描述，分离正文内容和标签
 * @param noteDesc 笔记描述原文
 * @param noteTags 笔记标签数组
 * @returns { content: string, tags: string[] } 分离后的正文和标签
 */
function parseNoteDescription(noteDesc: string, noteTags: string[]): { content: string, tags: string[] } {
  // 移除描述中的话题标签（格式：#标签[话题]#）
  let content = noteDesc.replace(/#[^#]*\[话题\]#/g, '').trim()
  
  // 移除单独的话题标签（格式：#标签#）
  content = content.replace(/#[^#]*#/g, '').trim()
  
  // 清理多余的空行和空格
  content = content.replace(/\n{3,}/g, '\n\n').trim()
  
  // 如果处理后内容为空，使用原始描述的前100个字符
  if (!content) {
    content = noteDesc.substring(0, 100)
  }
  
  // 合并API返回的标签和从描述中提取的标签
  const extractedTags = extractHashtags(noteDesc)
  const allTags = [...new Set([...noteTags, ...extractedTags])]
  
  return {
    content,
    tags: allTags
  }
}

/**
 * 从文本中提取话题标签
 * @param text 文本内容
 * @returns string[] 提取的标签列表
 */
function extractHashtags(text: string): string[] {
  const hashtags: string[] = []
  
  // 匹配#标签[话题]#格式
  const topicMatches = text.match(/#([^#]*)\[话题\]#/g)
  if (topicMatches) {
    topicMatches.forEach(match => {
      const tag = match.replace(/#([^#]*)\[话题\]#/, '$1').trim()
      if (tag) {
        hashtags.push(tag)
      }
    })
  }
  
  // 匹配简单的#标签#格式
  const simpleMatches = text.match(/#([^#\[\]]+)#/g)
  if (simpleMatches) {
    simpleMatches.forEach(match => {
      const tag = match.replace(/#/g, '').trim()
      if (tag && !hashtags.includes(tag)) {
        hashtags.push(tag)
      }
    })
  }
  
  return hashtags
}

/**
 * 格式化笔记时间
 * @param timeStr 时间字符串
 * @returns string 格式化后的时间
 */
function formatNoteTime(timeStr: string): string {
  try {
    const date = new Date(timeStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    console.error('时间格式化失败:', error)
    return timeStr
  }
}

/**
 * 将小红书笔记数据转换为统一的Note格式
 * @param xiaohongshuNotes 小红书笔记列表
 * @returns Note[] 统一格式的笔记列表
 */
export function convertXiaohongshuNotesToNotes(xiaohongshuNotes: XiaohongshuNote[]): Note[] {
  return xiaohongshuNotes.map((xhsNote, index) => {
    // 解析点赞数（去除可能的逗号分隔符）
    const likesCount = parseInt(xhsNote.note_liked_count.replace(/,/g, '')) || 0
    
    // 生成模拟浏览量（通常比点赞数高3-5倍）
    const viewsCount = Math.floor(likesCount * (3 + Math.random() * 2))
    
    // 生成标签（基于标题关键词）
    const tags = generateTagsFromTitle(xhsNote.note_display_title || '')
    
    // 生成发布时间（随机近期时间）
    const publishTime = generateRandomRecentDate()

    return {
      id: xhsNote.note_id,
      title: xhsNote.note_display_title || ` `,
      cover: xhsNote.note_cover_url_default,
      author: xhsNote.auther_nick_name,
      likes: likesCount,
      views: viewsCount,
      content: generateContentPreview(xhsNote.note_display_title || ''),
      tags,
      publishTime,
      originalData: xhsNote // 保存原始数据
    }
  })
}

/**
 * 从标题生成标签
 * @param title 笔记标题
 * @returns string[] 标签列表
 */
function generateTagsFromTitle(title: string): string[] {
  const tags: string[] = []
  
  // 常见关键词映射
  const keywordMap: Record<string, string[]> = {
    '窗帘': ['家居', '装修', '软装'],
    '护肤': ['美妆', '护肤', '种草'],
    '减肥': ['健身', '减肥', '励志'],
    '穿搭': ['时尚', '穿搭', '搭配'],
    '美食': ['美食', '探店', '推荐'],
    '旅行': ['旅行', '攻略', '出游'],
    '职场': ['职场', '工作', '成长'],
    '装修': ['装修', '家居', '设计'],
    '化妆': ['美妆', '化妆', '教程'],
    '健身': ['健身', '运动', '锻炼']
  }

  // 遍历关键词映射，匹配标题
  for (const [keyword, relatedTags] of Object.entries(keywordMap)) {
    if (title.includes(keyword)) {
      tags.push(...relatedTags)
      break // 只匹配第一个关键词
    }
  }

  // 如果没有匹配到关键词，添加默认标签
  if (tags.length === 0) {
    tags.push('生活', '分享', '推荐')
  }

  // 去重并限制数量
  return [...new Set(tags)].slice(0, 3)
}

/**
 * 生成内容预览
 * @param title 笔记标题
 * @returns string 内容预览
 */
function generateContentPreview(title: string): string {
  const previews = [
    `${title}。今天给大家分享这个超棒的内容，真的太实用了！`,
    `关于${title}，我有很多心得想和大家分享...`,
    `${title}，这是我最近发现的宝藏内容，赶紧收藏！`,
    `分享一下${title}的经验，希望对大家有帮助。`,
    `${title}，看完这篇你就明白了！`
  ]
  
  return previews[Math.floor(Math.random() * previews.length)]
}

/**
 * 生成随机的近期日期
 * @returns string 格式化的日期字符串
 */
function generateRandomRecentDate(): string {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 30) // 最近30天内
  const randomDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  
  return randomDate.toISOString().split('T')[0] // 返回YYYY-MM-DD格式
}

/**
 * 获取笔记类型的中文描述
 * @param noteType 笔记类型
 * @returns string 中文描述
 */
export function getNoteTypeLabel(noteType: 0 | 1 | 2): string {
  const labels = {
    0: '全部',
    1: '视频',
    2: '图文'
  }
  return labels[noteType]
}

/**
 * 获取排序方式的中文描述
 * @param sort 排序方式
 * @returns string 中文描述
 */
export function getSortLabel(sort: 0 | 1 | 2): string {
  const labels = {
    0: '综合',
    1: '最新',
    2: '最热'
  }
  return labels[sort]
}

/**
 * 将新格式的笔记转换为XiaohongshuNote格式
 */
function convertNewFormatToXiaohongshuNote(newNote: NewFormatNote): XiaohongshuNote {
  return {
    auther_avatar: newNote.noteCard.user.avatar,
    auther_home_page_url: `https://www.xiaohongshu.com/user/profile/${newNote.noteCard.user.userId}`,
    auther_nick_name: newNote.noteCard.user.nickName,
    auther_user_id: newNote.noteCard.user.userId,
    note_card_type: newNote.noteCard.type === 'video' ? 'video' : 'normal',
    note_cover_height: newNote.noteCard.cover.height.toString(),
    note_cover_url_default: newNote.noteCard.cover.urlDefault,
    note_cover_url_pre: newNote.noteCard.cover.urlPre,
    note_cover_width: newNote.noteCard.cover.width.toString(),
    note_display_title: newNote.noteCard.displayTitle,
    note_id: newNote.noteCard.noteId,
    note_liked: newNote.noteCard.interactInfo.liked,
    note_liked_count: newNote.noteCard.interactInfo.likedCount,
    note_model_type: 'note',
    note_url: `https://www.xiaohongshu.com/explore/${newNote.noteCard.noteId}?xsec_token=${newNote.noteCard.xsecToken}`,
    note_xsec_token: newNote.noteCard.xsecToken
  }
}

/**
 * 将新格式的用户信息转换为AuthorInfo格式
 */
function convertNewFormatToAuthorInfo(newUser: NewFormatUserInfo): AuthorInfo {
  // 从interactions数组中提取数据
  const fansInfo = newUser.interactions.find(i => i.type === 'fans')
  const followsInfo = newUser.interactions.find(i => i.type === 'follows')
  const interactionInfo = newUser.interactions.find(i => i.type === 'interaction')
  
  // 安全地处理tags字段，确保它是字符串数组
  const safeTags: string[] = []
  if (Array.isArray(newUser.tags)) {
    for (const tag of newUser.tags) {
      if (typeof tag === 'string') {
        // 如果是字符串，直接添加
        safeTags.push(tag)
      } else if (tag && typeof tag === 'object') {
        // 如果是对象，尝试提取有用的字符串属性
        if (tag.name && typeof tag.name === 'string') {
          safeTags.push(tag.name)
        } else if (tag.text && typeof tag.text === 'string') {
          safeTags.push(tag.text)
        } else if (tag.title && typeof tag.title === 'string') {
          safeTags.push(tag.title)
        }
      }
    }
  }
  
  return {
    avatar: newUser.basicInfo.images,
    desc: newUser.basicInfo.desc || '',
    fans: fansInfo?.count || '0',
    follows: followsInfo?.count || '0',
    gender: newUser.basicInfo.gender === 1 ? '男' : newUser.basicInfo.gender === 2 ? '女' : '未知',
    interaction: interactionInfo?.count || '0',
    ip_location: newUser.basicInfo.ipLocation || '',
    nick_name: newUser.basicInfo.nickname,
    red_id: newUser.basicInfo.redId,
    tags: safeTags, // 使用安全处理后的标签数组
    user_id: '', // 新格式中没有这个字段，留空
    user_link_url: '' // 新格式中没有这个字段，留空
  }
}

/**
 * 调用Coze API获取作者笔记数据
 * @param userProfileUrl 作者主页链接
 * @param cookieStr 用户cookie字符串
 * @returns Promise<AuthorNotesResult> 作者信息和笔记列表
 */
export async function fetchAuthorNotes(
  userProfileUrl: string,
  cookieStr: string
): Promise<AuthorNotesResult> {
  try {
    // 检查环境变量配置
    if (!COZE_API_TOKEN) {
      throw new Error('Coze API Token 未配置，请在项目根目录创建 .env.local 文件并设置 COZE_API_TOKEN')
    }

    // 构建请求参数
    // 清理用户链接，移除可能的查询参数
    let cleanUserProfileUrl = userProfileUrl
    try {
      const url = new URL(userProfileUrl)
      // 只保留基本路径，移除查询参数
      cleanUserProfileUrl = `${url.origin}${url.pathname}`
      console.log('🔧 [作者笔记API] 清理后的URL:', {
        原始URL: userProfileUrl,
        清理后URL: cleanUserProfileUrl
      })
    } catch (urlError) {
      console.warn('⚠️ [作者笔记API] URL解析失败，使用原始URL:', urlError)
    }

    const requestParams: CozeAuthorNotesParams = {
      cookieStr,
      userProfileUrl: cleanUserProfileUrl
    }

    console.log('发送Coze作者笔记API请求:', {
      url: COZE_API_URL,
      workflow_id: COZE_AUTHOR_NOTES_WORKFLOW_ID,
      hasToken: !!COZE_API_TOKEN,
      tokenLength: COZE_API_TOKEN.length,
      userProfileUrl: cleanUserProfileUrl
    })

    // 发送API请求
    const response = await fetch(COZE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parameters: requestParams,
        workflow_id: COZE_AUTHOR_NOTES_WORKFLOW_ID
      })
    })

    // 检查HTTP响应状态
    if (!response.ok) {
      // 尝试获取详细错误信息
      let errorMessage = `HTTP错误: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`
        }
        console.error('Coze作者笔记API错误详情:', errorData)
      } catch (e) {
        console.error('无法解析错误响应:', e)
      }
      
      // 针对401错误提供特定提示
      if (response.status === 401) {
        errorMessage = 'Coze API认证失败，请检查Token配置'
      }
      
      throw new Error(errorMessage)
    }

    // 解析响应数据
    const apiResponse: CozeApiResponse = await response.json()
    console.log('🔍 [作者笔记API] 外层API响应:', {
      code: apiResponse.code,
      msg: apiResponse.msg,
      hasData: !!apiResponse.data,
      dataLength: apiResponse.data?.length
    })

    // 检查API响应状态
    if (apiResponse.code !== 0) {
      throw new Error(`作者笔记获取API错误: ${apiResponse.msg}`)
    }

    // 尝试解析data字段
    let dataResponse: any
    try {
      dataResponse = JSON.parse(apiResponse.data)
      console.log('🔍 [作者笔记API] 解析后的数据结构:', {
        type: typeof dataResponse,
        keys: Object.keys(dataResponse),
        hasNotes: 'notes' in dataResponse,
        hasUser: 'user' in dataResponse,
        hasOutput: 'output' in dataResponse,
        notesCount: dataResponse.notes?.length || dataResponse.output?.notes?.length || 0
      })
      
    } catch (parseError) {
      console.error('❌ [作者笔记API] 无法解析内层数据:', parseError)
      console.error('❌ [作者笔记API] 原始数据:', apiResponse.data)
      throw new Error('API返回数据格式错误，无法解析')
    }

    // 检查新格式 - {notes: [...], user: {...}}
    if (dataResponse.notes && dataResponse.user) {
      console.log('✅ [作者笔记API] 检测到新格式数据')
      const newFormatData = dataResponse as NewFormatAuthorNotesResponse
      
      console.log('🔍 [作者笔记API] 新格式数据详情:', {
        notesCount: newFormatData.notes.length,
        userName: newFormatData.user.basicInfo.nickname,
        userFans: newFormatData.user.interactions.find(i => i.type === 'fans')?.count,
        hasUserInfo: !!newFormatData.user.basicInfo
      })
      
      // 转换为标准格式
      const convertedNotes = newFormatData.notes.map(convertNewFormatToXiaohongshuNote)
      const convertedAuthorInfo = convertNewFormatToAuthorInfo(newFormatData.user)
      
      return {
        auther_info: convertedAuthorInfo,
        notes: convertedNotes
      }
    }

    // 检查是否是output包装格式 - {output: {notes: [...], user: {...}}}
    if (dataResponse.output && dataResponse.output.notes && dataResponse.output.user) {
      console.log('✅ [作者笔记API] 检测到output包装的新格式数据')
      const outputData = dataResponse.output as NewFormatAuthorNotesResponse
      
      // 转换为标准格式
      const convertedNotes = outputData.notes.map(convertNewFormatToXiaohongshuNote)
      const convertedAuthorInfo = convertNewFormatToAuthorInfo(outputData.user)
      
      return {
        auther_info: convertedAuthorInfo,
        notes: convertedNotes
      }
    }

    // 检查旧的output包装格式 - {output: {auther_info: {...}, notes: [...]}}
    if (dataResponse.output && dataResponse.output.auther_info) {
      console.log('✅ [作者笔记API] 检测到旧的output包装格式')
      const outputData = dataResponse.output
      
      // 检查作者信息是否有效
      if (!outputData.auther_info || outputData.auther_info.nick_name === null) {
        console.warn('⚠️ [作者笔记API] 作者信息为空或无效')
        throw new Error('无法获取作者信息，请检查链接是否正确或稍后重试')
      }
      
      return {
        auther_info: outputData.auther_info,
        notes: outputData.notes || []
      }
    }

    // 未知格式
    console.error('❌ [作者笔记API] 未知的数据格式:', dataResponse)
    throw new Error('API返回数据格式不正确')

  } catch (error) {
    console.error('获取作者笔记失败:', error)
    throw new Error(error instanceof Error ? error.message : '未知错误')
  }
} 