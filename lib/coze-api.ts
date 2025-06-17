import { 
  CozeSearchParams, 
  CozeApiResponse, 
  CozeDataResponse, 
  XiaohongshuNote, 
  Note, 
  SearchConfig 
} from './types'

// 环境变量配置
const COZE_API_URL = 'https://api.coze.cn/v1/workflow/run'
const COZE_API_TOKEN = process.env.COZE_API_TOKEN || ''
const COZE_WORKFLOW_ID = process.env.COZE_WORKFLOW_ID || '7511639630044119067'

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

    if (!COZE_WORKFLOW_ID) {
      throw new Error('Coze Workflow ID 未配置，请在 .env.local 文件中设置 COZE_WORKFLOW_ID')
    }

    // 构建请求参数
    const requestParams: CozeSearchParams = {
      cookieStr,
      keywords,
      noteType: config.noteType,
      sort: config.sort,
      totalNumber: config.totalNumber
    }

    console.log('发送Coze API请求:', {
      url: COZE_API_URL,
      workflow_id: COZE_WORKFLOW_ID,
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
        workflow_id: COZE_WORKFLOW_ID
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
        console.error('Coze API错误详情:', errorData)
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
      throw new Error(`API错误: ${apiResponse.msg}`)
    }

    // 解析data字段中的JSON字符串
    const dataResponse: CozeDataResponse = JSON.parse(apiResponse.data)

    // 检查内部数据状态
    if (dataResponse.code !== 0) {
      throw new Error(`数据错误: ${dataResponse.msg}`)
    }

    // 返回小红书笔记列表
    return dataResponse.data || []

  } catch (error) {
    console.error('搜索小红书笔记失败:', error)
    throw new Error(error instanceof Error ? error.message : '未知错误')
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